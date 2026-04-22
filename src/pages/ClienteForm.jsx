import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Save, Loader2, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { successAlert } from '../lib/alerts'

export default function ClienteForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nombre: '', 
    razon_social: '',
    identificacion: '',
    direccion: '', 
    telefono: '', 
    email: '', 
    nombre_contacto: '',
    telefono_contacto: '',
    tipo: 'residencial', 
    notas: ''
  })
  const [crearUsuario, setCrearUsuario] = useState(false)
  const [userPassword, setUserPassword] = useState('')
  const [tieneUsuario, setTieneUsuario] = useState(false)

  useEffect(() => {
    if (isEdit) loadCliente()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadCliente() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single()
      if (error) throw error
      setForm(data)
      // Check if client already has a linked user
      const { data: linkedUser } = await supabase.from('profiles').select('id').eq('cliente_id', id).maybeSingle()
      setTieneUsuario(!!linkedUser)
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
          nombre: form.nombre,
          razon_social: form.razon_social,
          identificacion: form.identificacion,
          direccion: form.direccion,
          telefono: form.telefono,
          email: form.email,
          nombre_contacto: form.nombre_contacto,
          telefono_contacto: form.telefono_contacto,
          tipo: form.tipo,
          notas: form.notas,
          updated_at: new Date().toISOString()
        }).eq('id', id)
        if (error) throw error

        // Crear cuenta de acceso al editar, si el toggle está activo y no tiene usuario
        if (crearUsuario && !tieneUsuario && form.email && userPassword) {
          const tempSupabase = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY,
            { auth: { persistSession: false } }
          )
          const { data: authData, error: authError } = await tempSupabase.auth.signUp({
            email: form.email,
            password: userPassword,
            options: {
              data: {
                nombre_completo: form.nombre,
                rol: 'cliente'
              }
            }
          })
          if (authError) {
            toast.error('Cliente actualizado, pero error al crear usuario: ' + authError.message)
          } else if (authData.user) {
            await supabase.from('profiles').update({
              rol: 'cliente',
              cliente_id: id,
              activo: true
            }).eq('id', authData.user.id)
            await successAlert('¡Cliente Actualizado!', 'Se actualizó el cliente y se creó su cuenta de acceso.')
          }
        } else {
          await successAlert('¡Cliente Actualizado!', 'Los datos del cliente se actualizaron correctamente.')
        }
      } else {
        const { data: newCliente, error } = await supabase.from('clientes').insert({
          nombre: form.nombre,
          razon_social: form.razon_social,
          identificacion: form.identificacion,
          direccion: form.direccion,
          telefono: form.telefono,
          email: form.email,
          nombre_contacto: form.nombre_contacto,
          telefono_contacto: form.telefono_contacto,
          tipo: form.tipo,
          notas: form.notas
        }).select().single()
        if (error) throw error

        // Crear cuenta de acceso si el toggle está activo
        if (crearUsuario && form.email && userPassword) {
          const tempSupabase = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY,
            { auth: { persistSession: false } }
          )
          const { data: authData, error: authError } = await tempSupabase.auth.signUp({
            email: form.email,
            password: userPassword,
            options: {
              data: {
                nombre_completo: form.nombre,
                rol: 'cliente'
              }
            }
          })
          if (authError) {
            toast.error('Cliente creado, pero error al crear usuario: ' + authError.message)
          } else if (authData.user) {
            await supabase.from('profiles').update({
              rol: 'cliente',
              cliente_id: newCliente.id,
              activo: true
            }).eq('id', authData.user.id)
            await successAlert('¡Cliente Creado!', 'Se creó el cliente y su cuenta de acceso exitosamente.')
          }
        } else {
          await successAlert('¡Cliente Creado!', 'El nuevo cliente se ha registrado con éxito.')
        }
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Nombre / Empresa *</label>
              <input className="input-field" value={form.nombre} onChange={e => handleChange('nombre', e.target.value)} placeholder="Ej: Juan Pérez" />
            </div>
            <div>
              <label className="label-field">Razón Social</label>
              <input className="input-field" value={form.razon_social || ''} onChange={e => handleChange('razon_social', e.target.value)} placeholder="Hotel Central" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Identificación / NIT</label>
              <input className="input-field" value={form.identificacion || ''} onChange={e => handleChange('identificacion', e.target.value)} placeholder="Cédula o NIT" />
            </div>
            <div>
              <label className="label-field">Dirección</label>
              <input className="input-field" value={form.direccion || ''} onChange={e => handleChange('direccion', e.target.value)} placeholder="Dirección completa" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Teléfono Principal</label>
              <input className="input-field" value={form.telefono || ''} onChange={e => handleChange('telefono', e.target.value)} placeholder="Número de contacto" />
            </div>
            <div>
              <label className="label-field">Correo Electrónico</label>
              <input className="input-field" type="email" value={form.email || ''} onChange={e => handleChange('email', e.target.value)} placeholder="correo@ejemplo.com" />
            </div>
          </div>

          <div className="bg-dark-50 p-4 rounded-xl border border-dark-100 mt-2">
            <h3 className="text-xs font-bold text-dark-500 uppercase tracking-wider mb-4">Contacto en Sitio</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field !text-dark-600">Nombre de Contacto</label>
                <input className="input-field bg-white" value={form.nombre_contacto || ''} onChange={e => handleChange('nombre_contacto', e.target.value)} placeholder="Persona que recibe el servicio" />
              </div>
              <div>
                <label className="label-field !text-dark-600">Teléfono de Contacto</label>
                <input className="input-field bg-white" value={form.telefono_contacto || ''} onChange={e => handleChange('telefono_contacto', e.target.value)} placeholder="Teléfono del contacto" />
              </div>
            </div>
          </div>

          <div>
            <label className="label-field">Tipo de cliente</label>
            <div className="flex gap-2">
              {['residencial', 'comercial', 'industrial'].map(tipo => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => handleChange('tipo', tipo)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.tipo === tipo
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-dark-100 text-dark-400 hover:border-dark-200'
                  }`}
                >
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {(!isEdit || (isEdit && !tieneUsuario)) ? (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mt-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-bold text-blue-800">¿Crear cuenta de acceso al portal?</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={crearUsuario} onChange={e => setCrearUsuario(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-dark-300 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              {crearUsuario && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-blue-200">
                  <div>
                    <label className="label-field !text-blue-700">Email de acceso</label>
                    <input 
                      className="input-field bg-white" 
                      type="email" 
                      value={form.email || ''} 
                      onChange={e => handleChange('email', e.target.value)} 
                      placeholder="correo@ejemplo.com" 
                      required 
                    />
                    <p className="text-[10px] text-blue-500 mt-1">Se usa el mismo email del cliente</p>
                  </div>
                  <div>
                    <label className="label-field !text-blue-700">Contraseña</label>
                    <input 
                      className="input-field bg-white" 
                      type="password" 
                      value={userPassword} 
                      onChange={e => setUserPassword(e.target.value)} 
                      placeholder="Mínimo 6 caracteres" 
                      required 
                      minLength={6}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : isEdit && tieneUsuario ? (
            <div className="bg-green-50 p-4 rounded-xl border border-green-200 mt-2 flex items-center gap-3">
              <UserPlus className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Este cliente ya tiene una cuenta de acceso al portal.</span>
            </div>
          ) : null}

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
