import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams, Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Save, Loader2, Plus, Trash2, Calendar as CalIcon, MapPin, User, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { successAlert } from '../lib/alerts'

export default function OrdenForm() {
   const { id } = useParams()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const isEdit = Boolean(id)
  
  const prefill = location.state?.prefill || {}

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clientes, setClientes] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [form, setForm] = useState({
    cliente_id: prefill.cliente_id || searchParams.get('cliente') || '',
    tecnico_id: profile?.id || '',
    fecha_programada: prefill.fecha_programada || new Date().toISOString().split('T')[0],
    tipo_plaga: prefill.tipo_plaga || '',
    observaciones: prefill.observaciones || '',
    estado: 'programada',
    solicitud_id: prefill.solicitud_id || null
  })
  const [productos, setProductos] = useState([{ tipo_producto: '', nombre_comercial: '', ingrediente_activo: '', cantidad: '' }])
  const [estaciones, setEstaciones] = useState([{ tipo_estacion: '', cantidad: '' }])

  useEffect(() => {
    loadData()
    if (isEdit) loadOrden()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadData() {
    const [clientesRes, tecnicosRes] = await Promise.all([
      supabase.from('clientes').select('id, nombre').eq('activo', true).order('nombre'),
      supabase.from('profiles').select('id, nombre_completo').eq('rol', 'tecnico').eq('activo', true)
    ])
    setClientes(clientesRes.data || [])
    setTecnicos(tecnicosRes.data || [])
  }

  async function loadOrden() {
    setLoading(true)
    try {
      const [ordenRes, prodsRes, estacRes] = await Promise.all([
        supabase.from('ordenes_servicio').select('*').eq('id', id).single(),
        supabase.from('productos_usados').select('*').eq('orden_id', id),
        supabase.from('estaciones_usadas').select('*').eq('orden_id', id)
      ])
      if (ordenRes.error) throw ordenRes.error
      setForm(ordenRes.data)
      if (prodsRes.data?.length) setProductos(prodsRes.data)
      if (estacRes.data?.length) setEstaciones(estacRes.data)
    } catch (err) {
      console.error('Error loading order for edit:', err)
      toast.error('Error cargando orden')
      navigate('/ordenes')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.cliente_id) { toast.error('Selecciona un cliente'); return }
    if (!form.fecha_programada) { toast.error('Selecciona una fecha'); return }
    setSaving(true)
    try {
      let ordenId = id
      if (isEdit) {
        const { error } = await supabase.from('ordenes_servicio').update({
          cliente_id: form.cliente_id, tecnico_id: form.tecnico_id || null,
          fecha_programada: form.fecha_programada, tipo_plaga: form.tipo_plaga,
          observaciones: form.observaciones, estado: form.estado,
          updated_at: new Date().toISOString()
        }).eq('id', id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('ordenes_servicio').insert({
          cliente_id: form.cliente_id, tecnico_id: form.tecnico_id || profile?.id,
          fecha_programada: form.fecha_programada, tipo_plaga: form.tipo_plaga,
          observaciones: form.observaciones, estado: form.estado
        }).select('id').single()
        if (error) throw error
        ordenId = data.id
      }

      // Save products
      const validProds = productos.filter(p => (p.nombre_comercial && p.nombre_comercial.trim()) || (p.nombre_producto && p.nombre_producto.trim()))
      if (validProds.length > 0) {
        if (isEdit) await supabase.from('productos_usados').delete().eq('orden_id', ordenId)
        await supabase.from('productos_usados').insert(
          validProds.map(p => ({ 
            orden_id: ordenId, 
            tipo_producto: p.tipo_producto,
            nombre_comercial: p.nombre_comercial || p.nombre_producto,
            ingrediente_activo: p.ingrediente_activo,
            cantidad: p.cantidad 
          }))
        )
      } else if (isEdit) {
        await supabase.from('productos_usados').delete().eq('orden_id', ordenId)
      }

      // Save estaciones
      const validEstaciones = estaciones.filter(e => e.tipo_estacion && e.cantidad)
      if (validEstaciones.length > 0) {
        if (isEdit) await supabase.from('estaciones_usadas').delete().eq('orden_id', ordenId)
        await supabase.from('estaciones_usadas').insert(
          validEstaciones.map(e => ({ orden_id: ordenId, tipo_estacion: e.tipo_estacion, cantidad: e.cantidad }))
        )
      } else if (isEdit) {
        await supabase.from('estaciones_usadas').delete().eq('orden_id', ordenId)
      }


      // Si viene de una solicitud, actualizar el estado de la misma
      if (!isEdit && form.solicitud_id) {
        await supabase
          .from('solicitudes_servicio')
          .update({ 
            estado: 'convertida', 
            orden_id: ordenId,
            updated_at: new Date().toISOString()
          })
          .eq('id', form.solicitud_id)
      }

      await successAlert(isEdit ? '¡Orden actualizada!' : '¡Orden creada!', isEdit ? 'La orden se guardó con éxito.' : 'La nueva orden se ha generado y asignado.')
      navigate(`/ordenes/${ordenId}`)
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function updateProducto(idx, field, value) {
    setProductos(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p))
  }

  function updateEstacion(idx, field, value) {
    setEstaciones(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e))
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/ordenes" className="inline-flex items-center gap-2 text-sm text-dark-500 hover:text-dark-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver
      </Link>
      <div className="card">
        <h1 className="text-xl font-bold text-dark-900 mb-6">{isEdit ? 'Editar Orden' : 'Nueva Orden de Servicio'}</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Client */}
          <div>
            <label className="label-field">Cliente *</label>
            <select className="input-field" value={form.cliente_id} onChange={e => handleChange('cliente_id', e.target.value)}>
              <option value="">Seleccionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Technician */}
            <div>
              <label className="label-field">Técnico</label>
              <select className="input-field" value={form.tecnico_id || ''} onChange={e => handleChange('tecnico_id', e.target.value)}>
                <option value="">Sin asignar</option>
                {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre_completo}</option>)}
              </select>
            </div>
            {/* Date */}
            <div>
              <label className="label-field">Fecha programada *</label>
              <input type="date" className="input-field" value={form.fecha_programada} onChange={e => handleChange('fecha_programada', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label-field">Tipo de Control</label>
              <select className="input-field" value={form.tipo_plaga || ''} onChange={e => handleChange('tipo_plaga', e.target.value)}>
                <option value="">Seleccione un tipo...</option>
                <option value="Desinsectación">Desinsectación</option>
                <option value="Desratización">Desratización</option>
                <option value="Desinfección">Desinfección</option>
              </select>
            </div>
            <div>
              <label className="label-field">Estado</label>
              <select className="input-field" value={form.estado} onChange={e => handleChange('estado', e.target.value)}>
                <option value="programada">Programada</option>
                <option value="en_progreso">En Progreso</option>
                <option value="completada">Completada</option>
              </select>
            </div>
          </div>

          {/* Products */}
          <div>
            <label className="label-field">Productos utilizados</label>
            <div className="space-y-4">
              {productos.map((p, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-2 border border-dark-200 p-3 rounded-xl bg-dark-50/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 flex-1">
                    <input className="input-field text-sm" value={p.tipo_producto || ''} onChange={e => updateProducto(idx, 'tipo_producto', e.target.value)} placeholder="Tipo de producto" />
                    <input className="input-field text-sm" value={p.nombre_comercial || p.nombre_producto || ''} onChange={e => updateProducto(idx, 'nombre_comercial', e.target.value)} placeholder="Nombre Comercial" />
                    <input className="input-field text-sm" value={p.ingrediente_activo || ''} onChange={e => updateProducto(idx, 'ingrediente_activo', e.target.value)} placeholder="Ingrediente Activo" />
                    <input className="input-field text-sm" value={p.cantidad || ''} onChange={e => updateProducto(idx, 'cantidad', e.target.value)} placeholder="Cant. (Ej: 2L)" />
                  </div>
                  {productos.length > 1 && (
                    <button type="button" onClick={() => setProductos(prev => prev.filter((_, i) => i !== idx))} className="p-2 text-red-500 hover:bg-red-100 rounded-lg shrink-0 self-start sm:self-center mt-2 sm:mt-0">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setProductos(prev => [...prev, { tipo_producto: '', nombre_comercial: '', ingrediente_activo: '', cantidad: '' }])} className="btn-ghost text-sm mt-3 text-primary-600 border border-primary-100 bg-primary-50">
              <Plus className="w-4 h-4" /> Agregar producto
            </button>
          </div>

          {/* Estaciones */}
          <div>
            <label className="label-field">Estaciones instaladas / revisadas</label>
            <div className="space-y-4">
              {estaciones.map((e, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-2 border border-dark-200 p-3 rounded-xl bg-dark-50/50">
                  <div className="flex-1 flex gap-2">
                    <select className="input-field flex-1 text-sm font-medium" value={e.tipo_estacion || ''} onChange={ev => updateEstacion(idx, 'tipo_estacion', ev.target.value)}>
                      <option value="">Seleccionar tipo...</option>
                      <option value="Cebadero">Cebadero</option>
                      <option value="Impacto">Impacto</option>
                      <option value="Jaula atrapavivos">Jaula atrapavivos</option>
                    </select>
                    <input className="input-field w-32 text-sm" value={e.cantidad || ''} onChange={ev => updateEstacion(idx, 'cantidad', ev.target.value)} placeholder="Cantidad" />
                  </div>
                  {estaciones.length > 1 && (
                    <button type="button" onClick={() => setEstaciones(prev => prev.filter((_, i) => i !== idx))} className="p-2 text-red-500 hover:bg-red-100 rounded-lg shrink-0 mt-2 sm:mt-0 self-start sm:self-center">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setEstaciones(prev => [...prev, { tipo_estacion: '', cantidad: '' }])} className="btn-ghost text-sm mt-3 text-primary-600 border border-primary-100 bg-primary-50">
              <Plus className="w-4 h-4" /> Agregar estación
            </button>
          </div>


          {/* Observations */}
          <div>
            <label className="label-field">Observaciones Generales</label>
            <textarea className="input-field" rows={2} value={form.observaciones || ''} onChange={e => handleChange('observaciones', e.target.value)} placeholder="Notas adicionales del servicio..." />
          </div>


          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> {isEdit ? 'Guardar' : 'Crear Orden'}</>}
            </button>
            <Link to="/ordenes" className="btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
