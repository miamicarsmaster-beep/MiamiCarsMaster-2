# PLAN DE FIXES - MIAMI CARS PLATFORM
**Fecha**: 2026-01-30
**Rol**: Staff Engineer + Tech Lead + QA Lead + UX/UI Designer
**Objetivo**: Llevar el producto a estado "LISTO PARA ENTREGA"

---

## FASE 0 — INVENTARIO Y CHECK RÁPIDO ✅

### Stack Tecnológico Identificado
- **Frontend**: Next.js 16.1.4 + React 19.2.3 + TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **ORM**: Supabase Client (@supabase/supabase-js)
- **Auth**: Supabase Auth con middleware personalizado
- **Storage**: Supabase Storage (bucket: `vehicle-documents`)
- **UI**: Radix UI + TailwindCSS + Shadcn/ui
- **Forms**: React Hook Form + Zod
- **Notifications**: Sonner (toast)

### Roles del Sistema
1. **ADMIN** - Acceso completo
   - Rutas: `/dashboard/admin/*`
   - Pantallas: Panel General, Inversores, Flota, Finanzas, Documentos
   
2. **USUARIO INVERSOR** - Acceso limitado a sus vehículos
   - Rutas: `/dashboard/investor/*`
   - Pantallas: Mis Autos, Mis Finanzas, Documentos

### Tablas de Base de Datos Identificadas
```sql
- profiles (usuarios con roles)
- vehicles (flota de autos)
- financial_records (transacciones)
- maintenances (servicios/mantenimientos) ⚠️ CRÍTICO
- documents (documentos generales y por vehículo)
- vehicle_photos (fotos con marcadores de daño)
- mileage_history (historial de millaje)
- rentals (reservas/alquileres) ⚠️ CRÍTICO
```

### Rutas Principales Mapeadas

#### ADMIN
- ✅ `/dashboard/admin` - Panel General (funciona)
- ✅ `/dashboard/admin/investors` - Gestión de Inversores (funciona)
- ✅ `/dashboard/admin/vehicles` - Flota de Autos (funciona)
- ⚠️ `/dashboard/admin/finance` - Finanzas (existe pero no verificada)
- ⚠️ `/dashboard/admin/documents` - Documentos (existe pero reporta problemas)

#### INVERSOR
- ✅ `/dashboard/investor` - Mis Autos (funciona)
- ❌ `/dashboard/investor/finance` - **404 CRÍTICO**
- ⚠️ `/dashboard/investor/documents` - Documentos (existe pero reporta problemas)

### Componentes Críticos Identificados
- `VehicleAdminPanel.tsx` - Panel completo de gestión de vehículo (1288 líneas)
  - Incluye: fotos, mantenimientos, documentos, millaje, reservas
  - ⚠️ Reporta problemas con registro de servicios y fotos
- `Sidebar.tsx` - Navegación (NO tiene campanita de notificaciones)
- `DocumentsPage` (admin) - Carga de documentos

---

## FASE 1 — CORRECCIONES PRIORIDAD CRÍTICA

### A) ADMIN - Servicios / Mantenimientos

**Issue**: No se pueden registrar servicios/mantenimientos con fotos

**Causa Raíz Identificada**:
- Tabla `maintenances` existe en DB con campo `receipt_images TEXT[]`
- El componente `VehicleAdminPanel` tiene lógica para mantenimientos
- Posible problema: falta implementación de upload de fotos en el formulario de mantenimiento
- Falta verificar: endpoint API, validaciones, storage bucket

**Fix Propuesto**:
1. Revisar componente `VehicleAdminPanel` sección de mantenimientos
2. Implementar upload múltiple de fotos como comprobante
3. Guardar URLs en campo `receipt_images` (array)
4. Validar: tipo de servicio, fecha, costo (al menos 1 campo requerido)
5. Mostrar fotos en detalle del servicio

**Endpoints Afectados**:
- `POST /api/admin/maintenances` (crear)
- `GET /api/admin/maintenances/:id` (ver)
- Storage: bucket `vehicle-documents` o crear `maintenance-receipts`

**Validación Manual**:
1. Abrir panel de vehículo como admin
2. Ir a tab "Mantenimientos"
3. Crear nuevo servicio con fotos
4. Verificar que se guarde en DB
5. Verificar que las fotos se muestren en el detalle

**Criterio de Aceptación**:
- ✅ Formulario permite seleccionar múltiples fotos
- ✅ Fotos se suben a storage
- ✅ Referencias se guardan en DB
- ✅ Fotos se muestran en galería del servicio
- ✅ Validaciones funcionan correctamente

---

### B) ADMIN - Reservas Recientes

**Issue**: "Reservas recientes" NO deja agregar

**Causa Raíz Identificada**:
- Tabla `rentals` existe en DB
- NO hay ruta visible en sidebar para "Reservas"
- El panel de vehículo (`VehicleAdminPanel`) tiene sección de rentals
- Posible problema: falta formulario de creación o está oculto/roto

**Fix Propuesto**:
1. Verificar si existe formulario de creación de reservas en `VehicleAdminPanel`
2. Si no existe, implementarlo
3. Validar: vehículo, fechas, cliente, plataforma, monto
4. Permitir ver lista de reservas
5. Implementar estados: creada/confirmada/cancelada

**Endpoints Afectados**:
- `POST /api/admin/rentals` (crear)
- `GET /api/admin/rentals` (listar)
- `PATCH /api/admin/rentals/:id` (actualizar estado)

**Validación Manual**:
1. Abrir panel de vehículo
2. Ir a tab "Reservas" o "Alquileres"
3. Crear nueva reserva
4. Verificar que aparezca en la lista
5. Ver detalle de la reserva

**Criterio de Aceptación**:
- ✅ Formulario de creación funciona
- ✅ Reserva se guarda en DB
- ✅ Lista muestra todas las reservas
- ✅ Detalle muestra información completa
- ✅ Estados se pueden cambiar

---

### C) ADMIN - Documentación

**Issue**: No permite cargar documentos desde web o celular

**Causa Raíz Identificada**:
- Componente `DocumentsPage` (admin) existe y tiene lógica de upload
- Usa storage bucket `vehicle-documents`
- Código parece correcto en desktop
- Posible problema: input file no funciona en mobile, falta atributo `capture`

**Fix Propuesto**:
1. Revisar input file en `DocumentsPage`
2. Añadir soporte mobile: `accept` y `capture` attributes
3. Validar tamaños máximos (ej: 10MB)
4. Mejorar manejo de errores
5. Probar en mobile real

**Código Actual**:
```tsx
<Input
  id="file"
  type="file"
  accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx"
  onChange={handleFileChange}
/>
```

**Código Mejorado**:
```tsx
<Input
  id="file"
  type="file"
  accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,image/*"
  capture="environment" // Permite usar cámara en mobile
  onChange={handleFileChange}
/>
```

**Validación Manual**:
1. Desktop: subir PDF y JPG
2. Mobile: subir foto desde galería
3. Mobile: tomar foto con cámara
4. Verificar límite de tamaño
5. Verificar que se guarde y se pueda descargar

**Criterio de Aceptación**:
- ✅ Upload funciona en desktop
- ✅ Upload funciona en mobile (galería)
- ✅ Upload funciona en mobile (cámara)
- ✅ Validación de tamaño funciona
- ✅ Mensajes de error claros

---

### D) PANEL USUARIO INVERSOR - "No se puede ver detalles"

**Issue**: No se puede ver detalles (de qué exactamente?)

**Investigación Necesaria**:
- Página principal inversor muestra cards de vehículos
- Cada card tiene botón "Ver Detalles" pero no hace nada
- Falta: modal o página de detalle del vehículo para inversor

**Causa Raíz**:
- Botón "Ver Detalles" en línea 168 de `investor/page.tsx` no tiene funcionalidad
- No existe componente de detalle para inversor
- Inversor necesita ver: fotos, mantenimientos, documentos, finanzas de SU vehículo

**Fix Propuesto**:
1. Crear componente `VehicleInvestorPanel` (versión read-only del admin panel)
2. Implementar modal o página `/dashboard/investor/vehicles/[id]`
3. Mostrar: fotos, historial de mantenimientos, documentos, finanzas
4. Aplicar RLS: solo puede ver sus vehículos asignados
5. Conectar botón "Ver Detalles"

**Endpoints Afectados**:
- `GET /api/investor/vehicles/:id` (detalle)
- `GET /api/investor/vehicles/:id/maintenances` (historial)
- `GET /api/investor/vehicles/:id/documents` (documentos)
- `GET /api/investor/vehicles/:id/financials` (finanzas)

**Validación Manual**:
1. Login como inversor
2. Click en "Ver Detalles" de un vehículo
3. Verificar que abre modal/página
4. Verificar que muestra información correcta
5. Verificar que NO puede editar (solo ver)
6. Verificar que NO puede ver vehículos de otros inversores

**Criterio de Aceptación**:
- ✅ Botón "Ver Detalles" funciona
- ✅ Modal/página se abre
- ✅ Muestra información completa del vehículo
- ✅ RLS funciona (solo ve sus vehículos)
- ✅ UI es read-only (no puede editar)

---

### E) PANEL USUARIO INVERSOR - "Mis finanzas" tira error 404

**Issue**: Ruta `/dashboard/investor/finance` no existe

**Causa Raíz**:
- Sidebar define ruta `/dashboard/investor/finance` (línea 59 de Sidebar.tsx)
- NO existe archivo `src/app/dashboard/investor/finance/page.tsx`
- Directorio no existe

**Fix Propuesto**:
1. Crear directorio `src/app/dashboard/investor/finance/`
2. Crear `page.tsx` con dashboard financiero para inversor
3. Mostrar: ingresos, gastos, balance de SUS vehículos
4. Gráficos mensuales/anuales
5. Tabla de transacciones filtradas por sus vehículos

**Endpoints Afectados**:
- `GET /api/investor/financial-records` (con filtro por vehículos del inversor)

**Validación Manual**:
1. Login como inversor
2. Click en "Mis Finanzas" en sidebar
3. Verificar que carga sin 404
4. Verificar que muestra datos correctos
5. Verificar que solo ve finanzas de sus vehículos

**Criterio de Aceptación**:
- ✅ Ruta existe y carga
- ✅ Muestra dashboard financiero
- ✅ Datos son correctos y filtrados
- ✅ RLS funciona
- ✅ UI es clara y útil

---

### F) NOTIFICACIONES - Campanita no funciona

**Issue**: La campanita marca como que hay notificación pero NO funciona

**Causa Raíz**:
- NO existe campanita en el Sidebar actual
- NO existe sistema de notificaciones implementado
- NO existe tabla `notifications` en DB
- Esto es una funcionalidad completamente faltante

**Fix Propuesto**:
1. Crear tabla `notifications` en DB
2. Crear trigger/función para generar notificaciones automáticas
3. Eventos que generan notificaciones:
   - Nueva reserva creada
   - Mantenimiento completado
   - Documento subido
   - Pago registrado
4. Implementar componente `NotificationBell` en header
5. Dropdown con lista de notificaciones
6. Marcar como leído/no leído
7. Contador badge

**Schema Propuesto**:
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL, -- 'rental', 'maintenance', 'document', 'payment'
  related_id UUID, -- ID del registro relacionado
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Endpoints Afectados**:
- `GET /api/notifications` (listar)
- `PATCH /api/notifications/:id/read` (marcar como leído)
- `DELETE /api/notifications/:id` (eliminar)

**Validación Manual**:
1. Crear una reserva como admin
2. Verificar que se genera notificación
3. Ver badge con contador
4. Abrir dropdown
5. Marcar como leído
6. Verificar que contador se actualiza

**Criterio de Aceptación**:
- ✅ Tabla notifications existe
- ✅ Triggers generan notificaciones automáticas
- ✅ Campanita aparece en header
- ✅ Contador muestra número correcto
- ✅ Dropdown muestra lista
- ✅ Marcar como leído funciona
- ✅ Estado vacío es prolijo

---

### G) ASIGNACIÓN / EDICIÓN DE AUTOS

**Issue**: Solo funciona al cargar, después no se puede editar/cambiar/asignar

**Causa Raíz Probable**:
- Formulario de edición no actualiza campo `assigned_investor_id`
- Posible problema de estado local vs DB
- Posible problema de permisos RLS
- Posible problema de caché

**Investigación Necesaria**:
1. Revisar componente `VehicleForm` o `VehicleAdminPanel`
2. Verificar endpoint de actualización
3. Verificar RLS policies

**Fix Propuesto**:
1. Revisar formulario de edición de vehículo
2. Asegurar que campo `assigned_investor_id` se puede actualizar
3. Validar que no haya conflictos (auto asignado doble)
4. Permitir "liberar" asignación (set NULL)
5. Refrescar UI después de actualizar
6. Limpiar caché si aplica

**Endpoints Afectados**:
- `PATCH /api/admin/vehicles/:id` (actualizar)

**Validación Manual**:
1. Crear vehículo y asignar a inversor A
2. Editar y cambiar a inversor B
3. Verificar que se actualiza en DB
4. Verificar que inversor A ya no lo ve
5. Verificar que inversor B ahora lo ve
6. Editar y liberar asignación (NULL)
7. Verificar que ningún inversor lo ve

**Criterio de Aceptación**:
- ✅ Asignación inicial funciona
- ✅ Reasignación funciona
- ✅ Liberación funciona
- ✅ UI se actualiza correctamente
- ✅ No hay estados inconsistentes
- ✅ RLS funciona correctamente

---

## FASE 2 — QA FUNCIONAL Y UX/UI POLISH

### Checklist de Revisión
- [ ] Revisar errores de consola en todas las páginas
- [ ] Verificar estados empty/loading/error en todos los componentes
- [ ] Validar formularios (todos tienen validación?)
- [ ] Botones tienen feedback visual
- [ ] Tablas tienen paginación/orden/filtros donde aplique
- [ ] Diseño consistente (botones, inputs, modales)
- [ ] Jerarquía visual clara
- [ ] Responsive en mobile
- [ ] Accesibilidad básica (labels, focus, contrast)
- [ ] Performance (re-renders, fetches duplicados)
- [ ] Imágenes optimizadas (thumbnails, lazy load)

---

## FASE 3 — PRUEBAS Y CRITERIOS DE ACEPTACIÓN

### Checklist de Pruebas Manuales

#### ADMIN
- [ ] Crear servicio con fotos
- [ ] Ver servicio con fotos
- [ ] Crear reserva
- [ ] Ver lista de reservas
- [ ] Ver detalle de reserva
- [ ] Subir documento desde desktop
- [ ] Subir documento desde mobile (galería)
- [ ] Subir documento desde mobile (cámara)
- [ ] Ver notificaciones
- [ ] Marcar notificación como leída
- [ ] Asignar auto a inversor
- [ ] Reasignar auto a otro inversor
- [ ] Liberar asignación de auto

#### INVERSOR
- [ ] Ver lista de mis autos
- [ ] Ver detalle de auto
- [ ] Acceder a "Mis Finanzas" sin 404
- [ ] Ver dashboard financiero
- [ ] Ver notificaciones
- [ ] Subir documento (si aplica)
- [ ] Verificar que NO puede ver autos de otros
- [ ] Verificar que NO puede editar (solo ver)

---

## ORDEN DE EJECUCIÓN

### Prioridad 1 (BLOQUEANTES)
1. ✅ **E) Mis Finanzas 404** - Crear página faltante
2. **C) Documentos** - Fix upload mobile
3. **A) Servicios** - Implementar upload de fotos

### Prioridad 2 (FUNCIONALIDAD CRÍTICA)
4. **B) Reservas** - Implementar formulario de creación
5. **D) Ver Detalles Inversor** - Crear panel de detalle
6. **G) Asignación de Autos** - Fix edición

### Prioridad 3 (MEJORAS)
7. **F) Notificaciones** - Sistema completo
8. **FASE 2** - QA y Polish

---

## NOTAS ADICIONALES

### Problemas Potenciales Detectados
- No hay sistema de notificaciones implementado (se asume que existe pero no)
- Falta documentación de APIs
- Falta testing automatizado
- Posibles problemas de RLS no verificados
- No hay manejo de errores consistente en todos los componentes

### Recomendaciones
- Implementar logging centralizado
- Crear documentación de APIs
- Implementar tests E2E para flujos críticos
- Revisar todas las RLS policies
- Implementar rate limiting en APIs sensibles
- Añadir monitoring y alertas

---

**Estado**: PLAN APROBADO - LISTO PARA EJECUCIÓN
**Próximo Paso**: Empezar con Prioridad 1
