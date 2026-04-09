import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Plus, Search, Shield, UserCog, Users as UsersIcon, UserCheck, UserX } from 'lucide-react'

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [search, setSearch] = useState('')
  const [filtroRol, setFiltroRol] = useState('todos')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('nombre_completo')
      if (error) throw error
      setUsuarios(data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = usuarios.filter(u => {
    const nombre = u.nombre_completo?.toLowerCase() || ''
    const email = u.email?.toLowerCase() || ''
    const searchTerm = search.toLowerCase()

    const matchSearch = nombre.includes(searchTerm) || email.includes(searchTerm)
    const matchRol = filtroRol === 'todos' || u.rol === filtroRol
    return matchSearch && matchRol
  })

  const rolIcons = {
    admin: <Shield className="w-4 h-4 text-red-500" />,
    tecnico: <UserCog className="w-4 h-4 text-blue-500" />,
    cliente: <UsersIcon className="w-4 h-4 text-purple-500" />,
  }

  const rolColors = {
    admin: 'bg-red-100 text-red-800',
    tecnico: 'bg-blue-100 text-blue-800',
    cliente: 'bg-purple-100 text-purple-800',
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Gestión de Usuarios</h1>
          <p className="page-subtitle">{usuarios.length} usuarios en el sistema</p>
        </div>
        <Link to="/admin/usuarios/nuevo" className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Nuevo Usuario
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-10" placeholder="Buscar por nombre..."
          />
        </div>
        <div className="flex gap-2">
          {['todos', 'admin', 'tecnico', 'cliente'].map(rol => (
            <button
              key={rol} onClick={() => setFiltroRol(rol)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                filtroRol === rol ? 'bg-primary-600 text-white' : 'bg-white border border-dark-200 text-dark-600 hover:bg-dark-50'
              }`}
            >
              {rol === 'todos' ? 'Todos' : rol.charAt(0).toUpperCase() + rol.slice(1) + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Users List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Usuario</th>
                <th className="text-left px-4 py-3">Rol</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Teléfono</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Especialidad</th>
                <th className="text-center px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-dark-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/admin/usuarios/${u.id}`} className="font-medium text-dark-900 hover:text-primary-600">
                      {u.nombre_completo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${rolColors[u.rol]} flex items-center gap-1 w-fit`}>
                      {rolIcons[u.rol]} {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-dark-500 hidden sm:table-cell">{u.telefono || '—'}</td>
                  <td className="px-4 py-3 text-sm text-dark-500 hidden md:table-cell">{u.especialidad || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {u.activo ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700"><UserCheck className="w-3.5 h-3.5" /> Activo</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500"><UserX className="w-3.5 h-3.5" /> Inactivo</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-dark-400 py-8 text-sm">No se encontraron usuarios</p>}
      </div>
    </div>
  )
}
