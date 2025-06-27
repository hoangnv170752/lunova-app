-- SQL script to remove foreign key constraints to users.id
-- Created: 2025-06-27

-- First, identify all foreign key constraints referencing users.id
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT
            tc.constraint_name,
            tc.table_name,
            kcu.column_name
        FROM
            information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
        WHERE
            tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'users'
            AND ccu.column_name = 'id'
    ) LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', r.table_name, r.constraint_name);
        RAISE NOTICE 'Dropped foreign key constraint % on table %', r.constraint_name, r.table_name;
    END LOOP;
END $$;

-- Update RLS policies to use auth.jwt() instead of querying users table
DROP POLICY IF EXISTS products_modify_policy ON products;
CREATE POLICY products_modify_policy ON products
  USING (shop_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (shop_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS orders_policy ON orders;
CREATE POLICY orders_policy ON orders
  USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS tryon_images_select_policy ON product_tryon_images;
CREATE POLICY tryon_images_select_policy ON product_tryon_images
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND p.shop_id = auth.uid()) OR
    auth.jwt() ->> 'role' = 'admin'
  );

DROP POLICY IF EXISTS tryon_images_modify_policy ON product_tryon_images;
CREATE POLICY tryon_images_modify_policy ON product_tryon_images
  USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- Add RLS for tickets table
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY tickets_user_policy ON tickets
  USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- Add RLS for ticket_responses table
ALTER TABLE ticket_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY ticket_responses_policy ON ticket_responses
  USING (
    user_id = auth.uid() OR 
    auth.jwt() ->> 'role' = 'admin' OR
    EXISTS (SELECT 1 FROM tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid() OR 
    auth.jwt() ->> 'role' = 'admin'
  );

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Successfully removed all foreign key constraints to users.id and updated RLS policies';
END $$;
