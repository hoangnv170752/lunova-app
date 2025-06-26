from models.database import engine
import os

def update_foreign_key():
    # Read the SQL file
    with open('update_product_fk.sql', 'r') as file:
        sql = file.read()
    
    # Execute the SQL commands
    with engine.begin() as conn:
        conn.execute(sql)
    
    print("Foreign key constraint updated successfully!")

if __name__ == "__main__":
    # Make sure we're in the right directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    update_foreign_key()
