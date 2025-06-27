from models.database import engine
import os
from sqlalchemy import text

def update_foreign_key():
    # Read the SQL file
    with open('update_product_fk.sql', 'r') as file:
        sql = file.read()
    
    # Execute the SQL commands
    with engine.begin() as conn:
        conn.execute(text(sql))
    
    print("Foreign key constraint updated successfully!")

def remove_user_foreign_keys():
    # Read the SQL file to remove user foreign keys
    with open('remove_user_fk.sql', 'r') as file:
        sql = file.read()
    
    # Execute the SQL commands
    with engine.begin() as conn:
        conn.execute(text(sql))
    
    print("User foreign key constraints removed successfully!")

if __name__ == "__main__":
    # Make sure we're in the right directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Update product foreign keys
    update_foreign_key()
    
    # Remove user foreign key constraints
    remove_user_foreign_keys()
