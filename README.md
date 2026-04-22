# 🐜 PlagControl — SaaS de Gestión Profesional de Control de Plagas

**PlagControl** ha evolucionado para convertirse en una plataforma **SaaS Multi-Tenant** "mobile-first" diseñada para empresas de control de plagas. Su objetivo automatizar la operación en campo, generar informes técnicos profesionales de alta fidelidad, proporcionar gestión de solicitudes/cotizaciones, y ofrecer transparencia total a sus clientes a través de un portal dedicado corporativo.

> Desarrollado como plataforma SaaS escalable y multi-empresa.

---

## 🚀 Características Principales

### 👑 Plataforma Multi-Tenant (SaaS)
- **Aislamiento de Datos por Empresa**: Cada empresa cuenta con su propio entorno, clientes, órdenes, configuración y branding aislados a través de Row Level Security (RLS) en Supabase.
- **Portal Superadmin**: Tablero global para registrar y gestionar múltiples empresas (inquilinos), suspender licencias, y asignar administradores globales por unidad de negocio.
- **Bloqueo Inteligente por Licencia**: Las empresas con licencias vencidas o suspendidas pierden el acceso automáticamente, mientras que sus clientes solo mantienen acceso para solicitar nuevos servicios y forzar la re-activación.

### 📱 Módulo del Técnico en Campo
- **Bitácora de Actividades en Tiempo Real**: Registro paso a paso del servicio con descripciones detalladas, fechas y horas automáticas. 
- **Evidencia Fotográfica Rápida**: Captura y subida de fotos directamente desde el móvil. Integrado directamente en el flujo del certificado (6 por página, con etiquetas).
- **Checks y Métodos Dinámicos**: Checklist dinámicos de áreas intervenidas y métodos aplicados según el tipo de servicio (Desinsectación, Desratización, Desinfección).
- **Monitoreo Cuidado de Estaciones**: Registro detallado de estaciones cebaderas con control de consumo, mantenimiento, y fotos comparativas "antes/después".
- **Identidad de Firma**: Captura de firma digital in-situ.

### 🏢 Módulo de Administración (Por Empresa)
- **Gestión de Órdenes de Servicio**: Asignación a técnicos, seguimiento de estados y supervisión.
- **Workflow de Solicitudes y Cotizaciones**: 
  - Recepción de solicitudes enviadas desde el portal de clientes.
  - Generación de cotizaciones con precio y descripción desde la misma plataforma.
  - Conversión instantánea de solicitudes pre-aprobadas en órdenes de trabajo.
- **Gestión de Clientes y Accesos**: Creación simultánea de cuentas de sistema y portal de clientes. Control de estados (activo/inactivo).
- **Branding y Configuraciones Base**: Permite registrar el logo corporativo de la empresa, configuración del certificado PDF de manera dinámica (textos de pie de página, resoluciones).
- **Repositorio Legal Centralizado**: Subida centralizada de documentos legales (RUT, Cámara de comercio, Permisos de Salud) visibles globalmente para sus clientes.

### 🌐 Portal Directo del Cliente
- **Login Seguro Independiente**: Portal unificado pero enrutado dinámicamente según la empresa o el cliente.
- **Motor de Solicitudes (Fidelización)**: Los clientes pueden pedir servicios directamente, cotizar en el sistema y aceptar propuestas para agilizar sus mantenimientos.
- **Visualización Legal e Histórica**: Descarga en formato PDF nativo de certificados anteriores, revisión del estatus en vivo del técnico, y visualización de resoluciones legales de la empresa operadora.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | React 19 + Vite 8 |
| **Estilos y Experiencia Visual** | Tailwind CSS 4 + SweetAlert2 + Lucide React |
| **Backend / DB** | Supabase (PostgreSQL + Realtime + Storage + Auth) |
| **Generación Documental (PDF)** | jsPDF |
| **Routing y Estado** | React Router DOM v7 |

---

## 📂 Estructura del Proyecto

```
src/
├── lib/
│   ├── alertas.js               # Centralización de interacciones SweetAlert2
│   ├── supabase.js              # Inicializador y tipado de Supabase DB
│   └── generarCertificado.js    # Motor renderizador de reportes PDF de alta fidelidad
├── pages/
│   ├── superadmin/              # (NUEVO) Vistas del administrador global SaaS
│   │   ├── DashboardSAAS.jsx    
│   │   └── EmpresaForm.jsx      
│   ├── admin/                   # Vistas administrativas de cada inquilino
│   │   ├── Solicitudes.jsx      # Workflow de cotizaciones 
│   │   ├── Configuracion.jsx    # Branding local
│   │   ├── DocumentosLegales.jsx
│   │   ├── Usuarios.jsx         # Personal técnico e interno
│   │   └── ...                  
│   ├── portal/                  # Portal "PWA" del cliente final
│   │   ├── PortalLogin.jsx      
│   │   ├── PortalHistorial.jsx  # Tabs interactivos y bloqueo condicional
│   │   ├── PortalSolicitudForm.jsx 
│   │   └── PortalOrdenDetalle.jsx
│   └── (Raíz Pages)           # Vistas compartidas o del rol técnico operativo
│       ├── Ordenes.jsx          
│       ├── OrdenDetalle.jsx     
│       └── ...
└── components/
    ├── Layout.jsx               # Navegación estructural adaptativa según Perfil
    └── ProtectedRoute.jsx       # Guardianes de enrutamiento y bloqueo por licencias
```

---

## ⚙️ Configuración e Instalación

### Requisitos Previos
- Node.js v18 o superior.
- Instancia en [Supabase](https://supabase.com/) configurada con multi-tenant RLS.

### Instalación Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/RandySimanca/control-de-plagas.git
cd plagcontrol

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (.env)
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anon_key

# 4. Correr la aplicación
npm run dev
```

---

## 🔐 Seguridad e Integridad de Datos (RLS)

El corazón multi-empresa descansa bajo **Row Level Security (RLS)** de PostgreSQL:
- Toda la base (solicitudes, ordenes, fotos, clientes) responde al UUID del `empresa_id` con acceso bloqueado lógicamente por entorno.
- Las vistas, mutaciones y recargas respetan el origen del `public.get_my_empresa_id()` en base al `auth.uid()`.
- Aislamiento en el storage bucket de `fotos-servicio`.

---

## 👥 Matriz de Roles

| Rol | Privilegios |
|---|---|
| **Superadmin (Founder)** | Control absoluto. Gestiona licencias, crea matrices empresariales (tenants) y monitorea acceso global. |
| **Admin Empresa** | Dashboard propio. Envía cotizaciones, despacha órdenes, registra técnicos/documentos y personaliza PDF. |
| **Técnico Operativo** | Órdenes localizadas. Capacidad de documentar en campo: estaciones, áreas, métodos, fotos, firma interactiva. |
| **Cliente Frecuente** | Visibilidad pasiva y activa. Lee legales, descarga sus propios PDF y genera requerimientos de servicio por portal. |

---

> Desarrollado con ❤️ para transformar digitalmente la industria de bioseguridad y control de plagas.
