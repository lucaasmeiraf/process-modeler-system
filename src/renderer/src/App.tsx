import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SidebarProvider } from './contexts/SidebarContext'
import { Toaster } from 'sonner'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SettingsPage from './pages/Settings'
import ProcessesPage from './pages/Processes'
import MainLayout from './components/MainLayout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-950 text-white">
        Loading...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}

function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <Toaster position="top-right" theme="dark" richColors />
      <SidebarProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <PrivateRoute>
                  <MainLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="board/:boardId" element={<ProcessesPage />} />
            </Route>
          </Routes>
        </Router>
      </SidebarProvider>
    </AuthProvider>
  )
}

export default App
