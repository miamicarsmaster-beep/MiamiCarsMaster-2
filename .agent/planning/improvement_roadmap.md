# Plan de Mejoras Estratégicas - Miami Cars Platform 2026

Este documento detalla 10 mejoras o características nuevas diseñadas para incrementar el valor de la plataforma sin comprometer la estabilidad actual. El enfoque es **"Add-on Architecture"**, construyendo sobre los componentes ya existentes.

## 🎯 Objetivos
- Aumentar la visibilidad operativa.
- Mejorar la toma de decisiones para inversores y administradores.
- Automatizar procesos manuales.

---

## 🚀 Fase 1: Visibilidad y Control (UX/UI Wins)

### 1. 📅 Calendario Maestro de Flota (Master Schedule)
**Qué es:** Una vista de calendario global que muestra todas las reservas de todos los vehículos en una sola pantalla.
**Por qué:** Actualmente hay que entrar vehículo por vehículo. Esto permite ver "huecos" de disponibilidad para optimizar la ocupación.
**Implementación:**
- Nueva página `/dashboard/admin/calendar`.
- Uso de librería como `react-big-calendar`.
- Filtros por estado (Confirmado, Pendiente).

### 2. 🔍 Sistema de Filtrado Avanzado y Búsqueda
**Qué es:** Filtros combinados en la vista de lista vehicular (e.g., "Mostrar solo BMWs disponibles en Miami").
**Por qué:** A medida que la flota crece, el scroll infinito es ineficiente.
**Implementación:**
- Componente de filtros tipo "Facetas" (Marca, Estado, Inversor, Rango de Precio, Año).
- Búsqueda por VIN o Placa parcial.

### 3. 📱 Acciones Rápidas Móviles (Swipe Actions)
**Qué es:** Gestos en la vista móvil de la lista para acciones comunes.
**Por qué:** Facilita la gestión "on-the-go" para el equipo de operaciones.
**Implementación:**
- Deslizar izquierda: "Registrar Combustible".
- Deslizar derecha: "Cambio Rápido de Estado" (e.g., a Limpieza/Mantenimiento).

### 4. ⚡ Optimización de Carga Visual (Lazy Loading & Skeletons)
**Qué es:** Mejorar la UX durante la carga de galerías pesadas.
**Por qué:** Las imágenes de alta calidad (4k) pueden ralentizar la interfaz.
**Implementación:**
- Implementar `blurhash` para cargas progresivas de imágenes.
- Skeletons animados personalizados para las tarjetas de vehículos.

---

## 📊 Fase 2: Inteligencia de Datos (Analytics)

### 5. 💰 Reportes de ROI para Inversores
**Qué es:** Gráficos detallados dentro de la vista del inversor que muestran Ingresos vs. Costos (Mantenimiento/Comisiones).
**Por qué:** Aumenta la confianza del inversor al ver la rentabilidad neta en tiempo real.
**Implementación:**
- Gráfico de barras apiladas (Ingresos Brutos, Fees, Neto).
- Cálculo automático de Yield anualizado basado en el precio de compra.

### 6. 🔮 Predicción de Mantenimiento (AI Lite)
**Qué es:** Sistema que estima la fecha del próximo servicio basándose en el promedio de millas diarias recorridas.
**Por qué:** Pasa de un mantenimiento reactivo a uno proactivo.
**Implementación:**
- Algoritmo simple: `(Próximo Servicio - Millaje Actual) / Promedio Millas Diarias = Días Restantes`.
- Alerta visual amarilla en el dashboard cuando falten <500 millas.

### 7. 🚨 Centro de Alertas de Vencimientos
**Qué es:** Un panel o widget que avisa sobre documentos próximos a vencer (Seguros, Registros).
**Por qué:** Evita multas y tiempos de inactividad por documentos caducados.
**Implementación:**
- Comprobación diaria de fechas de vencimiento en la tabla `documents`.
- Notificaciones Toast persistentes o email digest.

---

## 🛡️ Fase 3: Seguridad y Gestión (Admin Tools)

### 8. 📝 Logs de Auditoría (Audit Trail)
**Qué es:** Registro inmutable de *quién* hizo *qué* cambio crítico.
**Por qué:** Seguridad y accountability. Si un coche cambia de precio o se borra un historial, saber quién fue.
**Implementación:**
- Tabla `activity_logs` en Supabase.
- Triggers en acciones críticas (Update Status, Delete Vehicle, Update Price).

### 9. 📤 Exportación de Datos (Reporting)
**Qué es:** Botón para descargar listados y reportes financieros en CSV/PDF.
**Por qué:** Necesario para contabilidad externa o reportes fiscales.
**Implementación:**
- Generación de CSV en cliente para tablas de vehículos.
- Generación de PDF simple para "Hoja de Vida del Vehículo" (Resumen de mantenimientos y estado).

### 10. 🔗 Códigos QR por Vehículo
**Qué es:** Generación automática de un QR único para cada coche.
**Por qué:** El personal operativo puede escanear el QR pegado en la puerta y abrir directamente el panel de administración de *ese* coche en su móvil.
**Implementación:**
- Librería `qrcode.react`.
- Enlace profundo a `/dashboard/admin/vehicles?open=[id]`.

---

## 📅 Plan de Ejecución Sugerido

| Sprint | Enfoque | Características | Impacto |
|:---:|:---|:---|:---:|
| **1** | **UX & Ops** | Master Calendar, Filtros Avanzados, Mobile Actions | Alto (Inmediato) |
| **2** | **Data** | ROI Inversores, Alertas Vencimientos, Predicción Mantenimiento | Alto (Estratégico) |
| **3** | **Pro** | Audit Logs, Exportación, QR Codes, Optimización Imágenes | Medio (Refinamiento) |
