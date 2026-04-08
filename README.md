# 🐜 PlagControl - Gestión Profesional de Control de Plagas

**PlagControl** es una solución "mobile-first" diseñada específicamente para empresas de control de plagas que buscan digitalizar su operación en campo, profesionalizar sus reportes y ofrecer transparencia total a sus clientes.

![Branding](https://vjrqxnyzhyxyzyxyzyxy.supabase.co/storage/v1/object/public/fotos-servicio/public/logo_placeholder.png) *(Puedes reemplazar esto con tu logo real)*

## 🚀 Características Principales

### 📱 Para el Técnico en Campo
- **Bitácora de Actividades en Tiempo Real**: Registro paso a paso del servicio con texto libre.
- **Anexo Fotográfico**: Captura de evidencias (4 a 6 fotos por actividad) directamente desde el móvil.
- **Firma Digital**: Captura de firma del cliente al finalizar el servicio para validez legal.
- **Modo PWA**: Instalable en Android e iOS para acceso rápido como una app nativa.

### 🏢 Para la Administración
- **Panel de Control (Dashboard)**: Estadísticas de servicios, clientes y técnicos activos.
- **Gestor de Certificados**: Generación automática de certificados en PDF con motor multi-página.
- **Documentación Legal**: Repositorio centralizado para cargar resoluciones de salud, RUT y Cámara de Comercio.
- **Gestión de Usuarios**: Control total sobre técnicos y administradores (activación/desactivación).

### 🌐 Portal del Cliente
- **Historial de Servicios**: Consulta detallada de cada visita realizada.
- **Seguimiento en Vivo**: Los clientes ven el progreso del técnico y sus fotos en tiempo real.
- **Descargas Directas**: Acceso inmediato a certificados PDF y documentos legales de la empresa.

---

## 🛠️ Stack Tecnológico

- **Frontend**: React.js con Vite.
- **Estilos**: Tailwind CSS (Diseño moderno y responsivo).
- **Iconografía**: Lucide React.
- **Backend / DB**: Supabase (PostgreSQL + Realtime + Storage + Auth).
- **Generación de Reportes**: jsPDF.
- **Notificaciones**: React Hot Toast.

---

## ⚙️ Configuración e Instalación

### Requisitos Previos
- Node.js (v18 o superior).
- Una cuenta en [Supabase](https://supabase.com/).

### Instalación Local
1.  **Clonar el repositorio**:
    ```bash
    git clone [url-del-repositorio]
    cd plagcontrol
    ```
2.  **Instalar dependencias**:
    ```bash
    npm install
    ```
3.  **Configurar Variables de Entorno**:
    Crea un archivo `.env` en la raíz con tus credenciales de Supabase:
    ```env
    VITE_SUPABASE_URL=tu_url_de_supabase
    VITE_SUPABASE_ANON_KEY=tu_clave_anon_key
    ```
4.  **Inicializar Base de Datos**:
    Ejecuta el contenido de `supabase/schema.sql` en el SQL Editor de tu proyecto Supabase.
5.  **Correr en desarrollo**:
    ```bash
    npm run dev
    ```

---

## 🔐 Seguridad (RLS)
El proyecto utiliza **Row Level Security (RLS)** de Supabase para asegurar que:
- Los técnicos solo vean las órdenes asignadas (o todas, según configuración).
- Los clientes **solo** puedan acceder a sus propios certificados, fotos y historial.
- Los administradores tengan control total.

---

## 🗺️ Hoja de Ruta (Roadmap)
Para ver los planes de escalabilidad a modelo SaaS (multi-empresa), consulta el archivo [docs/SAAS_ROADMAP.md](docs/SAAS_ROADMAP.md).

---
Desarrollado con ❤️ para la industria de control de plagas.
