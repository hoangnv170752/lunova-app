from qdrant_client import QdrantClient
from qdrant_client.http import models
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from sqlalchemy import inspect
import json
import hashlib
import numpy as np
from typing import List, Dict, Any, Optional, Type
from sqlalchemy.ext.declarative import DeclarativeMeta

# Load environment variables
load_dotenv()

class QdrantService:
    def __init__(self):
        """Initialize the Qdrant service with environment variables."""
        self.qdrant_url = os.getenv("QDRANT_API_URL")
        self.qdrant_api_key = os.getenv("QDRANT_API_KEY")
        
        if not self.qdrant_url:
            raise ValueError("QDRANT_API_URL environment variable not set")
            
        # Initialize Qdrant client
        self.client = QdrantClient(
            url=self.qdrant_url,
            api_key=self.qdrant_api_key if self.qdrant_api_key else None
        )
        
        # Vector dimension for our simple embedding approach
        self.vector_size = 768  # Standard size compatible with many models
        
    def _get_table_schema(self, model: Type[DeclarativeMeta]) -> Dict[str, str]:
        """Get the schema of a SQLAlchemy model."""
        inspector = inspect(model)
        schema = {}
        for column in inspector.columns:
            schema[column.name] = str(column.type)
        return schema
        
    def _convert_to_text(self, record: Dict[str, Any]) -> str:
        """Convert a record to text for embedding."""
        text_parts = []
        for key, value in record.items():
            if value is not None:
                text_parts.append(f"{key}: {value}")
        return " ".join(text_parts)
        
    def _simple_text_embedding(self, text: str) -> List[float]:
        """
        Create a simple deterministic embedding for text without requiring ML models.
        This is a placeholder for sentence-transformers and should be replaced with
        a proper embedding model in production.
        """
        # Create a deterministic hash-based embedding
        hash_obj = hashlib.sha256(text.encode())
        hash_bytes = hash_obj.digest()
        
        # Convert hash to a list of floats
        np.random.seed(int.from_bytes(hash_bytes[:4], byteorder='big'))
        embedding = np.random.normal(0, 1, self.vector_size).tolist()
        
        # Normalize the embedding
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = [x / norm for x in embedding]
            
        return embedding
        
    def _prepare_payload(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare the payload for Qdrant by handling non-serializable types."""
        payload = {}
        for key, value in record.items():
            # Handle UUID, datetime, and other special types
            if hasattr(value, '__str__'):
                payload[key] = str(value)
            else:
                try:
                    # Test if value is JSON serializable
                    json.dumps(value)
                    payload[key] = value
                except (TypeError, OverflowError):
                    # If not serializable, convert to string
                    payload[key] = str(value)
        return payload
        
    def delete_collection(self, collection_name: str) -> bool:
        """Delete a collection in Qdrant if it exists using direct REST API call."""
        import requests
        
        # Build the URL for the collection
        url = f"{self.qdrant_url}/collections/{collection_name}"
        
        # Set up headers
        headers = {}
        if self.qdrant_api_key:
            headers['api-key'] = self.qdrant_api_key
        
        try:
            # Check if collection exists by making a HEAD request
            response = requests.head(url, headers=headers)
            
            if response.status_code == 200:
                # Collection exists, delete it
                delete_response = requests.delete(url, headers=headers)
                
                if delete_response.status_code == 200:
                    print(f"Deleted existing collection {collection_name}")
                    return True
                else:
                    print(f"Failed to delete collection {collection_name}: {delete_response.text}")
                    return False
            elif response.status_code == 404:
                # Collection doesn't exist
                print(f"Collection {collection_name} does not exist")
                return True  # Return True since the end state is what we want (no collection)
            else:
                print(f"Unexpected status when checking collection {collection_name}: {response.status_code}")
                return False
        except Exception as e:
            print(f"Error checking/deleting collection {collection_name}: {e}")
            return False
    
    def create_collection(self, collection_name: str, vector_size: int = None, recreate: bool = False) -> None:
        """Create a collection in Qdrant, optionally recreating it if it exists."""
        if recreate:
            self.delete_collection(collection_name)
        
        try:
            # Check if collection exists
            self.client.get_collection(collection_name=collection_name)
            print(f"Collection {collection_name} already exists")
        except Exception:
            # Create collection if it doesn't exist
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(
                    size=vector_size or self.vector_size,
                    distance=models.Distance.COSINE
                )
            )
            print(f"Created collection {collection_name}")
            
    def push_table_to_qdrant(
        self, 
        db: Session, 
        model: Type[DeclarativeMeta], 
        collection_name: Optional[str] = None,
        batch_size: int = 100,
        text_fields: Optional[List[str]] = None,
        recreate: bool = False
    ) -> None:
        """
        Push a PostgreSQL table to Qdrant.
        
        Args:
            db: SQLAlchemy database session
            model: SQLAlchemy model class
            collection_name: Name of the Qdrant collection (defaults to model's __tablename__)
            batch_size: Number of records to process in each batch
            text_fields: List of fields to use for generating embeddings (defaults to all fields)
        """
        # Get collection name from model if not provided
        if not collection_name:
            collection_name = model.__tablename__
            
        # Create collection if it doesn't exist, or recreate if specified
        self.create_collection(collection_name, recreate=recreate)
        
        # Get table schema
        schema = self._get_table_schema(model)
        
        # Query all records from the table
        records = db.query(model).all()
        
        if not records:
            print(f"No records found in table {model.__tablename__}")
            return
            
        # Process records in batches
        total_records = len(records)
        for i in range(0, total_records, batch_size):
            batch = records[i:i+batch_size]
            
            points = []
            for idx, record in enumerate(batch):
                # Convert SQLAlchemy model to dictionary
                record_dict = {c.name: getattr(record, c.name) for c in inspect(model).columns}
                
                # Filter fields for text embedding if specified
                if text_fields:
                    text_data = {k: v for k, v in record_dict.items() if k in text_fields and v is not None}
                else:
                    text_data = record_dict
                
                # Generate text for embedding
                text = self._convert_to_text(text_data)
                
                # Generate simple embedding
                embedding = self._simple_text_embedding(text)
                
                # Prepare payload
                payload = self._prepare_payload(record_dict)
                
                # Create point
                point = models.PointStruct(
                    id=i + idx,
                    vector=embedding,  # embedding is already a list
                    payload=payload
                )
                points.append(point)
            
            # Upsert points to Qdrant
            self.client.upsert(
                collection_name=collection_name,
                points=points
            )
            
            print(f"Processed {min(i+batch_size, total_records)}/{total_records} records")
            
        print(f"Successfully pushed {total_records} records to collection {collection_name}")
        
    def search_similar(
        self, 
        collection_name: str, 
        query_text: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for similar records in Qdrant.
        
        Args:
            collection_name: Name of the Qdrant collection
            query_text: Text to search for
            limit: Maximum number of results to return
            
        Returns:
            List of matching records with similarity scores
        """
        # Generate simple embedding for query text
        query_vector = self._simple_text_embedding(query_text)
        
        # Search in Qdrant
        search_result = self.client.search(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=limit
        )
        
        # Format results
        results = []
        for result in search_result:
            item = {
                "score": result.score,
                "payload": result.payload
            }
            results.append(item)
            
        return results
