import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { generarCertificado as _generarCertificado, abrirCertificado } from '../../lib/generarCertificado'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import {
  Bug, LogOut, ClipboardList, FileCheck, Calendar, Download,
  CheckCircle2, Clock, Play, ChevronRight, FileText, PlusCircle, Bell
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'

export default function PortalHistorial() {
  const { profile, logout, licenseWarning } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { canInstall, promptInstall } = useInstallPrompt()
  const [ordenes, setOrdenes] = useState([])
  const [certificados, setCertificados] = useState([])
  const [documentos, setDocumentos] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [tab, setTab] = useState(location.state?.tab || 'historial')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!profile?.cliente_id) { setLoading(false); return }
      try {
        const [ordenesRes, certRes, docsRes, solRes] = await Promise.all([
          supabase.from('ordenes_servicio').select('*, profiles(nombre_completo)').eq('cliente_id', profile.cliente_id).order('created_at', { ascending: false }),
          supabase.from('certificados_servicio').select(`*, ordenes_servicio!inner(*)`).eq('ordenes_servicio.cliente_id', profile.cliente_id).order('created_at', { ascending: false }),
          supabase.from('documentos_clientes').select('*').eq('cliente_id', profile.cliente_id).order('created_at', { ascending: false }),
          supabase.from('solicitudes_servicio').select('*').eq('cliente_id', profile.cliente_id).order('created_at', { ascending: false })
        ])

        setOrdenes(ordenesRes.data || [])
        setCertificados(certRes.data || [])
        setDocumentos(docsRes.data || [])
        setSolicitudes(solRes.data || [])
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [profile])

  async function handleResponderCotizacion(sol, estado, motivo = null) {
    try {
      const { error } = await supabase.from('solicitudes_servicio').update({
        estado: estado === 'aceptada' ? 'aceptada' : 'rechazada',
        respuesta_cliente: estado,
        respuesta_fecha: new Date().toISOString(),
        motivo_rechazo: motivo,
        cotizacion_leida_por_cliente: true
      }).eq('id', sol.id)
      if (error) throw error
      toast.success('Respuesta enviada')
      window.location.reload()
    } catch { toast.error('Error al actualizar') }
  }

  async function marcarLeida(sol) {
    if (sol.cotizacion_leida_por_cliente) return
    await supabase.from('solicitudes_servicio').update({ cotizacion_leida_por_cliente: true }).eq('id', sol.id)
  }

  async function descargarCert(cert) {
    try {
      const orden = cert.ordenes_servicio
      // Cargar configuración para el PDF
      const { data: config } = await supabase.from('configuracion').select('*').single()
      
      // Actividades y fotos si las hay
      const [actividadesRes, fotosRes] = await Promise.all([
        supabase.from('actividades_servicio').select('*').eq('orden_id', orden.id).order('created_at', { ascending: false }),
        supabase.from('fotos_servicio').select('*').eq('orden_id', orden.id)
      ])

      await abrirCertificado({
        folio: cert.folio, 
        cliente: orden.clientes, 
        orden,
        productos: [], // En esta versión simplificada
        tecnico: orden.profiles?.nombre_completo || 'N/A',
        config,
        firma: cert.firma_url,
        actividades: actividadesRes.data || [],
        fotos: fotosRes.data || []
      })
    } catch {
      toast.error('Error al generar certificado')
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/portal/login')
    toast.success('Sesión cerrada')
  }

  const estadoConfig = {
    programada: { badge: 'badge-programada', label: 'Programada', icon: Clock },
    en_progreso: { badge: 'badge-en-progreso', label: 'En Progreso', icon: Play },
    completada: { badge: 'badge-completada', label: 'Completada', icon: CheckCircle2 },
  }

  const hasUnreadQuotes = solicitudes.some(s => s.estado === 'cotizada' && !s.leida)

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
  }

  return (
    <div className="min-h-screen bg-dark-50">
      <header className="bg-white border-b border-dark-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="w-6 h-6 text-primary-600" />
            <span className="font-bold text-dark-900">Portal de Clientes</span>
          </div>
          <div className="flex items-center gap-3">
            {canInstall && (
              <button onClick={promptInstall} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors border border-primary-200">
                <Download className="w-3.5 h-3.5" /> Instalar App
              </button>
            )}
            <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Aviso licencia vencida */}
      {licenseWarning && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800">Licencia de tu empresa vencida</p>
              <p className="text-xs text-amber-700 mt-0.5">Puedes solicitar servicios, pero el procesamiento está pausado hasta que la licencia sea renovada. Comunícate con tu proveedor para más información.</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="page-title mb-1">¡Hola, {profile?.nombre_completo?.split(' ')[0]}!</h1>
        <p className="page-subtitle mb-6">Consulta tu historial de servicios y certificados</p>

        <div className="flex gap-1 bg-dark-100 p-1 rounded-xl mb-6 overflow-x-auto">
          <button onClick={() => setTab('historial')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'historial' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'}`}>
            <ClipboardList className="w-4 h-4" /> Historial
          </button>
          <button onClick={() => setTab('certificados')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'certificados' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'}`}>
            <FileCheck className="w-4 h-4" /> Certificados
          </button>
          <button onClick={() => setTab('documentos')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'documentos' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'}`}>
            <FileText className="w-4 h-4" /> Documentos
          </button>
          <button onClick={() => setTab('solicitudes')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all relative ${tab === 'solicitudes' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'}`}>
            <PlusCircle className="w-4 h-4" /> Solicitudes {solicitudes.length > 0 && `(${solicitudes.length})`}
            {hasUnreadQuotes && <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-ping" />}
          </button>
        </div>

        {!profile?.cliente_id ? (
          <div className="card text-center py-12">
            <p className="text-dark-500">Tu cuenta no está vinculada a un registro de clientes.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-dark-900 capitalize">Mis {tab}</h2>
              {tab === 'solicitudes' && (
                <button onClick={() => navigate('/portal/solicitudes/nueva')} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4" /> Nueva Solicitud
                </button>
              )}
            </div>

            {tab === 'historial' && (
              <div className="space-y-3">
                {ordenes.map(o => {
                  const config = estadoConfig[o.estado] || { badge: 'badge-default', label: o.estado, icon: Calendar }
                  return (
                    <Link to={`/portal/ordenes/${o.id}`} key={o.id} className="card block hover:shadow-md transition-all border border-dark-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center"><config.icon className="w-5 h-5 text-primary-600" /></div>
                          <div>
                            <p className="font-semibold text-dark-900">{new Date(o.fecha_programada).toLocaleDateString()}</p>
                            <p className="text-xs text-dark-400">{o.tipo_plaga || 'Servicio'}</p>
                          </div>
                        </div>
                        <span className={config.badge}>{config.label}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {tab === 'certificados' && (
              <div className="space-y-3">
                {certificados.map(cert => (
                  <div key={cert.id} className="card flex items-center justify-between">
                    <div>
                      <p className="font-medium text-dark-900">Folio: {cert.folio}</p>
                      <p className="text-xs text-dark-400">{new Date(cert.created_at).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => descargarCert(cert)} className="btn-primary text-sm flex items-center gap-2">
                       <Download className="w-4 h-4" /> PDF
                    </button>
                  </div>
                ))}
              </div>
            )}

            {tab === 'documentos' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documentos.map(doc => (
                  <a key={doc.id} href={doc.archivo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-2xl border border-dark-100 hover:bg-primary-50 transition-all">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600"><FileText className="w-6 h-6" /></div>
                    <div>
                      <p className="font-bold text-dark-900">{doc.nombre}</p>
                      <p className="text-xs text-dark-400">Documento PDF</p>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {tab === 'solicitudes' && (
              <div className="space-y-4">
                {solicitudes.map(sol => (
                  <div key={sol.id} className="card border-dark-100/50 bg-white shadow-sm" onMouseEnter={() => sol.estado === 'cotizada' && marcarLeida(sol)}>
                    <div className="p-4 flex flex-col sm:flex-row gap-4 items-start justify-between">
                      <div className="flex gap-4 items-start">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          sol.estado === 'cotizada' ? 'bg-blue-100 text-blue-600' : 
                          sol.estado === 'aceptada' ? 'bg-green-100 text-green-600' :
                          sol.estado === 'convertida' ? 'bg-emerald-100 text-emerald-800' :
                          sol.estado === 'rechazada' ? 'bg-red-100 text-red-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          <ClipboardList className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-dark-900">{sol.tipo_servicio}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              sol.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                              sol.estado === 'cotizada' ? 'bg-blue-100 text-blue-700' :
                              sol.estado === 'aceptada' ? 'bg-green-100 text-green-700' :
                              sol.estado === 'convertida' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {sol.estado}
                            </span>
                          </div>
                          <p className="text-sm text-dark-600">{sol.descripcion}</p>
                          <p className="text-[10px] text-dark-400 mt-2">Solicitado: {new Date(sol.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {sol.estado === 'convertida' && sol.orden_id && (
                        <button 
                          onClick={() => navigate(`/portal/ordenes/${sol.orden_id}`)}
                          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                        >
                          Ver Orden <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {sol.estado === 'cotizada' && (
                      <div className="m-4 mt-0 p-5 bg-blue-50/50 border border-blue-100 rounded-2xl animate-in fade-in duration-500">
                        <div className="flex items-center gap-2 mb-3 text-blue-800">
                          <Bell className="w-4 h-4" />
                          <h4 className="font-bold text-sm">¡Cotización disponible!</h4>
                        </div>
                        <div className="mb-4">
                          <p className="text-2xl font-black text-blue-900 mb-1">${Number(sol.cotizacion_precio).toLocaleString()}</p>
                          <p className="text-sm text-blue-800 italic leading-relaxed">{sol.cotizacion_descripcion || 'Sin descripción adicional.'}</p>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => handleResponderCotizacion(sol, 'rechazada')} className="bg-white text-dark-500 border border-dark-200 text-sm font-bold flex-1 py-2.5 rounded-xl transition-all hover:bg-red-50 hover:text-red-600">Rechazar</button>
                          <button onClick={() => handleResponderCotizacion(sol, 'aceptada')} className="bg-primary-600 text-white text-sm font-bold flex-1 py-2.5 rounded-xl transition-all hover:bg-primary-700 shadow-md shadow-primary-600/20">Aceptar Cotización</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
