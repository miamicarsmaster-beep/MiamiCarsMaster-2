# Diagnóstico de Cookies y Sesión - Chrome

## Para ejecutar en la consola de Chrome (F12 → Console):

```javascript
// 1. Verificar cookies de Supabase
console.log('=== COOKIES DE SUPABASE ===')
const cookies = document.cookie.split(';').filter(c => c.includes('sb-'))
console.log('Cookies encontradas:', cookies.length)
cookies.forEach(c => console.log(c.trim()))

// 2. Verificar localStorage
console.log('\n=== LOCAL STORAGE ===')
Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase')) {
        console.log(key, ':', localStorage.getItem(key)?.substring(0, 50) + '...')
    }
})

// 3. Verificar sessionStorage
console.log('\n=== SESSION STORAGE ===')
Object.keys(sessionStorage).forEach(key => {
    if (key.includes('supabase')) {
        console.log(key, ':', sessionStorage.getItem(key)?.substring(0, 50) + '...')
    }
})

// 4. Verificar Service Workers
console.log('\n=== SERVICE WORKERS ===')
navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('Service Workers activos:', registrations.length)
    registrations.forEach(reg => console.log(reg.scope))
})

// 5. Test de cookies
console.log('\n=== TEST DE COOKIES ===')
document.cookie = "test=1; path=/; SameSite=Lax"
const testCookie = document.cookie.includes('test=1')
console.log('¿Chrome acepta cookies?', testCookie ? '✅ SÍ' : '❌ NO')
```

## Limpieza Completa (Ejecutar en Console):

```javascript
// ADVERTENCIA: Esto borrará TODA la data de Supabase en este navegador
console.log('🧹 Limpiando todo...')

// Limpiar cookies
document.cookie.split(";").forEach(c => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
})

// Limpiar localStorage
Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('sb-')) {
        localStorage.removeItem(key)
    }
})

// Limpiar sessionStorage
Object.keys(sessionStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('sb-')) {
        sessionStorage.removeItem(key)
    }
})

// Desregistrar service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister())
})

console.log('✅ Limpieza completa. Recarga la página con Cmd+Shift+R')
```

## Solución Rápida desde Terminal:

Si tienes acceso a la línea de comandos de Chrome:

### Mac:
```bash
# Cerrar Chrome completamente
killall "Google Chrome"

# Limpiar cache de Chrome
rm -rf ~/Library/Caches/Google/Chrome/Default/Cache/*
rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Service\ Worker/*

# Abrir Chrome de nuevo
open -a "Google Chrome"
```

### Windows:
```powershell
# Cerrar Chrome
taskkill /F /IM chrome.exe

# Limpiar cache
Remove-Item -Path "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache\*" -Recurse -Force
Remove-Item -Path "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Service Worker\*" -Recurse -Force
```

## Verificación de Configuración de Chrome:

1. **Cookies:** `chrome://settings/cookies`
   - Debe estar en "Permitir todas las cookies"
   
2. **Site Settings:** `chrome://settings/content/siteDetails?site=https://tu-dominio.vercel.app`
   - Cookies: Permitir
   - JavaScript: Permitir
   
3. **Flags experimentales:** `chrome://flags`
   - Buscar "SameSite" y asegurarse que no haya flags experimentales activos

## Si nada funciona:

Reinstalar Chrome o usar Chrome Canary para probar:
```bash
# Mac
brew install --cask google-chrome-canary
```
