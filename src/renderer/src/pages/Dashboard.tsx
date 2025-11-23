import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Loader2, Search, Grid, FileText, Clock } from 'lucide-react'
import { Button } from '../components/ui'

type Board = {
  id: string
  name: string
  description: string | null
  created_at: string
}

export default function Dashboard(): React.ReactElement {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [newBoardDescription, setNewBoardDescription] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({ totalBoards: 0, totalProcesses: 0, recentActivity: '--' })

  useEffect(() => {
    fetchBoards()
    fetchStats()
  }, [])

  const fetchBoards = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBoards(data || [])
    } catch (error) {
      console.error('Error fetching boards:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async (): Promise<void> => {
    try {
      const [boardsRes, processesRes] = await Promise.all([
        supabase.from('boards').select('id', { count: 'exact', head: true }),
        supabase.from('processes').select('id', { count: 'exact', head: true })
      ])

      // Get most recent activity (board or process creation)
      const { data: recentBoard } = await supabase
        .from('boards')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setStats({
        totalBoards: boardsRes.count || 0,
        totalProcesses: processesRes.count || 0,
        recentActivity: recentBoard
          ? new Date(recentBoard.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short'
          })
          : '--'
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleCreateBoard = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setCreateLoading(true)

    try {
      const { data, error } = await supabase
        .from('boards')
        .insert([
          {
            name: newBoardName,
            description: newBoardDescription,
            created_by: user?.id
          }
        ])
        .select()

      if (error) throw error

      setBoards([data[0], ...boards])
      setIsCreateModalOpen(false)
      setNewBoardName('')
      setNewBoardDescription('')
      fetchStats()
    } catch (error) {
      console.error('Error creating board:', error)
      alert('Failed to create board. Ensure you have admin privileges.')
    } finally {
      setCreateLoading(false)
    }
  }

  const filteredBoards = boards.filter(
    (board) =>
      board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      board.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 h-full flex flex-col bg-transparent overflow-hidden p-10 relative text-white">
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/70 mb-2">Visão geral</p>
            <h2 className="text-3xl font-bold text-white mb-1">Dashboard</h2>
            <p className="text-white/60 text-sm">Acompanhe quadros, processos e atividades recentes.</p>
          </div>
          <div className="flex flex-col items-end gap-4">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2 rounded-full border border-white/10 bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2 text-sm font-semibold shadow-lg shadow-black/30"
            >
              <Plus size={16} />
              Create Board
            </button>
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search boards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/60 transition-colors text-sm pl-10"
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40"
                size={16}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Metrics Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Total Boards Card */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between h-40 relative overflow-hidden group hover:border-cyan-400/40 transition-colors shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
              <div>
                <p className="text-white/60 text-sm font-medium mb-2">Total Boards</p>
                <h3 className="text-4xl font-bold">{stats.totalBoards}</h3>
              </div>
              <div className="self-end mt-auto text-cyan-200/60">
                <Grid size={28} />
              </div>
            </div>

            {/* Total Processes Card */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between h-40 relative overflow-hidden group hover:border-cyan-400/40 transition-colors shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
              <div>
                <p className="text-white/60 text-sm font-medium mb-2">Total Processes</p>
                <h3 className="text-4xl font-bold">{stats.totalProcesses}</h3>
              </div>
              <div className="self-end mt-auto text-fuchsia-200/60">
                <FileText size={28} />
              </div>
            </div>

            {/* Recent Activity Card */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between h-40 relative overflow-hidden group hover:border-cyan-400/40 transition-colors shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
              <div>
                <p className="text-white/60 text-sm font-medium mb-2">Recent Activity</p>
                <h3 className="text-3xl font-bold">{stats.recentActivity}</h3>
              </div>
              <div className="self-end mt-auto text-amber-200/60">
                <Clock size={28} />
              </div>
            </div>
          </section>

          {/* Your Boards Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Coleções</p>
                <h3 className="text-lg font-semibold text-white">Your Boards</h3>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-300" />
              </div>
            ) : filteredBoards.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/20">
                <p className="text-white/60">No boards found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBoards.map((board) => (
                  <div
                    key={board.id}
                    onClick={() => navigate(`/board/${board.id}`)}
                    className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-cyan-400/40 transition cursor-pointer group relative shadow-[0_30px_60px_rgba(0,0,0,0.45)]"
                  >
                    <div className="absolute top-6 right-6">
                      <span className="px-3 py-1 rounded-full text-[10px] font-medium bg-white/10 text-white/70 uppercase tracking-[0.3em]">
                        Active
                      </span>
                    </div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white/70 group-hover:text-white transition-colors">
                        <Grid size={24} />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-lg">{board.name}</h4>
                        <p className="text-white/60 text-xs mt-1">
                          {board.description || 'No description provided'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-white/50 text-xs">
                      <span>
                        Updated {new Date(board.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Create Board Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50">
            <div className="bg-dark-900 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.7)] w-full max-w-md border border-white/10 p-6 m-4">
              <h2 className="text-xl font-bold text-white mb-1">Create New Board</h2>
              <p className="text-sm text-white/60 mb-6">Add a new board to organize your processes</p>

              <form onSubmit={handleCreateBoard} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Board Name</label>
                  <input
                    type="text"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400/60 transition-colors"
                    placeholder="e.g., HR Processes"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400/60 resize-none h-24 transition-colors"
                    placeholder="Optional description..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-white/60 hover:text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createLoading}
                    className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-90 text-white font-bold border-none rounded-xl"
                  >
                    {createLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Create Board'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
