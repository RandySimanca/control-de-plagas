import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, Users, ClipboardList, FileCheck, UserCog,
  Menu, X, LogOut, Shield, Bug, Download
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

export default function Layout() {
  const { profile, logout, isAdmin, isSuperadmin, empresa } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const { canInstall, promptInstall, handleDismiss } = useInstallPrompt()

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Panel' },
    { to: '/clientes', icon: Users, label: 'Clientes' },
    { to: '/ordenes', icon: ClipboardList, label: 'Órdenes' },
    { to: '/certificados', icon: FileCheck, label: 'Certificados' },
  ]

  if (isAdmin) {
    navItems.push({ to: '/admin/usuarios', icon: UserCog, label: 'Usuarios' })
    navItems.push({ to: '/admin/configuracion', icon: Shield, label: 'Configuración' })
  }

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
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
      isActive
        ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
        : 'text-dark-600 hover:bg-dark-100 hover:text-dark-900'
    }`

  return (
    <div className="h-screen flex flex-col md:flex-row bg-dark-50">
      {/* PWA Install Banner */}
      {canInstall && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-primary-600 text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <Download className="w-4 h-4 shrink-0" />
            <span className="font-medium">¡Instala PlagControl como app!</span>
            <span className="hidden sm:inline text-primary-100">Accede más rápido desde tu dispositivo.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={promptInstall}
              className="bg-white text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="text-primary-100 hover:text-white p-1 rounded-lg hover:bg-primary-700 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Offset for banner */}
      {canInstall && <div className="h-[42px] md:hidden" />}

      {/* Mobile Header */}
      <header className={`md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-dark-200 z-30 ${canInstall ? 'mt-[42px]' : ''}`}>
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
        ${canInstall ? 'md:pt-[42px]' : ''}
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
          {/* eslint-disable-next-line no-unused-vars */}
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={linkClasses}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

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
