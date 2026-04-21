import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, Users, ClipboardList, FileCheck, UserCog,
  Menu, X, LogOut, Shield, Bug, Download, ClipboardCheck
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { supabase } from '../lib/supabase'

export default function Layout() {
  const { profile, logout, isAdmin, isSuperadmin, empresa } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const { canInstall, isReady, promptInstall } = useInstallPrompt()
  const [requestCount, setRequestCount] = useState(0)

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Panel' },
    { to: '/clientes', icon: Users, label: 'Clientes' },
    { to: '/ordenes', icon: ClipboardList, label: 'Órdenes' },
    { to: '/certificados', icon: FileCheck, label: 'Certificados' },
  ].filter(item => {
    if (item.to === '/clientes' && profile?.rol === 'tecnico') return false
    return true
  })

  if (isAdmin) {
    navItems.push({ to: '/admin/usuarios', icon: UserCog, label: 'Usuarios' })
    navItems.push({ to: '/admin/configuracion', icon: Shield, label: 'Configuración' })
    navItems.push({ to: '/admin/solicitudes', icon: ClipboardCheck, label: 'Solicitudes', badge: requestCount })
  }

  async function loadRequestCount() {
    try {
      const { count } = await supabase
        .from('solicitudes_servicio')
        .select('id', { count: 'exact', head: true })
        .in('estado', ['pendiente', 'aceptada'])
      
      setRequestCount(count || 0)
    } catch {
      console.error('Error cargando solicitudes')
      toast.error('No se pudieron cargar las solicitudes')
    }
  }

  useEffect(() => {
    if (isAdmin) {
      const initLoad = async () => {
        await loadRequestCount()
      }
      initLoad()
      
      const interval = setInterval(loadRequestCount, 30000) // Cada 30 seg
      return () => clearInterval(interval)
    }
  }, [isAdmin])

  async function handleLogout() {
    try {
      await logout()
      navigate('/login')
      toast.success('Sesión cerrada')
    } catch {
      toast.error('Error al cerrar sesión')
    }
  }

  const linkClasses = ({ isActive }) =>
    `flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
      isActive
        ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
        : 'text-dark-600 hover:bg-dark-100 hover:text-dark-900'
    }`

  return (
    <div className="h-screen flex flex-col md:flex-row bg-dark-50">

      {/* Mobile Header */}
      <header className={`md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-dark-200 z-30`}>
        <div className="flex items-center gap-2">
          {(!isSuperadmin && empresa?.logo_url) ? (
            <img src={empresa.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white" />
          ) : (
            <Bug className="w-6 h-6 text-primary-600" />
          )}
          <span className="font-bold text-lg text-dark-900 truncate max-w-[150px]">{isSuperadmin ? 'PlagControl' : (empresa?.nombre || 'PlagControl')}</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-dark-100">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-20" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-dark-200
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        flex flex-col
      `}>
        {/* Logo */}
        <div className="hidden md:flex items-center gap-3 px-6 py-5 border-b border-dark-100">
          {(!isSuperadmin && empresa?.logo_url) ? (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-dark-100 p-1">
              <img src={empresa.logo_url} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Bug className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-bold text-lg text-dark-900 leading-tight truncate">{isSuperadmin ? 'PlagControl' : (empresa?.nombre || 'PlagControl')}</h1>
            <p className="text-xs text-dark-400">Panel Operativo</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto mt-14 md:mt-0">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={linkClasses}
              onClick={() => setSidebarOpen(false)}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

          {canInstall && (
            <button 
              onClick={promptInstall}
              className={`flex items-center gap-2 w-full justify-start text-sm px-4 py-2.5 rounded-xl font-semibold shadow-md transition-all duration-200 mb-2 ${
                isReady 
                ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-600/20' 
                : 'bg-dark-200 text-dark-500 cursor-not-allowed opacity-80'
              }`}
            >
              <Download className="w-5 h-5 shrink-0" /> 
              <span>{isReady ? 'Instalar Aplicación' : 'Preparando Instalación...'}</span>
            </button>
          )}
          {/* Debug Indicator */}
          {window.location.hostname !== 'localhost' && (
            <div className="flex items-center gap-1.5 px-1">
              <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
              <p className="text-[9px] text-dark-400 font-medium">
                PWA: {isReady ? 'Listo para instalar' : 'Esperando navegador...'}
              </p>
            </div>
          )}

        {/* User */}
        <div className="p-4 border-t border-dark-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-dark-900 truncate">{profile?.nombre_completo}</p>
              <p className="text-xs text-dark-400 capitalize">{profile?.rol}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost w-full justify-start text-sm text-red-600 hover:bg-red-50">
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
