import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Save, Loader2, Plus, Trash2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

export default function OrdenForm() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clientes, setClientes] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [fotos, setFotos] = useState([])
  const [form, setForm] = useState({
    cliente_id: searchParams.get('cliente') || '',
    tecnico_id: profile?.id || '',
    fecha_programada: new Date().toISOString().split('T')[0],
    tipo_plaga: '',
    observaciones: '',
    estado: 'programada',
  })
  const [productos, setProductos] = useState([{ nombre_producto: '', cantidad: '' }])

  useEffect(() => {
    loadData()
    if (isEdit) loadOrden()
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
      const [ordenRes, prodsRes] = await Promise.all([
        supabase.from('ordenes_servicio').select('*').eq('id', id).single(),
        supabase.from('productos_usados').select('*').eq('orden_id', id)
      ])
      if (ordenRes.error) throw ordenRes.error
      setForm(ordenRes.data)
      if (prodsRes.data?.length) setProductos(prodsRes.data)
    } catch {
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
      const validProds = productos.filter(p => p.nombre_producto.trim())
      if (validProds.length > 0) {
        if (isEdit) await supabase.from('productos_usados').delete().eq('orden_id', ordenId)
        await supabase.from('productos_usados').insert(
          validProds.map(p => ({ orden_id: ordenId, nombre_producto: p.nombre_producto, cantidad: p.cantidad }))
        )
      }

      // Upload photos
      for (const foto of fotos) {
        const path = `ordenes/${ordenId}/${Date.now()}_${foto.name}`
        const { error: uploadErr } = await supabase.storage.from('fotos-servicio').upload(path, foto)
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('fotos-servicio').getPublicUrl(path)
          await supabase.from('fotos_servicio').insert({
            orden_id: ordenId, storage_path: path, url: urlData.publicUrl
          })
        }
      }

      toast.success(isEdit ? 'Orden actualizada' : 'Orden creada')
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
              <label className="label-field">Tipo de plaga</label>
              <input className="input-field" value={form.tipo_plaga || ''} onChange={e => handleChange('tipo_plaga', e.target.value)} placeholder="Ej: Cucarachas, Roedores..." />
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
            <div className="space-y-2">
              {productos.map((p, idx) => (
                <div key={idx} className="flex gap-2">
                  <input className="input-field flex-1" value={p.nombre_producto} onChange={e => updateProducto(idx, 'nombre_producto', e.target.value)} placeholder="Nombre del producto" />
                  <input className="input-field w-28" value={p.cantidad} onChange={e => updateProducto(idx, 'cantidad', e.target.value)} placeholder="Cantidad" />
                  {productos.length > 1 && (
                    <button type="button" onClick={() => setProductos(prev => prev.filter((_, i) => i !== idx))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setProductos(prev => [...prev, { nombre_producto: '', cantidad: '' }])} className="btn-ghost text-sm mt-2 text-primary-600">
              <Plus className="w-4 h-4" /> Agregar producto
            </button>
          </div>

          {/* Observations */}
          <div>
            <label className="label-field">Observaciones</label>
            <textarea className="input-field" rows={3} value={form.observaciones || ''} onChange={e => handleChange('observaciones', e.target.value)} placeholder="Notas del servicio..." />
          </div>

          {/* Photos */}
          <div>
            <label className="label-field">Fotos</label>
            <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-dark-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50/50 transition-colors">
              <Upload className="w-5 h-5 text-dark-400" />
              <span className="text-sm text-dark-500">{fotos.length > 0 ? `${fotos.length} archivo(s) seleccionado(s)` : 'Haz clic para subir fotos'}</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={e => setFotos(Array.from(e.target.files))} />
            </label>
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
