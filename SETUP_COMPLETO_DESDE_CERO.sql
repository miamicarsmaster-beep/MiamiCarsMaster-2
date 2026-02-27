-- ============================================================================
-- MIAMI CARS PLATFORM - SETUP COMPLETO DESDE CERO
-- Ejecuta este script completo en Supabase SQL Editor
-- URL: https://app.supabase.com/project/kwcwifrqskmkingtdkqy/sql
-- ============================================================================

-- =====================================================
-- 1. CREAR TIPOS PERSONALIZADOS
-- =====================================================
CREATE TYPE user_role AS ENUM ('admin', 'investor');
CREATE TYPE vehicle_status AS ENUM ('available', 'rented', 'maintenance', 'inactive');
CREATE TYPE transaction_type AS ENUM ('expense', 'income');
CREATE TYPE document_type AS ENUM ('llc', 'vehicle_title', 'insurance', 'contract', 'other');
CREATE TYPE maintenance_status AS ENUM ('pending', 'completed');

-- =====================================================
-- 2. HABILITAR EXTENSIONES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 3. CREAR TABLAS
-- =====================================================

-- Tabla de perfiles (extiende auth.users de Supabase)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'investor',
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de vehículos
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    license_plate TEXT UNIQUE,
    vin TEXT UNIQUE,
    status vehicle_status NOT NULL DEFAULT 'available',
    assigned_investor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    image_url TEXT,
    purchase_date DATE,
    purchase_price DECIMAL(10, 2),
    mileage INTEGER DEFAULT 0,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de registros financieros (INCLUYE mileage_at_operation)
CREATE TABLE financial_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    proof_image_url TEXT,
    mileage_at_operation INTEGER,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar comentario a la columna
COMMENT ON COLUMN financial_records.mileage_at_operation 
IS 'Vehicle mileage at the time of the financial operation';

-- Tabla de mantenimientos
CREATE TABLE maintenances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    cost DECIMAL(10, 2),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    next_service_date DATE,
    next_service_mileage INTEGER,
    status maintenance_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de documentos
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    type document_type NOT NULL,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. CREAR ÍNDICES PARA MEJOR RENDIMIENTO
-- =====================================================
CREATE INDEX idx_vehicles_investor ON vehicles(assigned_investor_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_financial_records_vehicle ON financial_records(vehicle_id);
CREATE INDEX idx_financial_records_date ON financial_records(date);
CREATE INDEX idx_maintenances_vehicle ON maintenances(vehicle_id);
CREATE INDEX idx_maintenances_status ON maintenances(status);
CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_documents_vehicle ON documents(vehicle_id);

-- =====================================================
-- 5. CREAR FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at en todas las tablas
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at 
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_records_updated_at 
    BEFORE UPDATE ON financial_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenances_updated_at 
    BEFORE UPDATE ON maintenances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil al registrarse
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. FUNCIÓN HELPER PARA RLS
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
    SELECT role::TEXT 
    FROM public.profiles 
    WHERE id = auth.uid()
    LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =====================================================
-- 8. POLÍTICAS RLS PARA PROFILES
-- =====================================================
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (public.get_my_role() = 'admin');

CREATE POLICY "Admins can insert profiles"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Admins can update any profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (public.get_my_role() = 'admin');

-- =====================================================
-- 9. POLÍTICAS RLS PARA VEHICLES
-- =====================================================
CREATE POLICY "Investors can view assigned vehicles"
    ON vehicles FOR SELECT
    TO authenticated
    USING (
        assigned_investor_id = auth.uid()
        OR
        public.get_my_role() = 'admin'
    );

CREATE POLICY "Admins can insert vehicles"
    ON vehicles FOR INSERT
    TO authenticated
    WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Admins can update vehicles"
    ON vehicles FOR UPDATE
    TO authenticated
    USING (public.get_my_role() = 'admin');

CREATE POLICY "Admins can delete vehicles"
    ON vehicles FOR DELETE
    TO authenticated
    USING (public.get_my_role() = 'admin');

-- =====================================================
-- 10. POLÍTICAS RLS PARA FINANCIAL_RECORDS
-- =====================================================
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

-- ✅ POLÍTICA CLAVE: Permite a inversores insertar registros para sus vehículos
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

CREATE POLICY "Admins can update financial records"
    ON financial_records FOR UPDATE
    TO authenticated
    USING (public.get_my_role() = 'admin');

CREATE POLICY "Admins can delete financial records"
    ON financial_records FOR DELETE
    TO authenticated
    USING (public.get_my_role() = 'admin');

-- =====================================================
-- 11. POLÍTICAS RLS PARA MAINTENANCES
-- =====================================================
CREATE POLICY "Investors can view own vehicle maintenance"
    ON maintenances FOR SELECT
    TO authenticated
    USING (
        vehicle_id IN (
            SELECT id FROM vehicles WHERE assigned_investor_id = auth.uid()
        )
        OR
        public.get_my_role() = 'admin'
    );

CREATE POLICY "Admins can insert maintenances"
    ON maintenances FOR INSERT
    TO authenticated
    WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Admins can update maintenances"
    ON maintenances FOR UPDATE
    TO authenticated
    USING (public.get_my_role() = 'admin');

CREATE POLICY "Admins can delete maintenances"
    ON maintenances FOR DELETE
    TO authenticated
    USING (public.get_my_role() = 'admin');

-- =====================================================
-- 12. POLÍTICAS RLS PARA DOCUMENTS
-- =====================================================
CREATE POLICY "Users can view own documents"
    ON documents FOR SELECT
    TO authenticated
    USING (
        owner_id = auth.uid()
        OR
        vehicle_id IN (
            SELECT id FROM vehicles WHERE assigned_investor_id = auth.uid()
        )
        OR
        public.get_my_role() = 'admin'
    );

CREATE POLICY "Admins can insert documents"
    ON documents FOR INSERT
    TO authenticated
    WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Admins can update documents"
    ON documents FOR UPDATE
    TO authenticated
    USING (public.get_my_role() = 'admin');

CREATE POLICY "Admins can delete documents"
    ON documents FOR DELETE
    TO authenticated
    USING (public.get_my_role() = 'admin');

-- ============================================================================
-- ✅ SETUP COMPLETO
-- ============================================================================
-- Ahora necesitas:
-- 1. Crear tu usuario en Authentication > Users
-- 2. Ejecutar este SQL para hacerlo admin:
--    UPDATE profiles SET role = 'admin'::user_role WHERE email = 'TU_EMAIL';
-- ============================================================================
