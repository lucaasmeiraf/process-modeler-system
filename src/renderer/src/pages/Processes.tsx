import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'
import BPMNModeler from '../components/BPMNModeler'
import PropertiesPanel from '../components/PropertiesPanel'
import { AgentService, getStoredAgents, ChatMessage } from '../lib/ai/agent-service'
import { getBoard } from '../lib/board-service'
import { Board } from '../types/board'
import BoardKnowledgePanel from '../components/BoardKnowledgePanel'
import VersionHistoryPanel from '../components/VersionHistoryPanel'
import ProcessDiffViewer from '../components/ProcessDiffViewer'
import { ProcessVersion } from '../types/versioning'
import ProcessAnalytics from '../components/ProcessAnalytics'
import BoardAnalytics from '../components/BoardAnalytics'
import {
  ArrowLeft,
  Plus,
  Save,
  FileText,
  Loader2,
  Send,
  Bot,
  User as UserIcon,
  Mic,
  Image as ImageIcon,
  Download,
  ChevronDown,
  History,
  BarChart2,
  PieChart,
  BookOpen
} from 'lucide-react'
import BpmnModeler from 'bpmn-js/lib/Modeler'
import { downloadXML, downloadSVG, generatePDF } from '../lib/export-service'

import { Process } from '../types/process'

export default function ProcessesPage() {
  const { boardId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { setHideSidebar } = useSidebar()

  const [board, setBoard] = useState<Board | null>(null)
  const [showKnowledgePanel, setShowKnowledgePanel] = useState(false)

  // Versioning State
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [compareVersion, setCompareVersion] = useState<ProcessVersion | null>(null)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showBoardAnalytics, setShowBoardAnalytics] = useState(false)

  const [processes, setProcesses] = useState<Process[]>([])
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [detailsSaving, setDetailsSaving] = useState(false)
  const [processTitleInput, setProcessTitleInput] = useState('')
  const [processDescriptionInput, setProcessDescriptionInput] = useState('')

  // Modeler state
  const [modeler, setModeler] = useState<BpmnModeler | null>(null)
  const [selectedElement, setSelectedElement] = useState<any>(null)
  const [xml, setXml] = useState<string | undefined>(undefined)

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const agents = getStoredAgents()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Multimodal state
  const [attachedImage, setAttachedImage] = useState<File | null>(null)
  const [attachedAudio, setAttachedAudio] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchBoardDetails = async (): Promise<void> => {
      if (!boardId) return
      const boardData = await getBoard(boardId)
      setBoard(boardData)
    }

    if (boardId) {
      fetchProcesses()
      fetchBoardDetails()
    }
  }, [boardId])

  useEffect(() => {
    setHideSidebar(Boolean(selectedProcess))
    return () => setHideSidebar(false)
  }, [selectedProcess, setHideSidebar])

  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id)
    }
  }, [agents])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProcessTitle, setNewProcessTitle] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  const fetchProcesses = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('processes')
        .select('*')
        .eq('board_id', boardId)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setProcesses(data || [])
    } catch (error) {
      console.error('Error fetching processes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProcess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProcessTitle.trim()) return

    setCreateLoading(true)
    try {
      const { data, error } = await supabase
        .from('processes')
        .insert([
          {
            board_id: boardId,
            title: newProcessTitle,
            created_by: user?.id,
            bpmn_xml: null
          }
        ])
        .select()

      if (error) throw error

      const newProcess = data[0]
      setProcesses([newProcess, ...processes])
      handleSelectProcess(newProcess)
      setShowCreateModal(false)
      setNewProcessTitle('')
    } catch (error) {
      console.error('Error creating process:', error)
      alert('Failed to create process. Please try again.')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleSelectProcess = (process: Process) => {
    setSelectedProcess(process)
    setXml(process.bpmn_xml || undefined)
    setSelectedElement(null)
    setChatMessages([
      { role: 'assistant', content: 'Hello! Describe the process you want to create or modify.' }
    ])
  }

  useEffect(() => {
    if (selectedProcess) {
      setProcessTitleInput(selectedProcess.title)
      setProcessDescriptionInput(selectedProcess.description || '')
    }
  }, [selectedProcess])

  const hasDetailsChanged = useMemo(() => {
    if (!selectedProcess) return false
    const normalizedDescription = processDescriptionInput.trim()
    const currentDescription = selectedProcess.description || ''
    return (
      processTitleInput.trim() !== selectedProcess.title ||
      normalizedDescription !== currentDescription
    )
  }, [processTitleInput, processDescriptionInput, selectedProcess])

  const handleUpdateProcessDetails = async () => {
    if (!selectedProcess || !processTitleInput.trim()) return

    setDetailsSaving(true)
    try {
      const updates = {
        title: processTitleInput.trim(),
        description: processDescriptionInput.trim() ? processDescriptionInput.trim() : null,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('processes')
        .update(updates)
        .eq('id', selectedProcess.id)
        .select()

      if (error) throw error

      const updatedProcess = data?.[0]
      if (updatedProcess) {
        setSelectedProcess(updatedProcess)
        setProcesses((prev) => prev.map((p) => (p.id === updatedProcess.id ? updatedProcess : p)))
      }
    } catch (error) {
      console.error('Error updating process details:', error)
      alert('Failed to update process details.')
    } finally {
      setDetailsSaving(false)
    }
  }

  const handleProcessDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (hasDetailsChanged) {
      handleUpdateProcessDetails()
    }
  }

  const handleSave = async () => {
    if (!selectedProcess || !modeler) return
    setSaving(true)

    try {
      const { xml } = await modeler.saveXML({ format: true })

      const { error } = await supabase
        .from('processes')
        .update({
          bpmn_xml: xml || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProcess.id)

      if (error) throw error

      setProcesses(
        processes.map((p) => (p.id === selectedProcess.id ? { ...p, bpmn_xml: xml || null } : p))
      )
    } catch (error) {
      console.error('Error saving process:', error)
      alert('Failed to save process.')
    } finally {
      setSaving(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'audio') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'image') setAttachedImage(e.target.files[0])
      if (type === 'audio') setAttachedAudio(e.target.files[0])
    }
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && !attachedAudio) || !selectedAgentId) return

    const agentConfig = agents.find((a) => a.id === selectedAgentId)
    if (!agentConfig) {
      alert('Please select a valid agent in Settings.')
      return
    }

    setIsGenerating(true)

    try {
      const agentService = new AgentService(agentConfig)
      let finalUserMessageContent: any = inputMessage

      // Handle Audio Transcription first if present
      if (attachedAudio) {
        try {
          const transcription = await agentService.transcribeAudio(attachedAudio)
          finalUserMessageContent = inputMessage
            ? `${inputMessage}\n\n[Audio Transcription]: ${transcription}`
            : transcription
        } catch (err) {
          console.error('Transcription failed', err)
          alert('Audio transcription failed. Proceeding with text only.')
        }
      }

      // Construct Message Content (Text + Image if applicable)
      let messageContent: any = finalUserMessageContent

      if (attachedImage) {
        const base64Image = await convertFileToBase64(attachedImage)
        messageContent = [
          { type: 'text', text: finalUserMessageContent },
          { type: 'image_url', image_url: { url: base64Image } }
        ]
      }

      const userMsg: ChatMessage = { role: 'user', content: messageContent }

      // Update local chat state immediately
      setChatMessages((prev) => [...prev, userMsg])
      setInputMessage('')
      setAttachedImage(null)
      setAttachedAudio(null)

      // Generate BPMN
      // We need to pass the entire history for context, but for this MVP we might just pass the current request
      // or a limited history. Let's pass history + new message.
      // Note: We need to be careful with passing base64 images in history repeatedly as it consumes tokens/bandwidth.
      // For now, let's just pass the current message + system prompt (handled in service)
      // or maybe the last few text messages.
      // A simple approach: Pass the current constructed message.

      const bpmnXml = await agentService.generateBPMN([userMsg], board || undefined)

      setXml(bpmnXml)
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I have generated the BPMN diagram based on your description.'
        }
      ])

      // Auto-save generated XML
      if (selectedProcess) {
        await supabase
          .from('processes')
          .update({ bpmn_xml: bpmnXml, updated_at: new Date().toISOString() })
          .eq('id', selectedProcess.id)
      }
    } catch (error: any) {
      console.error('Generation error:', error)
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${error.message}` }
      ])
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-dark-950 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-dark-400" />
      </div>
    )
  }

  const renderCreateModal = showCreateModal && (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50">
      <div className="bg-dark-900 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.7)] w-full max-w-md border border-white/10 p-6 m-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">{board?.name || 'Carregando...'}</h1>
          <button
            onClick={() => setShowBoardAnalytics(true)}
            className="p-2 text-dark-400 hover:text-white hover:bg-white/5 rounded-lg transition"
            title="Dashboard do Quadro"
          >
            <PieChart size={20} />
          </button>
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Create New Process</h2>
        <p className="text-sm text-white/60 mb-6">Enter a title for your new process</p>

        <form onSubmit={handleCreateProcess} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Process Title</label>
            <input
              type="text"
              value={newProcessTitle}
              onChange={(e) => setNewProcessTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400/60 transition-colors"
              placeholder="e.g., Employee Onboarding"
              required
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false)
                setNewProcessTitle('')
              }}
              className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-90 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Process'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  if (!selectedProcess) {
    return (
      <>
        <div className="p-10 h-full overflow-y-auto text-white">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/')}
              className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full transition-colors shadow-lg shadow-black/40"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70 mb-1">Fluxos ativos</p>
              <h1 className="text-3xl font-bold text-white">{board?.name || 'Carregando...'}</h1>
              <p className="text-dark-300 text-sm">Selecione um processo para editar ou crie um novo fluxo.</p>
            </div>
            <div className="ml-auto flex gap-3">
              <button
                onClick={() => setShowAnalytics(true)}
                className="p-2 text-dark-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                title="Análise do Processo"
              >
                <BarChart2 size={20} />
              </button>
              <button
                onClick={() => setShowKnowledgePanel(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition"
              >
                <BookOpen size={20} />
                <span>Base de Conhecimento</span>
              </button>
              <button
                onClick={() => setShowHistoryPanel(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition"
              >
                <History size={20} />
                <span>Histórico</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white font-semibold shadow-lg shadow-blue-900/40 hover:opacity-90 transition"
              >
                <Plus size={20} />
                <span>Novo processo</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processes.map((process) => (
              <div
                key={process.id}
                onClick={() => handleSelectProcess(process)}
                className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 hover:border-cyan-400/40 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.45)] group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/10 group-hover:bg-cyan-400/20 text-cyan-200 transition">
                    <FileText size={24} />
                  </div>
                  <span className="text-xs text-dark-400">
                    {new Date(process.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">{process.title}</h3>
                <p className="text-dark-200/70 text-sm line-clamp-2">
                  {process.description || 'Sem descrição definida ainda.'}
                </p>
              </div>
            ))}

            {processes.length === 0 && (
              <div className="col-span-full text-center py-20 text-dark-400 bg-white/5 rounded-2xl border border-dashed border-white/20">
                <p>Nenhum processo encontrado. Crie um novo para começar.</p>
              </div>
            )}
          </div>
        </div>
        {renderCreateModal}
        {board && (
          <BoardKnowledgePanel
            board={board}
            isOpen={showKnowledgePanel}
            onClose={() => setShowKnowledgePanel(false)}
            onUpdate={setBoard}
          />
        )}
      </>
    )
  }

  return (
    <div className="flex h-full text-white">
      {/* Left Column: Process Details + Chat (25%) */}
      <div className="w-[25%] min-w-[320px] border-r border-white/5 bg-white/5 backdrop-blur-xl flex flex-col">
        <div className="p-5 border-b border-white/5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedProcess(null)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10"
              title="Back to processes"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-300/70">Processo</p>
              <h2 className="font-semibold truncate text-lg">{selectedProcess.title}</h2>
            </div>
          </div>

          <form onSubmit={handleProcessDetailsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-dark-300 mb-2">
                Título do processo
              </label>
              <input
                type="text"
                value={processTitleInput}
                onChange={(e) => setProcessTitleInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400/60 transition"
                required
                placeholder="Nome visível do processo"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-dark-300 mb-2">
                Descrição
              </label>
              <textarea
                value={processDescriptionInput}
                onChange={(e) => setProcessDescriptionInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400/60 resize-none h-24 transition"
                placeholder="Contexto geral e objetivos"
              />
            </div>
            <div className="flex justify-between items-center gap-3">
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400/60"
              >
                <option value="" disabled>
                  Selecione o agente AI
                </option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.provider})
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={!hasDetailsChanged || detailsSaving}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-cyan-500/40 bg-gradient-to-r from-cyan-500/70 to-blue-600/70 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {detailsSaving ? 'Salvando...' : 'Salvar detalhes'}
              </button>
            </div>
          </form>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/10 ${msg.role === 'user' ? 'bg-white/10' : 'bg-gradient-to-br from-emerald-400/10 to-cyan-400/10'
                    }`}
                >
                  {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                </div>
                <div
                  className={`p-3 rounded-2xl text-sm max-w-[80%] border border-white/10 ${msg.role === 'user'
                    ? 'bg-white/5 text-white'
                    : 'bg-gradient-to-br from-indigo-950/80 to-slate-900/80 text-dark-200'
                    }`}
                >
                  {typeof msg.content === 'string' ? (
                    msg.content
                  ) : (
                    <div className="flex flex-col gap-2">
                      {msg.content.map((part, i) => {
                        if (part.type === 'text') return <span key={i}>{part.text}</span>
                        if (part.type === 'image_url')
                          return (
                            <img
                              key={i}
                              src={part.image_url.url}
                              alt="Uploaded"
                              className="max-w-full rounded-lg border border-dark-600"
                            />
                          )
                        return null
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-2xl bg-green-600/30 border border-green-400/40 flex items-center justify-center flex-shrink-0">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-3 rounded-2xl text-sm bg-white/5 text-dark-200 border border-white/10">
                  Pensando...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-5 border-t border-white/5">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder={
                    agents.length === 0 ? 'Configure um agente nas Configurações' : 'Descreva o processo...'
                  }
                  disabled={agents.length === 0 || isGenerating}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-3 pr-12 py-2 text-sm text-white focus:outline-none focus:border-cyan-400/60 disabled:opacity-50"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 text-white/50">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'image')}
                  />
                  <input
                    type="file"
                    ref={audioInputRef}
                    className="hidden"
                    accept="audio/*"
                    onChange={(e) => handleFileSelect(e, 'audio')}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-1 hover:text-white ${attachedImage ? 'text-green-400' : ''}`}
                    title="Upload de imagem"
                  >
                    <ImageIcon size={16} />
                  </button>
                  <button
                    onClick={() => audioInputRef.current?.click()}
                    className={`p-1 hover:text-white ${attachedAudio ? 'text-green-400' : ''}`}
                    title="Áudio"
                  >
                    <Mic size={16} />
                  </button>
                </div>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={
                  (!inputMessage.trim() && !attachedAudio) || agents.length === 0 || isGenerating
                }
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-sm font-semibold shadow-lg shadow-blue-900/40 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
            {(attachedImage || attachedAudio) && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {attachedImage && (
                  <div className="text-xs bg-white/5 px-2 py-1 rounded-full flex items-center gap-1 text-dark-200 border border-white/10">
                    <ImageIcon size={12} />
                    <span className="truncate max-w-[100px]">{attachedImage.name}</span>
                    <button onClick={() => setAttachedImage(null)} className="hover:text-white">
                      ×
                    </button>
                  </div>
                )}
                {attachedAudio && (
                  <div className="text-xs bg-white/5 px-2 py-1 rounded-full flex items-center gap-1 text-dark-200 border border-white/10">
                    <Mic size={12} />
                    <span className="truncate max-w-[100px]">{attachedAudio.name}</span>
                    <button onClick={() => setAttachedAudio(null)} className="hover:text-white">
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center Column: BPMN Modeler (50%) */}
      <div className="w-[50%] bg-white relative flex flex-col">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg shadow-lg hover:bg-gray-700 transition-colors border border-gray-700"
            >
              <Download size={16} />
              Exportar
              <ChevronDown size={14} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                <button
                  onClick={() => {
                    if (modeler) downloadXML(modeler, selectedProcess.title)
                    setShowExportMenu(false)
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-gray-700 transition-colors"
                >
                  Exportar BPMN (XML)
                </button>
                <button
                  onClick={() => {
                    if (modeler) downloadSVG(modeler, selectedProcess.title)
                    setShowExportMenu(false)
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-gray-700 transition-colors border-t border-gray-700"
                >
                  Exportar Imagem (SVG)
                </button>
                <button
                  onClick={() => {
                    if (modeler)
                      generatePDF(modeler, selectedProcess.title, selectedProcess.description)
                    setShowExportMenu(false)
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-gray-700 transition-colors border-t border-gray-700"
                >
                  Exportar Documento (PDF)
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg shadow-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            Salvar
          </button>
        </div>
        <div className="flex-1">
          <BPMNModeler
            xml={xml}
            onModelerInit={setModeler}
            onElementClick={setSelectedElement}
            onChange={() => {
              // Optional: Auto-save logic could go here
            }}
          />
        </div>
      </div>

      {/* Right Column: Activity Details (25%) */}
      <div className="w-[25%] min-w-[320px] border-l border-white/5 bg-white/5 backdrop-blur-xl flex flex-col">
        <PropertiesPanel modeler={modeler} element={selectedElement} />
      </div>
      {renderCreateModal}
      {board && (
        <BoardKnowledgePanel
          board={board}
          isOpen={showKnowledgePanel}
          onClose={() => setShowKnowledgePanel(false)}
          onUpdate={setBoard}
        />
      )}

      {selectedProcess && (
        <VersionHistoryPanel
          processId={selectedProcess.id}
          isOpen={showHistoryPanel}
          onClose={() => setShowHistoryPanel(false)}
          onRestore={() => {
            // Refresh process logic if needed, or just reload page/xml
            // For now, we might need to re-fetch the process or just let the user see the updated XML if we updated state
            fetchProcesses() // Reload list to update version number
          }}
          onCompare={setCompareVersion}
        />
      )}

      {compareVersion && (
        <ProcessDiffViewer
          currentXml={xml}
          compareVersion={compareVersion}
          onClose={() => setCompareVersion(null)}
        />
      )}

      {selectedProcess && (
        <ProcessAnalytics
          isOpen={showAnalytics}
          onClose={() => setShowAnalytics(false)}
          xml={xml}
          processTitle={selectedProcess.title}
        />
      )}

      {board && (
        <BoardAnalytics
          isOpen={showBoardAnalytics}
          onClose={() => setShowBoardAnalytics(false)}
          processes={processes}
          boardName={board.name}
        />
      )}
    </div>
  )
}
