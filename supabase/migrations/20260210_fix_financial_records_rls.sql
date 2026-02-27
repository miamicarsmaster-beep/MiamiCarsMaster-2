-- Fix RLS policies for financial_records to allow authenticated users to insert records
-- This fixes the "new row violates row-level security policy" error

-- Drop existing policies
DROP POLICY IF EXISTS "Investors can view own vehicle finances" ON financial_records;
DROP POLICY IF EXISTS "Admins can insert financial records" ON financial_records;
DROP POLICY IF EXISTS "Admins can update financial records" ON financial_records;
DROP POLICY IF EXISTS "Admins can delete financial records" ON financial_records;

-- Allow investors to view financial records of their assigned vehicles
CREATE POLICY "Investors can view own vehicle finances"
    ON financial_records FOR SELECT
    TO authenticated
    USING (
        vehicle_id IN (
            SELECT id FROM vehicles WHERE assigned_investor_id = auth.uid()
        )
        OR
        public.get_my_role() = 'admin'
    );

-- Allow authenticated users (admins and investors) to insert financial records
-- Admins can insert for any vehicle, investors can only insert for their assigned vehicles
CREATE POLICY "Users can insert financial records"
    ON financial_records FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_my_role() = 'admin'
        OR
        vehicle_id IN (
            SELECT id FROM vehicles WHERE assigned_investor_id = auth.uid()
        )
    );

-- Allow admins to update any financial record
CREATE POLICY "Admins can update financial records"
    ON financial_records FOR UPDATE
    TO authenticated
    USING (public.get_my_role() = 'admin')
    WITH CHECK (public.get_my_role() = 'admin');

-- Allow admins to delete any financial record
CREATE POLICY "Admins can delete financial records"
    ON financial_records FOR DELETE
    TO authenticated
    USING (public.get_my_role() = 'admin');
