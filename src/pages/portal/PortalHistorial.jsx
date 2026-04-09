import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { generarCertificado, abrirCertificado } from '../../lib/generarCertificado'
import { useNavigate, Link } from 'react-router-dom'
import {
  Bug, LogOut, ClipboardList, FileCheck, Calendar, Download,
  CheckCircle2, Clock, Play, ChevronRight, FileText
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function PortalHistorial() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [ordenes, setOrdenes] = useState([])
  const [certificados, setCertificados] = useState([])
  const [documentos, setDocumentos] = useState([])
  const [tab, setTab] = useState('historial')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [profile])

  async function load() {
    if (!profile?.cliente_id) { setLoading(false); return }
    try {
      const [ordenesRes, certsRes, docsRes] = await Promise.all([
        supabase.from('ordenes_servicio')
          .select(`*, profiles(nombre_completo), productos_usados:productos_usados(*)`)
          .eq('cliente_id', profile.cliente_id)
          .order('fecha_programada', { ascending: false }),
        supabase.from('certificados')
          .select(`
            *, 
            ordenes_servicio!inner(*, profiles(nombre_completo), productos_usados:productos_usados(*))
          `)
          .eq('ordenes_servicio.cliente_id', profile.cliente_id)
          .order('created_at', { ascending: false }),
        supabase.from('documentos_legales').select('*').order('nombre', { ascending: true })
      ])
      setOrdenes(ordenesRes.data || [])
      setCertificados(certsRes.data || [])
      setDocumentos(docsRes.data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function descargarDoc(doc) {
    try {
      const { data, error } = await supabase.storage
        .from('documentos')
        .download(doc.storage_path)

      if (error) throw error

      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      const safeName = doc.nombre.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      a.download = `${safeName}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      toast.error('Error al descargar documento')
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/portal/login')
    toast.success('Sesión cerrada')
  }

  async function descargarCert(cert) {
    const orden = cert.ordenes_servicio
    const { data: config } = await supabase.from('configuracion').select('*').single()
    const [actividadesRes, fotosRes] = await Promise.all([
      supabase.from('actividades_servicio').select('*').eq('orden_id', orden.id).order('created_at', { ascending: false }),
      supabase.from('fotos_servicio').select('*').eq('orden_id', orden.id)
    ])
    await abrirCertificado({
      folio: cert.folio, cliente: orden.clientes, orden,
      productos: orden.productos_usados || [], tecnico: orden.profiles?.nombre_completo || 'N/A',
      config,
      firma: cert.firma_url,
      actividades: actividadesRes.data || [],
      fotos: fotosRes.data || []
    })
  }

  const estadoConfig = {
    programada: { badge: 'badge-programada', label: 'Programada', icon: Clock },
    en_progreso: { badge: 'badge-en-progreso', label: 'En Progreso', icon: Play },
    completada: { badge: 'badge-completada', label: 'Completada', icon: CheckCircle2 },
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
  }

  return (
    <div className="min-h-screen bg-dark-50">
      {/* Header */}
      <header className="bg-white border-b border-dark-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="w-6 h-6 text-primary-600" />
            <span className="font-bold text-dark-900">Portal de Clientes</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-dark-500 hidden sm:block">{profile?.nombre_completo}</span>
            <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="page-title mb-1">¡Hola, {profile?.nombre_completo?.split(' ')[0]}!</h1>
        <p className="page-subtitle mb-6">Consulta tu historial de servicios y certificados</p>

        {/* Tabs */}
        <div className="flex gap-1 bg-dark-100 p-1 rounded-xl mb-6">
          <button onClick={() => setTab('historial')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'historial' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'}`}>
            <ClipboardList className="w-4 h-4" /> Historial
          </button>
          <button onClick={() => setTab('certificados')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'certificados' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'}`}>
            <FileCheck className="w-4 h-4" /> Certificados
          </button>
          <button onClick={() => setTab('legal')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'legal' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'}`}>
            <FileText className="w-4 h-4" /> Legalidad
          </button>
        </div>

        {!profile?.cliente_id ? (
          <div className="card text-center py-12">
            <p className="text-dark-500">Tu cuenta no está vinculada a un registro de clientes. Contacta al administrador.</p>
          </div>
        ) : tab === 'historial' ? (
          /* Service History */
          ordenes.length === 0 ? (
            <div className="card text-center py-12">
              <ClipboardList className="w-12 h-12 text-dark-300 mx-auto mb-3" />
              <p className="text-dark-500">No hay servicios registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ordenes.map(o => {
                const config = estadoConfig[o.estado]
                const IconComp = config.icon
                return (
                  <Link to={`/portal/ordenes/${o.id}`} key={o.id} className="card block hover:shadow-md transition-all border border-dark-100 group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                          <Calendar className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-dark-900">{o.fecha_programada}</p>
                          <p className="text-xs text-dark-400">{o.tipo_plaga || 'Servicio general'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={config.badge}>{config.label}</span>
                        <ChevronRight className="w-4 h-4 text-dark-300 group-hover:text-primary-500 transition-colors" />
                      </div>
                    </div>
                    {o.profiles?.nombre_completo && (
                      <p className="text-sm text-dark-500 mb-2">Técnico: {o.profiles.nombre_completo}</p>
                    )}
                    {o.productos_usados?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {o.productos_usados.slice(0, 3).map((p, i) => (
                          <span key={i} className="badge bg-dark-100 text-dark-600 truncate max-w-[120px]">{p.nombre_producto}</span>
                        ))}
                        {o.productos_usados.length > 3 && (
                          <span className="text-xs text-dark-400">+{o.productos_usados.length - 3} más</span>
                        )}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )
        ) : tab === 'certificados' ? (
          /* Certificates */
          certificados.length === 0 ? (
            <div className="card text-center py-12">
              <FileCheck className="w-12 h-12 text-dark-300 mx-auto mb-3" />
              <p className="text-dark-500">No hay certificados disponibles</p>
            </div>
          ) : (
            <div className="space-y-3">
              {certificados.map(cert => (
                <div key={cert.id} className="card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <FileCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-dark-900">Folio: {cert.folio}</p>
                      <p className="text-xs text-dark-400">{new Date(cert.created_at).toLocaleDateString('es')}</p>
                    </div>
                  </div>
                  <button onClick={() => descargarCert(cert)} className="btn-primary text-sm">
                    <Download className="w-4 h-4" /> PDF
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Legal Documents */
          documentos.length === 0 ? (
            <div className="card text-center py-12">
              <FileText className="w-12 h-12 text-dark-300 mx-auto mb-3" />
              <p className="text-dark-500">No hay documentos legales disponibles</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documentos.map(doc => (
                <div 
                  key={doc.id} 
                  onClick={() => descargarDoc(doc)}
                  className="card flex items-center justify-between hover:bg-dark-50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-dark-900">{doc.nombre}</p>
                      <p className="text-xs text-dark-400">Firmado y Vigente</p>
                    </div>
                  </div>
                  <Download className="w-5 h-5 text-dark-300 group-hover:text-primary-600" />
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
