import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await signIn(email, password)
      if (error) throw error
      toast.success('Login realizado com sucesso!')
      navigate('/')
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'Falha ao fazer login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 font-sans relative overflow-hidden px-4">
      <div className="relative w-full max-w-xl bg-white/5 backdrop-blur-3xl px-10 py-12 rounded-[32px] border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.65)]">
        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[0.6em] text-cyan-300/80 mb-3">Workspace</p>
          <h1 className="text-4xl font-black text-white mb-2">DNIT BPMN</h1>
          <p className="text-white/70 text-sm">Autentique-se para acessar seus quadros e processos.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-300">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-[0.4em] text-white/60 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/60 transition"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.4em] text-white/60 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/60 transition"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 hover:opacity-90 text-white font-semibold rounded-2xl transition flex items-center justify-center shadow-lg shadow-cyan-900/40 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
