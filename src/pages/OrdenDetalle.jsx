import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { generarCertificado, abrirCertificado } from '../lib/generarCertificado'
import {
  ArrowLeft, Edit, Calendar, User, MapPin, Package,
  FileText, Camera, CheckCircle2, Clock, Play, Loader2, PenLine,
  History, MessageSquare, Upload, X, Plus, Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function OrdenDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin, profile } = useAuth()
  const [orden, setOrden] = useState(null)
  const [productos, setProductos] = useState([])
  const [fotos, setFotos] = useState([])
  const [certificado, setCertificado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generando, setGenerando] = useState(false)
  const [actividades, setActividades] = useState([])
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [newActivity, setNewActivity] = useState('')
  const [activityPhotos, setActivityPhotos] = useState([])
  const [savingActivity, setSavingActivity] = useState(false)

  useEffect(() => { load() }, [id])

  async function load() {
    try {
      const [ordenRes, prodsRes, fotosRes, certRes, actividadesRes] = await Promise.all([
        supabase.from('ordenes_servicio').select(`*, clientes(*), profiles(*)`).eq('id', id).single(),
        supabase.from('productos_usados').select('*').eq('orden_id', id),
        supabase.from('fotos_servicio').select('*').eq('orden_id', id),
        supabase.from('certificados').select('*').eq('orden_id', id).maybeSingle(),
        supabase.from('actividades_servicio').select('*').eq('orden_id', id).order('created_at', { ascending: true })
      ])

      if (ordenRes.error) throw ordenRes.error
      setOrden(ordenRes.data)
      setProductos(prodsRes.data || [])
      setFotos(fotosRes.data || [])
      setCertificado(certRes.data)
      setActividades(actividadesRes.data || [])
    } catch (err) {
      console.error('Error loading order details:', err)
      toast.error('Error cargando orden')
      navigate('/ordenes')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteOrden() {
    if (!confirm('¿Estás seguro de eliminar esta orden? Se borrarán también todas las actividades, fotos y el certificado asociado.')) return
    try {
      const { error } = await supabase.from('ordenes_servicio').delete().eq('id', id)
      if (error) throw error
      toast.success('Orden eliminada exitosamente')
      navigate('/ordenes')
    } catch (err) {
      toast.error('Error al eliminar: ' + err.message)
    }
  }

  async function cambiarEstado(nuevoEstado) {
    try {
      const updates = { estado: nuevoEstado, updated_at: new Date().toISOString() }
      if (nuevoEstado === 'completada') {
        updates.fecha_completada = new Date().toISOString().split('T')[0]
        // Auto-create certificate record if it doesn't exist
        if (!certificado) {
          const folio = `PC-${Date.now().toString(36).toUpperCase()}`
          await supabase.from('certificados').insert({ orden_id: id, folio })
          setCertificado({ folio })
        }
      }
      await supabase.from('ordenes_servicio').update(updates).eq('id', id)
      setOrden(prev => ({ ...prev, ...updates }))
      toast.success(`Estado cambiado a ${nuevoEstado.replace('_', ' ')}`)
    } catch (err) { 
      console.error(err)
      toast.error('Error al cambiar estado') 
    }
  }


  async function handleGenerarCertificado() {
    setGenerando(true)
    try {
      const folio = `PC-${Date.now().toString(36).toUpperCase()}`
      const { data: config } = await supabase.from('configuracion').select('*').single()
      
      // Save cert record
      if (!certificado) {
        await supabase.from('certificados').insert({ orden_id: id, folio })
      } else {
        // Just update folio if needed, but usually it exists
        await supabase.from('certificados').update({ folio }).eq('orden_id', id)
      }

      await abrirCertificado({
        folio,
        cliente: orden.clientes,
        orden,
        productos,
        tecnico: orden.profiles?.nombre_completo || 'N/A',
        config,
        firma: certificado?.firma_url,
        firma_tecnico: orden.profiles?.firma_url,
        actividades,
        fotos
      })

      setCertificado(prev => ({ ...prev, folio }))
      toast.success('Certificado generado')
    } catch (err) {
      toast.error('Error generando certificado: ' + err.message)
    } finally {
      setGenerando(false)
    }
  }

  async function descargarCertificado() {
    const { data: config } = await supabase.from('configuracion').select('*').single()
      await abrirCertificado({
        folio: certificado.folio,
        cliente: orden.clientes,
        orden,
        productos,
        tecnico: orden.profiles?.nombre_completo || 'N/A',
        config,
        firma: certificado?.firma_url,
        firma_tecnico: orden.profiles?.firma_url,
        actividades,
        fotos
      })
  }
  async function handleSaveActivity(e) {
    e.preventDefault()
    if (!newActivity.trim()) return
    setSavingActivity(true)
    try {
      // 1. Create activity record
      const { data: actData, error: actErr } = await supabase
        .from('actividades_servicio')
        .insert({ orden_id: id, descripcion: newActivity })
        .select()
        .single()
      if (actErr) throw actErr

      // 2. Upload photos if any
      if (activityPhotos.length > 0) {
        for (const file of activityPhotos) {
          const path = `actividades/act_${id}_${Date.now()}_${file.name}`
          const { error: upErr } = await supabase.storage.from('fotos-servicio').upload(path, file)
          if (upErr) throw upErr
          const { data: urlData } = supabase.storage.from('fotos-servicio').getPublicUrl(path)
          await supabase.from('fotos_servicio').insert({
            orden_id: id,
            storage_path: path,
            url: urlData.publicUrl,
            descripcion: newActivity.substring(0, 50)
          })
        }
        // Refresh photos
        const { data: freshFotos } = await supabase.from('fotos_servicio').select('*').eq('orden_id', id)
        setFotos(freshFotos || [])
      }

      setActividades([actData, ...actividades])
      setNewActivity('')
      setActivityPhotos([])
      setShowActivityModal(false)
      toast.success('Actividad registrada')
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setSavingActivity(false)
    }
  }

  const handlePhotoChange = (e) => {
    if (e.target.files) {
      setActivityPhotos(Array.from(e.target.files))
    }
  }

  const estadoBadge = { programada: 'badge-programada', en_progreso: 'badge-en-progreso', completada: 'badge-completada' }
  const estadoLabel = { programada: 'Programada', en_progreso: 'En Progreso', completada: 'Completada' }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
  }

  if (!orden) return null

  const isAssignedTecnico = orden.tecnico_id === profile?.id
  const canManage = isAdmin

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/ordenes" className="inline-flex items-center gap-2 text-sm text-dark-500 hover:text-dark-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver
      </Link>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-dark-900">{orden.clientes?.nombre}</h1>
              <div className="flex items-center gap-2">
                <span className={estadoBadge[orden.estado]}>{estadoLabel[orden.estado]}</span>
                {canManage && (
                  <button 
                    onClick={handleDeleteOrden}
                    className="p-1.5 text-dark-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Eliminar Orden"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-dark-400">Orden creada el {new Date(orden.created_at).toLocaleDateString('es')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAssignedTecnico && orden.estado === 'programada' && (
              <button onClick={() => cambiarEstado('en_progreso')} className="btn-secondary text-sm">
                <Play className="w-4 h-4" /> Iniciar
              </button>
            )}
            {isAssignedTecnico && orden.estado === 'en_progreso' && (
              <button onClick={() => cambiarEstado('completada')} className="btn-primary text-sm">
                <CheckCircle2 className="w-4 h-4" /> Finalizar Servicio
              </button>
            )}
            {canManage && (
              <Link to={`/ordenes/${id}/editar`} className="btn-secondary text-sm">
                <Edit className="w-4 h-4" /> Editar
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 text-sm text-dark-600">
            <Calendar className="w-4 h-4 text-dark-400" /> <span className="font-medium">Fecha:</span> {orden.fecha_programada}
          </div>
          <div className="flex items-center gap-2 text-sm text-dark-600">
            <User className="w-4 h-4 text-dark-400" /> <span className="font-medium">Técnico:</span> {orden.profiles?.nombre_completo || 'Sin asignar'}
          </div>
          {orden.tipo_plaga && (
            <div className="flex items-center gap-2 text-sm text-dark-600">
              <span className="font-medium">Plaga:</span> {orden.tipo_plaga}
            </div>
          )}
          {orden.clientes?.direccion && (
            <div className="flex items-center gap-2 text-sm text-dark-600">
              <MapPin className="w-4 h-4 text-dark-400" /> {orden.clientes.direccion}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products */}
        <div className="card">
          <h2 className="text-lg font-bold text-dark-900 flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary-600" /> Productos Utilizados
          </h2>
          {productos.length === 0 ? (
            <p className="text-sm text-dark-400">Sin productos registrados</p>
          ) : (
            <div className="space-y-2">
              {productos.map((p, i) => (
                <div key={i} className="flex justify-between items-center py-2 px-3 bg-dark-50 rounded-lg">
                  <span className="text-sm font-medium text-dark-700">{p.nombre_producto}</span>
                  <span className="text-sm text-dark-500">{p.cantidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Observations */}
        <div className="card">
          <h2 className="text-lg font-bold text-dark-900 flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary-600" /> Observaciones
          </h2>
          <p className="text-sm text-dark-600 whitespace-pre-wrap">{orden.observaciones || 'Sin observaciones'}</p>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-dark-900 flex items-center gap-2">
            <History className="w-5 h-5 text-primary-600" /> Bitácora de Actividad
          </h2>
          {isAssignedTecnico && orden.estado === 'en_progreso' && (
            <button onClick={() => setShowActivityModal(true)} className="btn-secondary text-sm py-1.5">
              <Plus className="w-4 h-4" /> Registrar Avance
            </button>
          )}
        </div>

        {actividades.length === 0 ? (
          <div className="text-center py-8 bg-dark-50 rounded-xl border border-dashed border-dark-200">
            <MessageSquare className="w-8 h-8 text-dark-300 mx-auto mb-2" />
            <p className="text-sm text-dark-400">No hay avances registrados aún</p>
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-dark-100">
            {actividades.map((act, idx) => (
              <div key={act.id} className="relative pl-10">
                <div className="absolute left-0 top-1 w-9 h-9 rounded-full bg-white border-2 border-primary-500 flex items-center justify-center z-10">
                  <div className="w-2 h-2 rounded-full bg-primary-600" />
                </div>
                <div className="bg-dark-50 p-4 rounded-xl border border-dark-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">Avance de Servicio</span>
                    <span className="text-xs text-dark-400">{new Date(act.created_at).toLocaleTimeString('es', {hour:'2-digit', minute:'2-digit'})} - {new Date(act.created_at).toLocaleDateString('es')}</span>
                  </div>
                  <p className="text-sm text-dark-700 leading-relaxed">{act.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photos */}
      {fotos.length > 0 && (
        <div className="card mt-6">
          <h2 className="text-lg font-bold text-dark-900 flex items-center gap-2 mb-4">
            <Camera className="w-5 h-5 text-primary-600" /> Fotos ({fotos.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {fotos.map(f => (
              <a key={f.id} href={f.url} target="_blank" rel="noopener" className="aspect-square rounded-xl overflow-hidden bg-dark-100">
                <img src={f.url} alt="Foto servicio" className="w-full h-full object-cover hover:scale-105 transition-transform" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Certificate */}
      <div className="card mt-6">
        <h2 className="text-lg font-bold text-dark-900 flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-primary-600" /> Certificado
        </h2>
        {orden.estado !== 'completada' ? (
          <div className="flex items-center gap-2 text-sm text-dark-400">
            <Clock className="w-4 h-4" /> El certificado estará disponible cuando la orden se marque como completada
          </div>
        ) : certificado ? (
          <div className="flex items-center justify-between bg-green-50 p-4 rounded-xl">
            <div>
              <p className="font-semibold text-green-800">Certificado generado</p>
              <p className="text-sm text-green-600">Folio: {certificado.folio}</p>
            </div>
            <button onClick={descargarCertificado} className="btn-primary text-sm">Descargar PDF</button>
          </div>
        ) : (
          <button onClick={handleGenerarCertificado} disabled={generando} className="btn-primary">
            {generando ? <Loader2 className="w-5 h-5 animate-spin" /> : <><FileText className="w-5 h-5" /> Generar Certificado</>}
          </button>
        )}
      </div>

      {/* Activity Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-dark-100 flex items-center justify-between">
              <h3 className="font-bold text-dark-900">Registrar Nuevo Avance</h3>
              <button onClick={() => setShowActivityModal(false)} className="p-2 hover:bg-dark-50 rounded-lg text-dark-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveActivity} className="p-6 space-y-4">
              <div>
                <label className="label-field">Descripción del trabajo realizado</label>
                <textarea 
                  className="input-field min-h-[120px] resize-none" 
                  value={newActivity} 
                  onChange={e => setNewActivity(e.target.value)}
                  placeholder="Ej: Se realizó inspección en cocina, se encontraron focos de humedad..."
                  required
                />
              </div>
              <div>
                <label className="label-field">Fotos del avance (4-6 recomendadas)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dark-200 border-dashed rounded-xl hover:border-primary-400 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-10 w-10 text-dark-400" />
                    <div className="flex text-sm text-dark-600">
                      <span className="font-medium text-primary-600">Sube archivos</span>
                      <p className="pl-1">o arrastra y suelta</p>
                    </div>
                    <p className="text-xs text-dark-400">JPG, PNG hasta 10MB</p>
                  </div>
                </div>
                {activityPhotos.length > 0 && (
                  <p className="text-xs text-primary-600 mt-2 font-medium">
                    {activityPhotos.length} fotos seleccionadas
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={savingActivity} className="btn-primary flex-1">
                  {savingActivity ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Guardar Avance'}
                </button>
                <button type="button" onClick={() => setShowActivityModal(false)} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
