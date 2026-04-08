import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClienteForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nombre: '', direccion: '', telefono: '', email: '', tipo: 'residencial', notas: ''
  })

  useEffect(() => {
    if (isEdit) loadCliente()
  }, [id])

  async function loadCliente() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single()
      if (error) throw error
      setForm(data)
    } catch {
      toast.error('Error cargando cliente')
      navigate('/clientes')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    setSaving(true)
    try {
      if (isEdit) {
        const { error } = await supabase.from('clientes').update({
          nombre: form.nombre, direccion: form.direccion, telefono: form.telefono,
          email: form.email, tipo: form.tipo, notas: form.notas, updated_at: new Date().toISOString()
        }).eq('id', id)
        if (error) throw error
        toast.success('Cliente actualizado')
      } else {
        const { error } = await supabase.from('clientes').insert({
          nombre: form.nombre, direccion: form.direccion, telefono: form.telefono,
          email: form.email, tipo: form.tipo, notas: form.notas
        })
        if (error) throw error
        toast.success('Cliente creado')
      }
      navigate('/clientes')
    } catch (err) {
      toast.error('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/clientes" className="inline-flex items-center gap-2 text-sm text-dark-500 hover:text-dark-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver a clientes
      </Link>
      <div className="card">
        <h1 className="text-xl font-bold text-dark-900 mb-6">
          {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label-field">Nombre *</label>
            <input className="input-field" value={form.nombre} onChange={e => handleChange('nombre', e.target.value)} placeholder="Nombre del cliente" />
          </div>
          <div>
            <label className="label-field">Dirección</label>
            <input className="input-field" value={form.direccion || ''} onChange={e => handleChange('direccion', e.target.value)} placeholder="Dirección completa" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label-field">Teléfono</label>
              <input className="input-field" value={form.telefono || ''} onChange={e => handleChange('telefono', e.target.value)} placeholder="Número de teléfono" />
            </div>
            <div>
              <label className="label-field">Email</label>
              <input className="input-field" type="email" value={form.email || ''} onChange={e => handleChange('email', e.target.value)} placeholder="correo@ejemplo.com" />
            </div>
          </div>
          <div>
            <label className="label-field">Tipo de cliente</label>
            <div className="flex gap-3">
              {['residencial', 'industrial'].map(tipo => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => handleChange('tipo', tipo)}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.tipo === tipo
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-dark-200 text-dark-500 hover:border-dark-300'
                  }`}
                >
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label-field">Notas</label>
            <textarea className="input-field" rows={3} value={form.notas || ''} onChange={e => handleChange('notas', e.target.value)} placeholder="Notas adicionales..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> {isEdit ? 'Guardar Cambios' : 'Crear Cliente'}</>}
            </button>
            <Link to="/clientes" className="btn-secondary">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
