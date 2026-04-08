import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Search, Building2, Home, Phone, Mail, ChevronRight } from 'lucide-react'

export default function Clientes() {
  const { isAdmin } = useAuth()
  const [clientes, setClientes] = useState([])
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClientes()
  }, [])

  async function loadClientes() {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('activo', true)
        .order('nombre')
      if (error) throw error
      setClientes(data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = clientes.filter(c => {
    const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.direccion?.toLowerCase().includes(search.toLowerCase())
    const matchTipo = filtroTipo === 'todos' || c.tipo === filtroTipo
    return matchSearch && matchTipo
  })

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clientes.length} clientes registrados</p>
        </div>
        {isAdmin && (
          <Link to="/clientes/nuevo" className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> Nuevo Cliente
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
            placeholder="Buscar por nombre o dirección..."
          />
        </div>
        <div className="flex gap-2">
          {['todos', 'residencial', 'industrial'].map(tipo => (
            <button
              key={tipo}
              onClick={() => setFiltroTipo(tipo)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                filtroTipo === tipo
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-dark-200 text-dark-600 hover:bg-dark-50'
              }`}
            >
              {tipo === 'todos' ? 'Todos' : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Client Cards */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-dark-300 mx-auto mb-3" />
          <p className="text-dark-500">No se encontraron clientes</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(cliente => (
            <Link
              key={cliente.id}
              to={`/clientes/${cliente.id}`}
              className="card-hover group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    cliente.tipo === 'industrial' ? 'bg-orange-100' : 'bg-purple-100'
                  }`}>
                    {cliente.tipo === 'industrial'
                      ? <Building2 className="w-5 h-5 text-orange-600" />
                      : <Home className="w-5 h-5 text-purple-600" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-900 group-hover:text-primary-700 transition-colors">
                      {cliente.nombre}
                    </h3>
                    <span className={cliente.tipo === 'industrial' ? 'badge-industrial' : 'badge-residencial'}>
                      {cliente.tipo}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-dark-300 group-hover:text-primary-600 transition-colors shrink-0" />
              </div>
              {cliente.direccion && (
                <p className="text-sm text-dark-500 mb-2 truncate">{cliente.direccion}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-dark-400">
                {cliente.telefono && (
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {cliente.telefono}</span>
                )}
                {cliente.email && (
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {cliente.email}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
