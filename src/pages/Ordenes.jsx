import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Search, Calendar, User, ChevronRight, Trash2, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'
import { confirmDelete, successAlert } from '../lib/alerts'

export default function Ordenes() {
  const { isAdmin, profile } = useAuth()
  const [ordenes, setOrdenes] = useState([])
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [loading, setLoading] = useState(true)

  useEffect(() => { 
    if (profile || isAdmin) loadOrdenes() 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, isAdmin])

  async function handleDelete(e, id) {
    e.preventDefault()
    e.stopPropagation()
    
    const isConfirmed = await confirmDelete('¿Estás seguro de eliminar esta orden?', 'Se borrarán todos los datos asociados.')
    if (!isConfirmed) return
    
    try {
      const { error } = await supabase.from('ordenes_servicio').delete().eq('id', id)
      if (error) throw error
      setOrdenes(ordenes.filter(o => o.id !== id))
      await successAlert('Eliminada', 'La orden de servicio ha sido eliminada.')
    } catch (err) {
      toast.error('Error al eliminar: ' + err.message)
    }
  }

  async function loadOrdenes() {
    try {
      let query = supabase
        .from('ordenes_servicio')
        .select(`*, clientes(nombre), profiles(nombre_completo)`)
        .order('fecha_programada', { ascending: false })

      if (!isAdmin && profile?.id) {
        query = query.eq('tecnico_id', profile.id)
      }

      const { data, error } = await query
      if (error) throw error
      setOrdenes(data || [])
    } catch (err) {
      console.error('Error:', err)
      toast.error('Error al cargar órdenes')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { key: 'todos', label: 'Todas', count: ordenes.length },
    { key: 'programada', label: 'Programadas', count: ordenes.filter(o => o.estado === 'programada').length },
    { key: 'en_progreso', label: 'En Progreso', count: ordenes.filter(o => o.estado === 'en_progreso').length },
    { key: 'completada', label: 'Completadas', count: ordenes.filter(o => o.estado === 'completada').length },
  ]

  const filtered = ordenes.filter(o => {
    const nombreCliente = o.clientes?.nombre?.toLowerCase() || ''
    const tipoPlaga = o.tipo_plaga?.toLowerCase() || ''
    const searchTerm = search.toLowerCase()

    const matchSearch = nombreCliente.includes(searchTerm) || tipoPlaga.includes(searchTerm)
    const matchEstado = filtroEstado === 'todos' || o.estado === filtroEstado
    return matchSearch && matchEstado
  })

  const estadoBadge = { programada: 'badge-programada', en_progreso: 'badge-en-progreso', completada: 'badge-completada' }
  const estadoLabel = { programada: 'Programada', en_progreso: 'En Progreso', completada: 'Completada' }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Órdenes de Servicio</h1>
          <p className="page-subtitle">{ordenes.length} órdenes registradas</p>
        </div>
        {isAdmin && (
          <Link to="/ordenes/nueva" className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> Nueva Orden
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFiltroEstado(tab.key)}
            className={`flex-1 min-w-fit px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              filtroEstado === tab.key
                ? 'bg-white text-dark-900 shadow-sm'
                : 'text-dark-500 hover:text-dark-700'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-10"
          placeholder="Buscar por cliente o tipo de control..."
        />
      </div>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <ClipboardList className="w-12 h-12 text-dark-300 mx-auto mb-3" />
          <p className="text-dark-500">No se encontraron órdenes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(orden => (
            <Link key={orden.id} to={`/ordenes/${orden.id}`} className="card-hover flex items-center justify-between group">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  orden.estado === 'completada' ? 'bg-green-100' :
                  orden.estado === 'en_progreso' ? 'bg-amber-100' : 'bg-blue-100'
                }`}>
                  <Calendar className={`w-6 h-6 ${
                    orden.estado === 'completada' ? 'text-green-600' :
                    orden.estado === 'en_progreso' ? 'text-amber-600' : 'text-blue-600'
                  }`} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-dark-900 truncate">{orden.clientes?.nombre}</p>
                  <div className="flex items-center gap-3 text-xs text-dark-400 mt-0.5">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {orden.fecha_programada}</span>
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {orden.profiles?.nombre_completo || 'Sin asignar'}</span>
                  </div>
                  {orden.tipo_plaga && <p className="text-xs text-dark-500 mt-1">{orden.tipo_plaga}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={estadoBadge[orden.estado]}>{estadoLabel[orden.estado]}</span>
                <div className="flex items-center gap-1">
                  {isAdmin && (
                    <button 
                      onClick={(e) => handleDelete(e, orden.id)}
                      className="p-2 text-dark-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronRight className="w-5 h-5 text-dark-300 group-hover:text-primary-600 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
