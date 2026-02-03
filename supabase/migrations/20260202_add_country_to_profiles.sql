-- Add country column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- Update the handle_new_user function to include country
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, country)
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'full_name',
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'investor'),
        NEW.raw_user_meta_data->>'country'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;