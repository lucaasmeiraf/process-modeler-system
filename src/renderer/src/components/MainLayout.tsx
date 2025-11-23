import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  Layers,
  User,
  Search
} from 'lucide-react'

import { useSidebar } from '../contexts/SidebarContext'
import NotificationCenter from './NotificationCenter'
import SearchModal from './SearchModal'

export default function MainLayout(): React.ReactElement {
  const { user, signOut } = useAuth()
  const { hideSidebar, setHideSidebar } = useSidebar()
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const location = useLocation()

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen bg-dark-900 text-white overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Mobile Sidebar Overlay */}
      {!hideSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setHideSidebar(true)}
        />
      )}

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

          {/* User Profile Section */}
          <div className="mb-8 p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 shadow-inner group hover:border-white/20 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 p-[2px] shadow-lg shadow-purple-900/20">
                <div className="w-full h-full rounded-full bg-dark-800 flex items-center justify-center overflow-hidden">
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} className="text-white/80" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}
                </h3>
                <p className="text-xs text-white/50 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            <Link
              to="/"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${location.pathname === '/'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-900/20'
                : 'text-dark-300 hover:bg-white/5 hover:text-white'
                }`}
            >
              <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Dashboard</span>
            </Link>
          </nav>

          {/* Footer Actions */}
          <div className="mt-auto pt-6 border-t border-white/10 space-y-2">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 group"
            >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-dark-900 relative">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-dark-900/50 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setHideSidebar(!hideSidebar)}
              className="p-2 text-dark-400 hover:text-white hover:bg-white/5 rounded-lg transition md:hidden"
            >
              {hideSidebar ? <Menu size={20} /> : <X size={20} />}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-dark-400 hover:text-white hover:bg-white/5 rounded-lg transition"
              title="Buscar (Ctrl+K)"
            >
              <Search size={20} />
            </button>
            <NotificationCenter />
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-900/20">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto relative">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
          <Outlet />
        </div>
      </main>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  )
}
