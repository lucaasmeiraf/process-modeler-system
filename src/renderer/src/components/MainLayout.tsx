import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  Settings,
  LogOut,
  User,
  Layers
} from 'lucide-react'
import clsx from 'clsx'
import { useSidebar } from '../contexts/SidebarContext'

export default function MainLayout(): React.ReactElement {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { hideSidebar } = useSidebar()

  const handleLogout = async (): Promise<void> => {
    try {
      setIsLoggingOut(true)
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Settings, label: 'Settings', path: '/settings' }
  ]

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#05070d] via-[#080d19] to-[#010203] font-sans text-white/90">
      {/* Sidebar */}
      {!hideSidebar && (
        <aside className="w-[280px] bg-white/5 backdrop-blur-2xl flex flex-col p-6 min-h-screen border-r border-white/10 shadow-[0_25px_50px_rgba(0,0,0,0.45)]">
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-900/40">
            <Layers size={24} />
          </div>
          <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/70">workspace</p>
              <h1 className="text-xl font-bold text-white leading-tight">DNIT BPMN</h1>
              <p className="text-xs text-white/60">Process Modeler</p>
          </div>
        </div>

        {/* User Profile Section (Moved to Top) */}
        <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
            <User size={16} />
          </div>
          <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">
              {user?.email?.split('@')[0] || 'User'}
            </p>
              <p className="text-xs text-white/60 truncate">
              {user?.email || 'admin'}
            </p>
          </div>
        </div>

        {/* Navigation */}
          <nav className="flex-grow space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={clsx(
                    'w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group border border-transparent',
                    isActive
                      ? 'bg-white/10 text-white shadow-lg shadow-black/20 border-white/20'
                      : 'text-white/70 hover:bg-white/5 hover:text-white/90'
                )}
              >
                <item.icon
                  size={18}
                  className={clsx(
                    'mr-3',
                      isActive ? 'text-white' : 'text-white/60 group-hover:text-white'
                  )}
                />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            )
          })}

          {/* Sign Out Button as Nav Item */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
              className="w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 text-white/70 hover:bg-white/5 hover:text-white group border border-transparent"
          >
              <LogOut size={18} className="mr-3 text-white/60 group-hover:text-white" />
            <span className="font-medium text-sm">
              {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
            </span>
          </button>
        </nav>
        </aside>
      )}

      {/* Content Area */}
      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
