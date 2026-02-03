-- Migration to fix the foreign key in the documents table
-- The original initial schema had vehicle_id referencing profiles(id) instead of vehicles(id)

-- 1. Correct the foreign key reference
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_vehicle_id_fkey;
ALTER TABLE documents ADD CONSTRAINT documents_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;

-- 2. Ensure we have a storage bucket for documents (this is safe to run in SQL for Supabase)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up storage policies for the documents bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'documents' );

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'documents' );

CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'documents' AND (SELECT public.get_my_role()) = 'admin' );
