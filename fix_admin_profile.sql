-- RUN THIS IN SUPABASE SQL EDITOR
-- This script fixes the "PGRST116" error by ensuring the admin profile exists

INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    id, 
    email, 
    'Admin System', 
    'admin'
FROM auth.users
WHERE email = 'admin@miamicars.com'
ON CONFLICT (id) DO UPDATE
SET 
    role = 'admin',
    email = EXCLUDED.email;

-- Verify the fix
SELECT * FROM public.profiles WHERE email = 'admin@miamicars.com';
