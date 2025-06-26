-- First drop the existing foreign key constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_shop_id_fkey;

-- Then add the correct foreign key constraint to the shops table
ALTER TABLE products ADD CONSTRAINT products_shop_id_fkey 
FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE;
