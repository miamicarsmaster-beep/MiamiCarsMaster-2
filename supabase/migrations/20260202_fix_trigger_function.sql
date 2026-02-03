-- Asegurar que la columna existe
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- Actualizar la función con SEARCH PATH explícito y manejo robusto de tipos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, country)
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'full_name',
        -- Convertir explícitamente usando el esquema public y manejar nulos
        COALESCE(
            (NEW.raw_user_meta_data->>'role')::public.user_role, 
            'investor'::public.user_role
        ),
        NEW.raw_user_meta_data->>'country'
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Registrar el error (opcional) pero permitir que falle para ver el log en Supabase
        RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW; -- O RAISE EXCEPTION si queremos bloquear el registro
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
