-- ============================================
-- PlagControl - Esquema de Base de Datos
-- ============================================

-- 1. Tabla de perfiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  rol TEXT NOT NULL DEFAULT 'tecnico' CHECK (rol IN ('admin', 'tecnico', 'cliente')),
  especialidad TEXT,
  firma_url TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  cliente_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla de clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  razon_social TEXT,
  identificacion TEXT,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  nombre_contacto TEXT,
  telefono_contacto TEXT,
  tipo TEXT NOT NULL DEFAULT 'residencial' CHECK (tipo IN ('residencial', 'industrial', 'comercial')),
  notas TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla de órdenes de servicio
CREATE TABLE IF NOT EXISTS public.ordenes_servicio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tecnico_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  fecha_programada DATE NOT NULL,
  fecha_completada DATE,
  tipo_plaga TEXT,
  observaciones TEXT,
  estado TEXT NOT NULL DEFAULT 'programada' CHECK (estado IN ('programada', 'en_progreso', 'completada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabla de productos usados
CREATE TABLE IF NOT EXISTS public.productos_usados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_id UUID NOT NULL REFERENCES public.ordenes_servicio(id) ON DELETE CASCADE,
  nombre_producto TEXT NOT NULL,
  cantidad TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabla de fotos de servicio
CREATE TABLE IF NOT EXISTS public.fotos_servicio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_id UUID NOT NULL REFERENCES public.ordenes_servicio(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tabla de certificados
CREATE TABLE IF NOT EXISTS public.certificados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_id UUID NOT NULL REFERENCES public.ordenes_servicio(id) ON DELETE CASCADE,
  folio TEXT NOT NULL UNIQUE,
  pdf_path TEXT,
  firma_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_orden_certificado UNIQUE(orden_id)
);

-- 7. Tabla de actividades (bitácora)
CREATE TABLE IF NOT EXISTS public.actividades_servicio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_id UUID NOT NULL REFERENCES public.ordenes_servicio(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Tabla de documentos legales
CREATE TABLE IF NOT EXISTS public.documentos_legales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Tabla de configuración (branding)
CREATE TABLE IF NOT EXISTS public.configuracion (
  id INTEGER PRIMARY KEY DEFAULT 1,
  nombre_empresa TEXT NOT NULL DEFAULT 'PlagControl',
  logo_url TEXT,
  email_contacto TEXT,
  telefono_contacto TEXT,
  direccion_fiscal TEXT,
  footer_pdf TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_row CHECK (id = 1)
);

INSERT INTO public.configuracion (id, nombre_empresa) 
VALUES (1, 'PlagControl')
ON CONFLICT (id) DO NOTHING;

-- Agregar FK si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_profiles_cliente') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_cliente 
    FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- INDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ordenes_cliente ON public.ordenes_servicio(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_tecnico ON public.ordenes_servicio(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON public.ordenes_servicio(estado);
CREATE INDEX IF NOT EXISTS idx_productos_orden ON public.productos_usados(orden_id);
CREATE INDEX IF NOT EXISTS idx_fotos_orden ON public.fotos_servicio(orden_id);
CREATE INDEX IF NOT EXISTS idx_certificados_orden ON public.certificados(orden_id);
CREATE INDEX IF NOT EXISTS idx_profiles_rol ON public.profiles(rol);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_usados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fotos_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actividades_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_legales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

-- FUNCIONES DE SEGURIDAD (Security Definer) para evitar recursión
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'admin' AND activo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.es_tecnico()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'tecnico' AND activo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_cliente_id()
RETURNS UUID AS $$
  SELECT cliente_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- POLÍTICAS
DO $$ 
BEGIN
    -- Borrar políticas viejas para evitar conflictos al re-ejecutar
    DROP POLICY IF EXISTS "Admin acceso total a profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON public.profiles;
    DROP POLICY IF EXISTS "Admin acceso total a clientes" ON public.clientes;
    DROP POLICY IF EXISTS "Tecnicos leen clientes" ON public.clientes;
    DROP POLICY IF EXISTS "Clientes ven su propio registro" ON public.clientes;
    DROP POLICY IF EXISTS "Admin acceso total a ordenes" ON public.ordenes_servicio;
    DROP POLICY IF EXISTS "Tecnicos ven todas las ordenes" ON public.ordenes_servicio;
    DROP POLICY IF EXISTS "Clientes ven sus propias ordenes" ON public.ordenes_servicio;
    DROP POLICY IF EXISTS "Admin acceso total a certificados" ON public.certificados;
    DROP POLICY IF EXISTS "Todos leen certificados" ON public.certificados;
    DROP POLICY IF EXISTS "Clientes ven sus certificados" ON public.certificados;
    
    DROP POLICY IF EXISTS "Admin acceso total a actividades" ON public.actividades_servicio;
    DROP POLICY IF EXISTS "Tecnicos ven y crean actividades" ON public.actividades_servicio;
    DROP POLICY IF EXISTS "Clientes ven actividades de sus ordenes" ON public.actividades_servicio;
    
    DROP POLICY IF EXISTS "Admin acceso total a fotos" ON public.fotos_servicio;
    DROP POLICY IF EXISTS "Tecnicos gestionan fotos" ON public.fotos_servicio;
    DROP POLICY IF EXISTS "Clientes ven sus fotos de servicio" ON public.fotos_servicio;
    
    DROP POLICY IF EXISTS "Admin acceso total a productos_usados" ON public.productos_usados;
    DROP POLICY IF EXISTS "Tecnicos gestionan productos_usados" ON public.productos_usados;
    DROP POLICY IF EXISTS "Clientes ven sus productos_usados" ON public.productos_usados;
    
    DROP POLICY IF EXISTS "Admin acceso total a configuración" ON public.configuracion;
    DROP POLICY IF EXISTS "Todo el mundo lee la configuración" ON public.configuracion;
END $$;

-- Crear nuevas políticas seguras
-- Perfiles: Todos los autenticados pueden ver nombres y roles
CREATE POLICY "Admin acceso total a profiles" ON public.profiles FOR ALL USING (public.es_admin());
CREATE POLICY "Lectura perfiles autenticados" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

-- Clientes: Acceso total para admin, lectura para técnicos y el propio cliente
CREATE POLICY "Admin acceso total a clientes" ON public.clientes FOR ALL USING (public.es_admin());
CREATE POLICY "Tecnicos leen clientes" ON public.clientes FOR SELECT USING (public.es_tecnico());
CREATE POLICY "Clientes ven su propio registro" ON public.clientes FOR SELECT USING (id = (SELECT cliente_id FROM public.profiles WHERE id = auth.uid()));

-- Órdenes: Admin total, técnicos leen, clientes ven sus propias órdenes
CREATE POLICY "Admin acceso total a ordenes" ON public.ordenes_servicio FOR ALL USING (public.es_admin());
CREATE POLICY "Tecnicos ven todas las ordenes" ON public.ordenes_servicio FOR SELECT USING (public.es_tecnico());
CREATE POLICY "Clientes ven sus propias ordenes" ON public.ordenes_servicio FOR SELECT USING (cliente_id = (SELECT cliente_id FROM public.profiles WHERE id = auth.uid()));

-- Certificados: Permitir lectura a quien tenga acceso a la orden
CREATE POLICY "Admin acceso total a certificados" ON public.certificados FOR ALL USING (public.es_admin());
CREATE POLICY "Lectura certificados autorizada" ON public.certificados FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.ordenes_servicio 
    WHERE id = public.certificados.orden_id 
  )
);

CREATE POLICY "Admin acceso total a actividades" ON public.actividades_servicio FOR ALL USING (public.es_admin());
CREATE POLICY "Tecnicos ven y crean actividades" ON public.actividades_servicio FOR ALL USING (public.es_tecnico());
CREATE POLICY "Clientes ven actividades de sus ordenes" ON public.actividades_servicio FOR SELECT USING (
  orden_id IN (SELECT id FROM public.ordenes_servicio WHERE cliente_id = public.get_my_cliente_id())
);

CREATE POLICY "Admin acceso total a fotos" ON public.fotos_servicio FOR ALL USING (public.es_admin());
CREATE POLICY "Tecnicos gestionan fotos" ON public.fotos_servicio FOR ALL USING (public.es_tecnico());
CREATE POLICY "Clientes ven sus fotos de servicio" ON public.fotos_servicio FOR SELECT USING (
  orden_id IN (SELECT id FROM public.ordenes_servicio WHERE cliente_id = public.get_my_cliente_id())
);

CREATE POLICY "Admin acceso total a productos_usados" ON public.productos_usados FOR ALL USING (public.es_admin());
CREATE POLICY "Tecnicos gestionan productos_usados" ON public.productos_usados FOR ALL USING (public.es_tecnico());
CREATE POLICY "Clientes ven sus productos_usados" ON public.productos_usados FOR SELECT USING (
  orden_id IN (SELECT id FROM public.ordenes_servicio WHERE cliente_id = public.get_my_cliente_id())
);

CREATE POLICY "Todo el mundo lee la configuración" ON public.configuracion FOR SELECT USING (true);
CREATE POLICY "Admin acceso total a configuración" ON public.configuracion FOR ALL USING (public.es_admin());

-- Políticas para documentos legales
DROP POLICY IF EXISTS "Admin acceso total a documentos_legales" ON public.documentos_legales;
DROP POLICY IF EXISTS "Todos ven documentos_legales" ON public.documentos_legales;

CREATE POLICY "Admin acceso total a documentos_legales" ON public.documentos_legales FOR ALL USING (public.es_admin());
CREATE POLICY "Todos ven documentos_legales" ON public.documentos_legales FOR SELECT USING (true);

-- ============================================
-- STORAGE BUCKETS SETUP
-- ============================================

-- Bucket fotos-servicio
INSERT INTO storage.buckets (id, name, public) 
VALUES ('fotos-servicio', 'fotos-servicio', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Bucket documentos (NUEVO)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Limpiar políticas de storage
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Acceso público a fotos" ON storage.objects;
    DROP POLICY IF EXISTS "Usuarios autenticados suben fotos" ON storage.objects;
    DROP POLICY IF EXISTS "Acceso público a documentos" ON storage.objects;
    DROP POLICY IF EXISTS "Admin sube documentos" ON storage.objects;
END $$;

-- Fotos
CREATE POLICY "Acceso público a fotos" ON storage.objects FOR SELECT USING (bucket_id = 'fotos-servicio');
CREATE POLICY "Usuarios autenticados suben fotos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'fotos-servicio' AND (public.es_admin() OR public.es_tecnico())
);

-- Documentos Legales
CREATE POLICY "Acceso público a documentos" ON storage.objects FOR SELECT USING (bucket_id = 'documentos');
CREATE POLICY "Admin sube documentos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'documentos' AND public.es_admin()
);
CREATE POLICY "Admin borra documentos" ON storage.objects FOR DELETE USING (
  bucket_id = 'documentos' AND public.es_admin()
);

-- TRIGGER TRIGGER: auto-crear perfil al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre_completo, rol, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'tecnico'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STORAGE POLICIES (Bucket: fotos-servicio)
-- ============================================

-- Asegurar que el bucket sea público
UPDATE storage.buckets SET public = true WHERE id = 'fotos-servicio';

-- Limpiar políticas de storage
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Acceso público a fotos" ON storage.objects;
    DROP POLICY IF EXISTS "Usuarios autenticados suben fotos" ON storage.objects;
END $$;

-- Permitir que todos vean las fotos (necesario para certificados)
CREATE POLICY "Acceso público a fotos" ON storage.objects FOR SELECT USING (bucket_id = 'fotos-servicio');

-- Solo administradores y técnicos pueden subir archivos
CREATE POLICY "Usuarios autenticados suben fotos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'fotos-servicio' 
  AND (public.es_admin() OR public.es_tecnico())
);
