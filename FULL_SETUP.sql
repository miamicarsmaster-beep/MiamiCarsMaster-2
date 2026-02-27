-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'investor');
CREATE TYPE vehicle_status AS ENUM ('available', 'rented', 'maintenance', 'inactive');
CREATE TYPE transaction_type AS ENUM ('expense', 'income');
CREATE TYPE document_type AS ENUM ('llc', 'vehicle_title', 'insurance', 'contract', 'other');
CREATE TYPE maintenance_status AS ENUM ('pending', 'completed');

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
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

-- Vehicles table
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

-- Financial records table
CREATE TABLE financial_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    proof_image_url TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenances table
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

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    type document_type NOT NULL,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_vehicles_investor ON vehicles(assigned_investor_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_financial_records_vehicle ON financial_records(vehicle_id);
CREATE INDEX idx_financial_records_date ON financial_records(date);
CREATE INDEX idx_maintenances_vehicle ON maintenances(vehicle_id);
CREATE INDEX idx_maintenances_status ON maintenances(status);
CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_documents_vehicle ON documents(vehicle_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to auto-update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_records_updated_at BEFORE UPDATE ON financial_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenances_updated_at BEFORE UPDATE ON maintenances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- SOLUCIÓN SIMPLE: Sin recursión, usando función en schema public

-- 1. Eliminar todas las políticas existentes de profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- 2. Crear función helper en schema public
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
    SELECT role::TEXT 
    FROM public.profiles 
    WHERE id = auth.uid()
    LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 3. Políticas simples para usuarios normales
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- 4. Políticas para admins usando la función helper
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
-- Arreglar políticas RLS para evitar recursión en todas las tablas

-- =====================================================
-- VEHICLES POLICIES (Fixed)
-- =====================================================

DROP POLICY IF EXISTS "Investors can view assigned vehicles" ON vehicles;
DROP POLICY IF EXISTS "Admins can insert vehicles" ON vehicles;
DROP POLICY IF EXISTS "Admins can update vehicles" ON vehicles;
DROP POLICY IF EXISTS "Admins can delete vehicles" ON vehicles;

-- Investors can view their assigned vehicles
CREATE POLICY "Investors can view assigned vehicles"
    ON vehicles FOR SELECT
    TO authenticated
    USING (
        assigned_investor_id = auth.uid()
        OR
        public.get_my_role() = 'admin'
    );

-- Admins can manage vehicles
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
-- FINANCIAL RECORDS POLICIES (Fixed)
-- =====================================================

DROP POLICY IF EXISTS "Investors can view own vehicle finances" ON financial_records;
DROP POLICY IF EXISTS "Admins can insert financial records" ON financial_records;
DROP POLICY IF EXISTS "Admins can update financial records" ON financial_records;
DROP POLICY IF EXISTS "Admins can delete financial records" ON financial_records;

-- Investors can view financial records of their vehicles
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

-- Admins can manage financial records, investors can insert for their own vehicles
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
-- MAINTENANCES POLICIES (Fixed)
-- =====================================================

DROP POLICY IF EXISTS "Investors can view own vehicle maintenance" ON maintenances;
DROP POLICY IF EXISTS "Admins can insert maintenances" ON maintenances;
DROP POLICY IF EXISTS "Admins can update maintenances" ON maintenances;
DROP POLICY IF EXISTS "Admins can delete maintenances" ON maintenances;

-- Investors can view maintenance of their vehicles
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

-- Admins can manage maintenances
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
-- DOCUMENTS POLICIES (Fixed)
-- =====================================================

DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Admins can insert documents" ON documents;
DROP POLICY IF EXISTS "Admins can update documents" ON documents;
DROP POLICY IF EXISTS "Admins can delete documents" ON documents;

-- Users can view their own documents
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

-- Admins can manage documents
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
