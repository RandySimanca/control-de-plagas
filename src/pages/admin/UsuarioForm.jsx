import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UsuarioForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clientes, setClientes] = useState([])
  const [form, setForm] = useState({
    nombre_completo: '', email: '', password: '', telefono: '',
    rol: 'tecnico', especialidad: '', activo: true, cliente_id: ''
  })

  useEffect(() => {
    loadClientes()
    if (isEdit) loadUser()
  }, [id])

  async function loadClientes() {
    const { data } = await supabase.from('clientes').select('id, nombre').eq('activo', true).order('nombre')
    setClientes(data || [])
  }

  async function loadUser() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
      if (error) throw error
      setForm({ ...data, password: '' })
    } catch {
      toast.error('Error cargando usuario')
      navigate('/admin/usuarios')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre_completo.trim()) { toast.error('El nombre es obligatorio'); return }
    setSaving(true)

    try {
      if (isEdit) {
        const { error } = await supabase.from('profiles').update({
          nombre_completo: form.nombre_completo, telefono: form.telefono,
          rol: form.rol, especialidad: form.especialidad, activo: form.activo,
          cliente_id: form.rol === 'cliente' ? form.cliente_id || null : null,
          updated_at: new Date().toISOString()
        }).eq('id', id)
        if (error) throw error
        toast.success('Usuario actualizado')
      } else {
        if (!form.email || !form.password) { toast.error('Email y contraseña son obligatorios'); setSaving(false); return }
        // Create auth user with metadata
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              nombre_completo: form.nombre_completo,
              rol: form.rol
            }
          }
        })
        if (authError) throw authError

        // Update profile with extra fields
        if (authData.user) {
          await supabase.from('profiles').update({
            telefono: form.telefono,
            especialidad: form.especialidad,
            activo: form.activo,
            cliente_id: form.rol === 'cliente' ? form.cliente_id || null : null,
          }).eq('id', authData.user.id)
        }
        toast.success('Usuario creado exitosamente')
      }
      navigate('/admin/usuarios')
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción solo borrará su perfil, no su cuenta de acceso de Supabase.')) return
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (error) throw error
      toast.success('Usuario eliminado')
      navigate('/admin/usuarios')
    } catch (err) {
      toast.error('Error al eliminar: ' + err.message)
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
      <Link to="/admin/usuarios" className="inline-flex items-center gap-2 text-sm text-dark-500 hover:text-dark-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver
      </Link>
      <div className="card">
        <h1 className="text-xl font-bold text-dark-900 mb-6">{isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label-field">Nombre completo *</label>
            <input className="input-field" value={form.nombre_completo} onChange={e => handleChange('nombre_completo', e.target.value)} placeholder="Nombre del usuario" />
          </div>

            <div className={`grid grid-cols-1 ${!isEdit ? 'sm:grid-cols-2' : ''} gap-5`}>
              <div>
                <label className="label-field">Email *</label>
                <input 
                  className={`input-field ${isEdit ? 'bg-dark-50 opacity-70 cursor-not-allowed' : ''}`} 
                  type="email" 
                  value={form.email} 
                  onChange={e => handleChange('email', e.target.value)} 
                  placeholder="correo@ejemplo.com"
                  readOnly={isEdit}
                />
              </div>
              {!isEdit && (
                <div>
                  <label className="label-field">Contraseña *</label>
                  <input className="input-field" type="password" value={form.password} onChange={e => handleChange('password', e.target.value)} placeholder="Mínimo 6 caracteres" />
                </div>
              )}
            </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label-field">Teléfono</label>
              <input className="input-field" value={form.telefono || ''} onChange={e => handleChange('telefono', e.target.value)} placeholder="Número de teléfono" />
            </div>
            <div>
              <label className="label-field">Rol *</label>
              <select className="input-field" value={form.rol} onChange={e => handleChange('rol', e.target.value)}>
                <option value="admin">Administrador</option>
                <option value="tecnico">Técnico</option>
                <option value="cliente">Cliente</option>
              </select>
            </div>
          </div>

          {form.rol === 'tecnico' && (
            <div>
              <label className="label-field">Especialidad</label>
              <input className="input-field" value={form.especialidad || ''} onChange={e => handleChange('especialidad', e.target.value)} placeholder="Ej: Desratización, Fumigación general..." />
            </div>
          )}

          {form.rol === 'cliente' && (
            <div>
              <label className="label-field">Vincular a cliente</label>
              <select className="input-field" value={form.cliente_id || ''} onChange={e => handleChange('cliente_id', e.target.value)}>
                <option value="">Seleccionar cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <p className="text-xs text-dark-400 mt-1">Vincula este usuario con un registro de cliente para que vea sus servicios en el portal</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.activo} onChange={e => handleChange('activo', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-dark-300 peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
            <span className="text-sm font-medium text-dark-700">Usuario activo</span>
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-dark-100">
            <button type="submit" disabled={saving} className="btn-primary flex-1 min-w-[150px]">
              {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <><Save className="w-5 h-5" /> {isEdit ? 'Guardar Cambios' : 'Crear Usuario'}</>}
            </button>
            
            {isEdit && (
              <button 
                type="button" 
                onClick={handleDelete}
                disabled={saving}
                className="btn-secondary text-red-600 hover:bg-red-50 hover:border-red-200"
              >
                Eliminar
              </button>
            )}
            
            <Link to="/admin/usuarios" className="btn-secondary text-center">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
