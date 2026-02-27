# Solución al Error de RLS en Financial Records

## 🔍 Problema Identificado

El error **"new row violates row-level security policy for table 'financial_records'"** ocurre porque las políticas de seguridad actuales solo permiten a los administradores insertar registros financieros.

## 🛠️ Solución

He creado una migración que actualiza las políticas RLS para permitir que:
- **Admins**: Pueden insertar registros para cualquier vehículo
- **Inversores**: Pueden insertar registros solo para sus vehículos asignados

## 📋 Pasos para Aplicar la Solución

### Opción 1: Usando Supabase Dashboard (Recomendado)

1. **Abre el SQL Editor de Supabase**:
   - Ve a: https://app.supabase.com/project/kwcwifrqskmkingtdkqy/sql

2. **Copia y pega el siguiente SQL**:

```sql
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
```

3. **Haz clic en "Run"** para ejecutar la migración

4. **Verifica que se ejecutó correctamente** - Deberías ver un mensaje de éxito

### Opción 2: Usando Supabase CLI (Si está instalado)

```bash
# Navega al directorio del proyecto
cd "/Users/nicolasdelgado/Documents/Documentos /MIAMICARS-2/miami-cars-platform"

# Aplica la migración
supabase db push
```

## ✅ Verificación

Después de aplicar la migración:

1. **Recarga la página** en el navegador
2. **Intenta crear una nueva operación** en Finanzas y Gastos
3. **El error debería desaparecer** y la operación se guardará correctamente

## 🔐 Políticas de Seguridad Actualizadas

### Antes:
- ❌ Solo admins podían insertar registros financieros
- ❌ Los inversores no podían agregar operaciones

### Después:
- ✅ Admins pueden insertar registros para cualquier vehículo
- ✅ Inversores pueden insertar registros para sus vehículos asignados
- ✅ Inversores solo ven registros de sus vehículos
- ✅ Admins ven todos los registros

## 📁 Archivos Creados

- `supabase/migrations/20260210_fix_financial_records_rls.sql` - Migración SQL
- `FIX_FINANCIAL_RLS.md` - Este documento de instrucciones

## 🆘 Si el Problema Persiste

Si después de aplicar la migración el error persiste:

1. **Verifica tu rol de usuario**:
   ```sql
   SELECT id, email, role FROM profiles WHERE id = auth.uid();
   ```

2. **Verifica que la función `get_my_role()` existe**:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_schema = 'public' AND routine_name = 'get_my_role';
   ```

3. **Verifica las políticas aplicadas**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'financial_records';
   ```

Si necesitas más ayuda, por favor comparte los resultados de estas consultas.
