import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Building2, Plus, Users, CalendarIcon, AlertTriangle } from 'lucide-react'

export default function DashboardSAAS() {
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEmpresas()
  }, [])

  async function loadEmpresas() {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setEmpresas(data)
      }
    } finally {
      setLoading(false)
    }
  }

  const activas = empresas.filter(e => e.estado_licencia === 'activa').length
  const vencidas = empresas.filter(e => e.estado_licencia === 'vencida').length

  const renderEstadoBadge = (estado) => {
    switch (estado) {
      case 'activa': return <span className="bg-green-100 text-green-700 font-medium text-xs px-2 py-1 rounded-full">Activa</span>
      case 'suspendida': return <span className="bg-orange-100 text-orange-700 font-medium text-xs px-2 py-1 rounded-full">Suspendida</span>
      case 'vencida': return <span className="bg-red-100 text-red-700 font-medium text-xs px-2 py-1 rounded-full">Vencida</span>
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">SaaS Superdashboard</h1>
          <p className="text-dark-500 mt-1">Gestión multitenant de empresas cliente</p>
        </div>
        <Link to="/superadmin/empresas/nueva" className="btn-primary w-full sm:w-auto">
          <Plus className="w-5 h-5 mr-2" />
          Nueva Empresa
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-indigo-100 font-medium">Total Empresas</p>
              <h3 className="text-3xl font-bold">{empresas.length}</h3>
            </div>
          </div>
        </div>
        
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-green-100 font-medium">Licencias Activas</p>
              <h3 className="text-3xl font-bold">{activas}</h3>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-red-100 font-medium">Licencias Vencidas</p>
              <h3 className="text-3xl font-bold">{vencidas}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-dark-100">
          <h2 className="text-lg font-bold text-dark-900">Directorio de Empresas</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-dark-50 text-dark-500 border-b border-dark-100">
              <tr>
                <th className="px-6 py-4 font-medium">Nombe comercial</th>
                <th className="px-6 py-4 font-medium">NIT</th>
                <th className="px-6 py-4 font-medium">Licencia</th>
                <th className="px-6 py-4 font-medium">Vencimiento</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-dark-400">Cardando...</td></tr>
              ) : empresas.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-dark-400">No hay empresas registradas</td></tr>
              ) : (
                empresas.map(empresa => (
                  <tr key={empresa.id} className="hover:bg-dark-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-dark-100 flex items-center justify-center shrink-0">
                          {empresa.logo_url ? (
                            <img src={empresa.logo_url} alt="Logo" className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <Building2 className="w-5 h-5 text-dark-400" />
                          )}
                        </div>
                        <span className="font-semibold text-dark-900">{empresa.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-600">{empresa.nit || '—'}</td>
                    <td className="px-6 py-4">{renderEstadoBadge(empresa.estado_licencia)}</td>
                    <td className="px-6 py-4 text-dark-600">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-dark-400" />
                        {empresa.fecha_vencimiento ? new Date(empresa.fecha_vencimiento).toLocaleDateString() : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/superadmin/empresas/${empresa.id}/editar`}
                        className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
                      >
                        Gestionar
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
