-- Allow public users to view available vehicles on the landing page
CREATE POLICY "Public can view available vehicles"
    ON vehicles FOR SELECT
    USING (status = 'available');
