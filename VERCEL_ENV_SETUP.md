# Configuración de Variables de Entorno en Vercel

## Problema
Si al acceder a la versión online (Vercel) la aplicación te redirige constantemente al login, es porque las variables de entorno de Supabase no están configuradas.

## Solución

### Paso 1: Acceder a la configuración de Vercel
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto `miami-cars-platform`
3. Ve a **Settings** → **Environment Variables**

### Paso 2: Agregar las siguientes variables

Agrega estas 3 variables de entorno (copia los valores exactos de tu archivo `.env.local`):

#### Variable 1: NEXT_PUBLIC_SUPABASE_URL
```
NEXT_PUBLIC_SUPABASE_URL
```
**Valor:**
```
https://kwcwifrqskmkingtdkqy.supabase.co
```
**Environments:** Production, Preview, Development (seleccionar todos)

#### Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
**Valor:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Y3dpZnJxc2tta2luZ3Rka3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5OTMzODcsImV4cCI6MjA4NDU2OTM4N30.LP19E7pJysc6DGhgyqDWW3YrqemB04xs2jvJ54j91wc
```
**Environments:** Production, Preview, Development (seleccionar todos)

#### Variable 3: SUPABASE_SERVICE_ROLE_KEY
```
SUPABASE_SERVICE_ROLE_KEY
```
**Valor:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Y3dpZnJxc2tta2luZ3Rka3F5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODk5MzM4NywiZXhwIjoyMDg0NTY5Mzg3fQ.NwSWwMt5AkfSOyIzWzKxKZdiePzHSoZ6lD5x0zTFpgQ
```
**Environments:** Production, Preview, Development (seleccionar todos)

### Paso 3: Redesplegar
Después de agregar las variables:
1. Ve a **Deployments**
2. Haz clic en los tres puntos (...) del último deployment
3. Selecciona **Redeploy**
4. Confirma el redeploy

### Paso 4: Verificar
Una vez completado el redeploy:
1. Accede a tu aplicación en Vercel
2. Intenta iniciar sesión
3. La sesión debería mantenerse correctamente

## Notas Importantes

⚠️ **SEGURIDAD**: Estas claves son sensibles. No las compartas públicamente.

✅ **Variables NEXT_PUBLIC_**: Son visibles en el cliente (navegador)
🔒 **SUPABASE_SERVICE_ROLE_KEY**: Solo se usa en el servidor

## Verificación Rápida

Si después de configurar las variables aún tienes problemas:
1. Verifica que las variables estén en todos los environments (Production, Preview, Development)
2. Asegúrate de haber redeployado después de agregar las variables
3. Limpia el caché del navegador
4. Intenta en modo incógnito

## Contacto

Si el problema persiste, verifica:
- Que las URLs de Supabase sean correctas
- Que el proyecto de Supabase esté activo
- Que las políticas RLS estén configuradas correctamente
