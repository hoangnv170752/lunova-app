#!/usr/bin/env python3
"""
Script to sync all PostgreSQL tables to Qdrant vector database.
This script automatically detects all tables in the database and syncs them to Qdrant.
"""

import os
import sys
import importlib
import inspect
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from sqlalchemy import inspect as sqlalchemy_inspect

from models.database import SessionLocal, Base, engine
from services.qdrant_service import QdrantService

# Load environment variables
load_dotenv()

def get_all_models():
    """
    Dynamically discover all SQLAlchemy models in the models package.
    Returns a list of model classes.
    """
    models = []
    
    # Get all model modules
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    for filename in os.listdir(models_dir):
        if filename.endswith('.py') and filename != '__init__.py' and filename != 'database.py':
            module_name = filename[:-3]  # Remove .py extension
            
            try:
                # Import the module
                module = importlib.import_module(f"models.{module_name}")
                
                # Find all classes in the module that are SQLAlchemy models
                for name, obj in inspect.getmembers(module):
                    if inspect.isclass(obj) and issubclass(obj, Base) and obj != Base:
                        models.append(obj)
                        print(f"Found model: {obj.__name__} (table: {obj.__tablename__})")
            except ImportError as e:
                print(f"Error importing module {module_name}: {e}", file=sys.stderr)
    
    return models

def sync_all_tables(recreate=True):
    """
    Sync all tables to Qdrant.
    
    Args:
        recreate: If True, will delete existing collections before recreating them
    """
    # Initialize Qdrant service
    qdrant_service = QdrantService()
    
    # Get all models
    models = get_all_models()
    
    if not models:
        print("No models found. Make sure your models are properly defined.")
        return
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Process each model
        for model in models:
            table_name = model.__tablename__
            print(f"\n{'='*50}")
            print(f"Processing table: {table_name}")
            print(f"{'='*50}")
            
            try:
                # Get the primary key columns to check if the table has data
                inspector = sqlalchemy_inspect(engine)
                pk_columns = inspector.get_pk_constraint(table_name)['constrained_columns']
                
                # Check if table has data
                if not pk_columns:
                    print(f"Warning: Table {table_name} has no primary key. Skipping.")
                    continue
                
                # Get text fields for better embedding
                text_fields = []
                for column in inspector.get_columns(table_name):
                    col_type = str(column['type']).lower()
                    # Include text-like columns for embedding
                    if any(text_type in col_type for text_type in ['varchar', 'text', 'char', 'string']):
                        text_fields.append(column['name'])
                
                print(f"Using text fields for embedding: {', '.join(text_fields) if text_fields else 'None found, using all fields'}")
                
                # Push table to Qdrant
                qdrant_service.push_table_to_qdrant(
                    db=db,
                    model=model,
                    text_fields=text_fields if text_fields else None,
                    batch_size=100,
                    recreate=recreate
                )
                
                print(f"Successfully synced table {table_name} to Qdrant")
                
            except Exception as e:
                print(f"Error syncing table {table_name}: {e}", file=sys.stderr)
    
    finally:
        db.close()

def main():
    """
    Main function to run the script.
    """
    print("Starting sync of all PostgreSQL tables to Qdrant...")
    
    # Check environment variables
    qdrant_url = os.getenv("QDRANT_API_URL")
    if not qdrant_url:
        print("Error: QDRANT_API_URL environment variable not set", file=sys.stderr)
        sys.exit(1)
    
    try:
        sync_all_tables()
        print("\nAll tables successfully synced to Qdrant!")
    except Exception as e:
        print(f"Error during sync: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
