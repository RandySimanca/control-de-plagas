# 🐜 PlagControl — Sistema de Gestión Profesional de Control de Plagas

**PlagControl** es una plataforma web "mobile-first" diseñada para empresas de control de plagas que buscan digitalizar completamente su operación en campo, automatizar la generación de informes técnicos profesionales y ofrecer transparencia total a sus clientes a través de un portal dedicado.

> Desarrollado para **DEROSH S.A.S** — Manejo Integrado de Plagas.

---

## 🚀 Características Principales

### 📱 Módulo del Técnico en Campo
- **Bitácora de Actividades en Tiempo Real**: Registro paso a paso del servicio con descripciones detalladas, fechas y horas automáticas. Se pueden editar o eliminar entradas.
- **Evidencia Fotográfica**: Captura y subida de fotos directamente desde el móvil. Las fotos se organizan y se imprimen en el informe PDF (6 por página, con etiquetas de color).
- **Áreas Intervenidas**: Selección mediante checklist de 18 áreas estandarizadas (cocinas, bodegas, oficinas, etc.) que se reflejan automáticamente en el informe.
- **Métodos de Aplicación**: Checklist dinámico basado en el tipo de control:
  - *Desinsectación*: Pulverización, nebulización ULV, termonebulización, gel, cebos, trampas UV, etc.
  - *Desratización*: Rodenticidas en cebo, trampas mecánicas, trampas de pegamento, fumigación con fosfuro.
  - *Desinfección*: Pulverización química, nebulización, ozono, luz UV-C, vapor.
- **Monitoreo de Estaciones de Control**: Registro de estaciones cebaderas con cantidades, observaciones y fotos antes/después.
- **Productos Utilizados**: Registro de productos químicos con nombre comercial, ingrediente activo y dosis/cantidad para trazabilidad completa.
- **Recomendaciones del Técnico**: Campo libre para que el técnico deje observaciones profesionales que se imprimen en el PDF.
- **Firma Digital**: Captura de firma del técnico que se integra automáticamente al informe.
- **Modo PWA**: Instalable en Android e iOS para acceso rápido como una app nativa.

### 🏢 Módulo de Administración
- **Dashboard**: Estadísticas generales de servicios, clientes activos y técnicos.
- **Gestión de Órdenes de Servicio**: Creación, asignación a técnicos, seguimiento de estados (`Programada → En Progreso → Completada`).
- **Gestión de Clientes**: Alta de clientes con datos fiscales, contacto en sitio y tipo (residencial/comercial/industrial). **Creación simultánea de cuenta de acceso al portal** con toggle integrado.
- **Gestión de Usuarios**: Control de técnicos, administradores y clientes. Activación/desactivación, carga de firma digital y vinculación de clientes.
- **Configuración de Empresa**:
  - Nombre, NIT, dirección fiscal.
  - **Logo corporativo** (se refleja en la portada y encabezados del PDF).
  - **Versión y fecha del modelo del informe** (dinámicas, sin tocar código).
  - **Recomendaciones generales** del PDF editables desde la interfaz.
  - Texto de footer del PDF.
- **Documentos Legales**: Repositorio centralizado para cargar resoluciones, RUT y Cámara de Comercio.
- **Generación de Informe Técnico PDF**: Motor multi-página con diseño corporativo profesional que incluye:
  1. Portada con identidad visual (triángulos decorativos, logo, nombre del cliente).
  2. Información general del servicio (cliente, técnico, fecha, tipo de control).
  3. Proceso ejecutado (generado dinámicamente según tipo de plaga).
  4. Áreas intervenidas.
  5. Actividades ejecutadas con:
     - Tipo de control dinámico.
     - Métodos de aplicación seleccionados por el técnico.
     - Trazabilidad de productos químicos (nombre, ingrediente activo, dosis).
     - Diagnóstico técnico.
     - Bitácora cronológica de actividades.
  6. Monitoreo de estaciones de control.
  7. Galería fotográfica (6 fotos por página con etiquetas de color).
  8. Recomendaciones generales (configurables por admin).
  9. Recomendaciones del técnico.
  10. Firma del técnico con nombre y cargo.

### 🌐 Portal del Cliente
- **Acceso con credenciales propias**: Login independiente para clientes.
- **Historial de Servicios**: Consulta detallada de cada visita realizada con estados visuales.
- **Seguimiento en Vivo**: Los clientes ven el progreso del técnico, fotos y actividades en tiempo real.
- **Descarga de Certificados PDF**: Acceso inmediato a los informes técnicos generados.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | React 19 + Vite 8 |
| **Estilos** | Tailwind CSS 4 |
| **Iconografía** | Lucide React |
| **Backend / DB** | Supabase (PostgreSQL + Realtime + Storage + Auth) |
| **Generación de PDF** | jsPDF |
| **Notificaciones** | React Hot Toast |
| **Routing** | React Router DOM v7 |

---

## 📂 Estructura del Proyecto

```
src/
├── lib/
│   ├── supabase.js              # Cliente Supabase
│   └── generarCertificado.js    # Motor de generación del PDF
├── pages/
│   ├── Login.jsx                # Autenticación
│   ├── Dashboard.jsx            # Panel principal
│   ├── Clientes.jsx             # Listado de clientes
│   ├── ClienteForm.jsx          # Crear/editar cliente (+ crear usuario)
│   ├── ClienteDetalle.jsx       # Detalle del cliente
│   ├── Ordenes.jsx              # Listado de órdenes
│   ├── OrdenForm.jsx            # Crear/editar orden de servicio
│   ├── OrdenDetalle.jsx         # Detalle completo (técnico opera aquí)
│   ├── Certificados.jsx         # Gestión de certificados
│   ├── admin/
│   │   ├── Configuracion.jsx    # Configuración de empresa y PDF
│   │   ├── Usuarios.jsx         # Listado de usuarios
│   │   ├── UsuarioForm.jsx      # Crear/editar usuarios
│   │   ├── Tecnicos.jsx         # Vista de técnicos
│   │   └── DocumentosLegales.jsx
│   └── portal/
│       ├── PortalLogin.jsx      # Login del cliente
│       ├── PortalHistorial.jsx  # Historial de servicios
│       └── PortalOrdenDetalle.jsx
└── assets/
    └── logo Derosh.png          # Logo corporativo
```

---

## ⚙️ Configuración e Instalación

### Requisitos Previos
- Node.js v18 o superior.
- Cuenta en [Supabase](https://supabase.com/).

### Instalación Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/RandySimanca/control-de-plagas.git
cd plagcontrol

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Crea un archivo .env en la raíz:
```

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anon_key
```

```bash
# 4. Inicializar la base de datos
# Ejecuta el contenido de supabase/schema.sql en el SQL Editor de Supabase.

# 5. Columnas adicionales requeridas:
# Ejecuta en el SQL Editor de Supabase:
```

```sql
ALTER TABLE configuracion ADD COLUMN recomendaciones_generales TEXT;
ALTER TABLE configuracion ADD COLUMN version_informe TEXT;
ALTER TABLE configuracion ADD COLUMN fecha_modelo_informe TEXT;
ALTER TABLE ordenes_servicio ADD COLUMN metodos_aplicados TEXT;
```

```bash
# 6. Correr en desarrollo
npm run dev
```

---

## 🔐 Seguridad (RLS)

El proyecto utiliza **Row Level Security (RLS)** de Supabase:
- Los **técnicos** solo ven y operan las órdenes que les fueron asignadas.
- Los **clientes** solo acceden a su propio historial, certificados y fotos.
- Los **administradores** tienen control total sobre todos los recursos.

---

## 👥 Roles del Sistema

| Rol | Acceso |
|---|---|
| **Administrador** | Dashboard, creación de órdenes/clientes/usuarios, configuración, documentos legales, generación de PDF |
| **Técnico** | Órdenes asignadas, bitácora de actividades, fotos, estaciones, áreas, métodos, recomendaciones, firma |
| **Cliente** | Portal exclusivo: historial de servicios, seguimiento en vivo, descarga de certificados |

---

## 📄 Licencia

Proyecto privado desarrollado para **DEROSH S.A.S**.

---

Desarrollado con ❤️ para la industria de control de plagas.
