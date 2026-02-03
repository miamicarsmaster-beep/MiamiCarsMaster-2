-- Migration to change 'type' column to TEXT and unify documents table
-- This removes the rigid enum constraint which is causing errors

-- 1. Change the 'type' column from ENUM to TEXT
ALTER TABLE documents ALTER COLUMN type TYPE TEXT;

-- 2. Ensure columns are consistent
ALTER TABLE documents ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id);

-- 3. Fix the vehicle_id foreign key if it's still wrong
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_vehicle_id_fkey;
ALTER TABLE documents ADD CONSTRAINT documents_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;
