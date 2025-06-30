import os
import sys
import json
import boto3
import requests
from datetime import datetime
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
import numpy as np
import hashlib
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Environment variables
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
QDRANT_API_URL = os.getenv("QDRANT_API_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

# Tables to sync
TABLES_TO_SYNC = ["products", "shops"]

class QdrantSyncService:
    def __init__(self):
        self.qdrant_api_url = QDRANT_API_URL
        self.qdrant_api_key = QDRANT_API_KEY
        self.headers = {
            "Content-Type": "application/json",
            "api-key": self.qdrant_api_key
        }
    
    def _simple_text_embedding(self, text):
        """
        Generate a simple deterministic embedding for text using hash function.
        This is a simplified approach that doesn't require ML models.
        """
        if not text or not isinstance(text, str):
            text = ""
        
        # Use a hash function to generate a deterministic vector
        # Convert text to bytes for hashing
        text_bytes = text.encode('utf-8')
        
        # Generate a fixed number of "random" but deterministic values
        vector_size = 384  # Dimension of the embedding vector
        vector = []
        
        for i in range(vector_size):
            # Create a unique seed for each dimension
            seed = hashlib.md5(text_bytes + str(i).encode('utf-8')).digest()
            # Convert to a float between -1 and 1
            value = (int.from_bytes(seed[:4], byteorder='big') / (2**32 - 1)) * 2 - 1
            vector.append(value)
        
        # Normalize the vector to unit length
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = [v / norm for v in vector]
        
        return vector
    
    def delete_collection(self, collection_name):
        """Delete a collection in Qdrant if it exists."""
        try:
            url = f"{self.qdrant_api_url}/collections/{collection_name}"
            response = requests.delete(url, headers=self.headers)
            
            if response.status_code == 200:
                logger.info(f"Collection '{collection_name}' deleted successfully")
                return True
            elif response.status_code == 404:
                logger.info(f"Collection '{collection_name}' does not exist")
                return True
            else:
                logger.error(f"Failed to delete collection '{collection_name}': {response.status_code} - {response.text}")
                return False
        except Exception as e:
            logger.error(f"Error deleting collection '{collection_name}': {str(e)}")
            return False
    
    def create_collection(self, collection_name, recreate=False):
        """Create a collection in Qdrant."""
        # Delete collection if recreate is True
        if recreate:
            self.delete_collection(collection_name)
        
        try:
            url = f"{self.qdrant_api_url}/collections/{collection_name}"
            payload = {
                "vectors": {
                    "size": 384,
                    "distance": "Cosine"
                }
            }
            
            response = requests.put(url, headers=self.headers, json=payload)
            
            if response.status_code == 200:
                logger.info(f"Collection '{collection_name}' created successfully")
                return True
            else:
                logger.error(f"Failed to create collection '{collection_name}': {response.status_code} - {response.text}")
                return False
        except Exception as e:
            logger.error(f"Error creating collection '{collection_name}': {str(e)}")
            return False
    
    def push_data_to_qdrant(self, collection_name, records, text_fields=None):
        """Push data to Qdrant collection."""
        if not records:
            logger.info(f"No records to push to collection '{collection_name}'")
            return True
        
        try:
            # Process records in batches
            batch_size = 100
            total_records = len(records)
            
            for i in range(0, total_records, batch_size):
                batch = records[i:i+batch_size]
                points = []
                
                for idx, record in enumerate(batch):
                    # Generate text for embedding
                    if text_fields:
                        text_values = [str(record.get(field, "")) for field in text_fields if field in record]
                    else:
                        # Use all string fields
                        text_values = [str(value) for key, value in record.items() 
                                      if isinstance(value, (str, int, float)) and value]
                    
                    text_for_embedding = " ".join(text_values)
                    
                    # Generate embedding
                    vector = self._simple_text_embedding(text_for_embedding)
                    
                    # Create point
                    point = {
                        "id": idx + i,
                        "vector": vector,
                        "payload": record
                    }
                    points.append(point)
                
                # Push batch to Qdrant
                url = f"{self.qdrant_api_url}/collections/{collection_name}/points"
                payload = {"points": points}
                
                response = requests.put(url, headers=self.headers, json=payload)
                
                if response.status_code != 200:
                    logger.error(f"Failed to push batch to collection '{collection_name}': {response.status_code} - {response.text}")
                    return False
                
                logger.info(f"Pushed batch {i//batch_size + 1}/{(total_records-1)//batch_size + 1} to collection '{collection_name}'")
            
            return True
        except Exception as e:
            logger.error(f"Error pushing data to collection '{collection_name}': {str(e)}")
            return False

def get_db_connection():
    """Create a connection to the PostgreSQL database."""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return conn
    except Exception as e:
        logger.error(f"Error connecting to database: {str(e)}")
        return None

def fetch_table_data(conn, table_name):
    """Fetch all data from a table."""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(f"SELECT * FROM {table_name}")
            records = cursor.fetchall()
            # Convert RealDictRow objects to regular dictionaries
            return [dict(record) for record in records]
    except Exception as e:
        logger.error(f"Error fetching data from table '{table_name}': {str(e)}")
        return []

def sync_table_to_qdrant(qdrant_service, table_name, records, recreate=False):
    """Sync a table to Qdrant."""
    # Create or recreate collection
    if not qdrant_service.create_collection(table_name, recreate=recreate):
        return False
    
    # Define text fields based on table name
    text_fields = None
    if table_name == "products":
        text_fields = ["name", "description", "category", "subcategory", "material"]
    elif table_name == "shops":
        text_fields = ["name", "description", "category", "address"]
    
    # Push data to Qdrant
    return qdrant_service.push_data_to_qdrant(table_name, records, text_fields)

def lambda_handler(event, context):
    """AWS Lambda handler function."""
    try:
        # Initialize Qdrant service
        qdrant_service = QdrantSyncService()
        
        # Connect to database
        conn = get_db_connection()
        if not conn:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'Failed to connect to database'})
            }
        
        results = {}
        
        # Sync each table
        for table_name in TABLES_TO_SYNC:
            try:
                logger.info(f"Syncing table '{table_name}' to Qdrant")
                
                # Fetch data from table
                records = fetch_table_data(conn, table_name)
                
                if not records:
                    logger.warning(f"No records found in table '{table_name}'")
                    results[table_name] = "No records found"
                    continue
                
                # Sync to Qdrant
                success = sync_table_to_qdrant(qdrant_service, table_name, records, recreate=True)
                
                if success:
                    logger.info(f"Successfully synced table '{table_name}' to Qdrant")
                    results[table_name] = f"Synced {len(records)} records"
                else:
                    logger.error(f"Failed to sync table '{table_name}' to Qdrant")
                    results[table_name] = "Failed to sync"
            except Exception as e:
                logger.error(f"Error syncing table '{table_name}': {str(e)}")
                results[table_name] = f"Error: {str(e)}"
        
        # Close database connection
        conn.close()
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'PostgreSQL to Qdrant sync completed',
                'timestamp': datetime.now().isoformat(),
                'results': results
            })
        }
    except Exception as e:
        logger.error(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

# For local testing
if __name__ == "__main__":
    result = lambda_handler(None, None)
    print(json.dumps(result, indent=2))
