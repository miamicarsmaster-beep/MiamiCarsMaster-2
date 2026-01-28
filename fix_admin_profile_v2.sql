-- UPDATED DIAGNOSTIC SCRIPT
-- Run this to check if the user exists and manually insert the profile

-- 1. Check if the user exists in auth.users
SELECT id, email, created_at FROM auth.users WHERE email = 'admin@miamicars.com';

-- 2. Check if a profile exists
SELECT * FROM public.profiles WHERE email = 'admin@miamicars.com';

-- 3. FORCE INSERT (if user exists)
-- Replace 'USER_ID_FROM_STEP_1' with the actual ID you get from step 1 if the script below doesn't work automatically.

DO $$
DECLARE
    target_user_id uuid;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'admin@miamicars.com';
    
    IF target_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (target_user_id, 'admin@miamicars.com', 'System Admin', 'admin')
        ON CONFLICT (id) DO UPDATE
        SET role = 'admin';
        RAISE NOTICE 'Profile inserted/updated for ID %', target_user_id;
    ELSE
        RAISE NOTICE 'User admin@miamicars.com NOT FOUND in auth.users';
    END IF;
END $$;
