# MEJORAS PENDIENTES - VehicleAdminPanel

## ✅ 1. Eliminar botones de desarrollo del login
**Estado**: COMPLETADO
- Eliminados botones "Demo Admin" y "Demo Inversor"

## 🔄 2. Funcionalidad para cambiar/eliminar foto de portada
**Ubicación**: Línea 727-750 en VehicleAdminPanel.tsx

**Implementación**:
- Añadir botón flotante sobre la imagen hero
- Al hacer click, abrir input de archivo
- Permitir subir nueva imagen a Supabase Storage
- Actualizar image_url en la BD
- Añadir botón para eliminar (volver a placeholder)

## 🔄 3. Hacer funcionales los botones de acceso rápido
**Ubicación**: Línea 972-989 en VehicleAdminPanel.tsx

**Estado actual**:
- ✅ Service: Ya funciona (setActiveTab('maintenance'))
- ✅ Agenda: Ya funciona (setActiveTab('rentals'))
- ✅ Docs: Ya funciona (setActiveTab('documents'))
- ❌ Check-in: Solo muestra alert

**Implementación Check-in**:
- Crear modal de check-in rápido
- Campos: fecha, millaje actual, notas
- Guardar en tabla de check-ins o como nota en el vehículo

## 🔄 4. Optimizar layout del panel
**Problema**: Tabs y contenido están muy abajo, mal uso del espacio

**Solución**:
- Mover tabs más arriba (reducir padding superior)
- Ajustar altura del Dialog
- Mejor distribución del espacio vertical
- Tabs sticky en la parte superior del contenido
