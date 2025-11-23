import { useState, useEffect } from 'react'
import { AgentConfig, getStoredAgents, saveAgent, deleteAgent } from '../lib/ai/agent-service'
import { Plus, Trash2, Save } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

export default function SettingsPage() {
  const [agents, setAgents] = useState<AgentConfig[]>([])
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('openai')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4o')

  useEffect(() => {
    setAgents(getStoredAgents())
  }, [])

  const handleSaveAgent = (e: React.FormEvent) => {
    e.preventDefault()
    const newAgent: AgentConfig = {
      id: uuidv4(),
      name,
      provider,
      apiKey,
      model
    }
    saveAgent(newAgent)
    setAgents(getStoredAgents())
    setShowAddModal(false)
    resetForm()
  }

  const handleDeleteAgent = (id: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      deleteAgent(id)
      setAgents(getStoredAgents())
    }
  }

  const resetForm = () => {
    setName('')
    setApiKey('')
    setProvider('openai')
    setModel('gpt-4o')
  }

  return (
    <div className="p-10 h-full overflow-y-auto relative text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_55%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(129,140,248,0.05),_transparent_60%)] pointer-events-none" />
      <div className="relative z-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/70 mb-2">Conexões</p>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-white/60">Configure your AI agents</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold shadow-lg shadow-blue-900/40 hover:opacity-90 transition"
        >
          <Plus size={20} />
          <span>Add Agent</span>
        </button>
      </div>

      <div className="grid gap-6">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5)] flex justify-between items-center"
          >
            <div>
              <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
              <div className="flex gap-3 text-sm text-white/70 mt-2">
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 capitalize">
                  {agent.provider}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">
                  {agent.model}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleDeleteAgent(agent.id)}
              className="p-2 text-red-300 hover:bg-red-500/10 rounded transition-colors border border-transparent hover:border-red-400/40"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}

        {agents.length === 0 && (
          <div className="text-center py-12 text-white/60 bg-white/5 rounded-2xl border border-dashed border-white/20">
            <p>No agents configured. Add one to start using AI features.</p>
          </div>
        )}
      </div>

      {/* Add Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50">
          <div className="bg-[#060a12] p-6 rounded-2xl w-full max-w-md border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.7)]">
            <h2 className="text-xl font-bold text-white mb-4">Add New Agent</h2>
            <form onSubmit={handleSaveAgent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400/60"
                  placeholder="e.g., GPT-4o Assistant"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400/60"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Model</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400/60"
                  placeholder="e.g., gpt-4o"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400/60"
                  placeholder="sk-..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white flex items-center gap-2 shadow-lg shadow-blue-900/40 hover:opacity-90"
                >
                  <Save size={18} />
                  Save Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
