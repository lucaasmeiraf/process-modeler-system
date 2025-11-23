import { useState, useEffect } from 'react'
import { Board, GlossaryTerm, SystemItem, LegislationItem, OrgItem } from '../types/board'
import { updateBoardKnowledgeBase } from '../lib/board-service'
import { X, Save, Plus, Trash2, Book, Database, Scale, Users, FileText, Loader2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

type Tab = 'context' | 'glossary' | 'systems' | 'legislation' | 'org'

interface BoardKnowledgePanelProps {
    board: Board
    isOpen: boolean
    onClose: () => void
    onUpdate: (updatedBoard: Board) => void
}

export default function BoardKnowledgePanel({
    board,
    isOpen,
    onClose,
    onUpdate
}: BoardKnowledgePanelProps) {
    const [activeTab, setActiveTab] = useState<Tab>('context')
    const [saving, setSaving] = useState(false)

    // Local state for editing
    const [context, setContext] = useState(board.context_md || '')
    const [glossary, setGlossary] = useState<GlossaryTerm[]>(board.glossary || [])
    const [systems, setSystems] = useState<SystemItem[]>(board.integrated_systems || [])
    const [legislation, setLegislation] = useState<LegislationItem[]>(board.legislation || [])
    const [orgStructure, setOrgStructure] = useState<OrgItem[]>(board.org_structure || [])

    useEffect(() => {
        if (isOpen) {
            setContext(board.context_md || '')
            setGlossary(board.glossary || [])
            setSystems(board.integrated_systems || [])
            setLegislation(board.legislation || [])
            setOrgStructure(board.org_structure || [])
        }
    }, [isOpen, board])

    const handleSave = async () => {
        setSaving(true)
        try {
            const updated = await updateBoardKnowledgeBase(board.id, {
                context_md: context,
                glossary,
                integrated_systems: systems,
                legislation,
                org_structure: orgStructure
            })
            if (updated) {
                onUpdate(updated)
                onClose()
            }
        } catch (error) {
            alert('Failed to save knowledge base')
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0b101b] w-full max-w-5xl h-[85vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#070b13]">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Base de Conhecimento</h2>
                        <p className="text-white/50 text-sm">Gerencie o contexto e informações do setor {board.name}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-64 bg-[#05080f] border-r border-white/5 p-4 space-y-2">
                        <TabButton
                            active={activeTab === 'context'}
                            onClick={() => setActiveTab('context')}
                            icon={<FileText size={18} />}
                            label="Contexto Geral"
                        />
                        <TabButton
                            active={activeTab === 'glossary'}
                            onClick={() => setActiveTab('glossary')}
                            icon={<Book size={18} />}
                            label="Glossário"
                        />
                        <TabButton
                            active={activeTab === 'systems'}
                            onClick={() => setActiveTab('systems')}
                            icon={<Database size={18} />}
                            label="Sistemas Integrados"
                        />
                        <TabButton
                            active={activeTab === 'legislation'}
                            onClick={() => setActiveTab('legislation')}
                            icon={<Scale size={18} />}
                            label="Legislação"
                        />
                        <TabButton
                            active={activeTab === 'org'}
                            onClick={() => setActiveTab('org')}
                            icon={<Users size={18} />}
                            label="Estrutura Org."
                        />
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 bg-[#0b101b]">
                        {activeTab === 'context' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Contexto do Setor (Markdown)</h3>
                                <textarea
                                    value={context}
                                    onChange={(e) => setContext(e.target.value)}
                                    className="w-full h-[500px] bg-white/5 border border-white/10 rounded-xl p-4 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50 resize-none"
                                    placeholder="# Visão Geral do Setor..."
                                />
                            </div>
                        )}

                        {activeTab === 'glossary' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-white">Glossário de Termos</h3>
                                    <button
                                        onClick={() => setGlossary([...glossary, { id: uuidv4(), term: '', definition: '' }])}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition text-sm font-medium"
                                    >
                                        <Plus size={16} /> Adicionar Termo
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {glossary.map((item, idx) => (
                                        <div key={item.id} className="flex gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    value={item.term}
                                                    onChange={(e) => {
                                                        const newGlossary = [...glossary]
                                                        newGlossary[idx].term = e.target.value
                                                        setGlossary(newGlossary)
                                                    }}
                                                    placeholder="Termo"
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500/50 focus:outline-none"
                                                />
                                                <textarea
                                                    value={item.definition}
                                                    onChange={(e) => {
                                                        const newGlossary = [...glossary]
                                                        newGlossary[idx].definition = e.target.value
                                                        setGlossary(newGlossary)
                                                    }}
                                                    placeholder="Definição"
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white/70 text-sm focus:border-cyan-500/50 focus:outline-none resize-none h-20"
                                                />
                                            </div>
                                            <button
                                                onClick={() => setGlossary(glossary.filter((g) => g.id !== item.id))}
                                                className="text-red-400 hover:text-red-300 p-2 self-start"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                    {glossary.length === 0 && (
                                        <p className="text-white/30 text-center py-8 italic">Nenhum termo definido.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'systems' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-white">Sistemas Integrados</h3>
                                    <button
                                        onClick={() => setSystems([...systems, { id: uuidv4(), name: '', description: '', url: '' }])}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition text-sm font-medium"
                                    >
                                        <Plus size={16} /> Adicionar Sistema
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {systems.map((item, idx) => (
                                        <div key={item.id} className="flex gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex gap-2">
                                                    <input
                                                        value={item.name}
                                                        onChange={(e) => {
                                                            const newSystems = [...systems]
                                                            newSystems[idx].name = e.target.value
                                                            setSystems(newSystems)
                                                        }}
                                                        placeholder="Nome do Sistema"
                                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500/50 focus:outline-none"
                                                    />
                                                    <input
                                                        value={item.url || ''}
                                                        onChange={(e) => {
                                                            const newSystems = [...systems]
                                                            newSystems[idx].url = e.target.value
                                                            setSystems(newSystems)
                                                        }}
                                                        placeholder="URL (Opcional)"
                                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500/50 focus:outline-none"
                                                    />
                                                </div>
                                                <textarea
                                                    value={item.description}
                                                    onChange={(e) => {
                                                        const newSystems = [...systems]
                                                        newSystems[idx].description = e.target.value
                                                        setSystems(newSystems)
                                                    }}
                                                    placeholder="Descrição e uso no processo"
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white/70 text-sm focus:border-cyan-500/50 focus:outline-none resize-none h-20"
                                                />
                                            </div>
                                            <button
                                                onClick={() => setSystems(systems.filter((s) => s.id !== item.id))}
                                                className="text-red-400 hover:text-red-300 p-2 self-start"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                    {systems.length === 0 && (
                                        <p className="text-white/30 text-center py-8 italic">Nenhum sistema cadastrado.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'legislation' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-white">Legislação e Normas</h3>
                                    <button
                                        onClick={() => setLegislation([...legislation, { id: uuidv4(), title: '', description: '', link: '' }])}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition text-sm font-medium"
                                    >
                                        <Plus size={16} /> Adicionar Norma
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {legislation.map((item, idx) => (
                                        <div key={item.id} className="flex gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex gap-2">
                                                    <input
                                                        value={item.title}
                                                        onChange={(e) => {
                                                            const newLegislation = [...legislation]
                                                            newLegislation[idx].title = e.target.value
                                                            setLegislation(newLegislation)
                                                        }}
                                                        placeholder="Título da Norma/Lei"
                                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500/50 focus:outline-none"
                                                    />
                                                    <input
                                                        value={item.link || ''}
                                                        onChange={(e) => {
                                                            const newLegislation = [...legislation]
                                                            newLegislation[idx].link = e.target.value
                                                            setLegislation(newLegislation)
                                                        }}
                                                        placeholder="Link (Opcional)"
                                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500/50 focus:outline-none"
                                                    />
                                                </div>
                                                <textarea
                                                    value={item.description}
                                                    onChange={(e) => {
                                                        const newLegislation = [...legislation]
                                                        newLegislation[idx].description = e.target.value
                                                        setLegislation(newLegislation)
                                                    }}
                                                    placeholder="Resumo ou aplicação"
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white/70 text-sm focus:border-cyan-500/50 focus:outline-none resize-none h-20"
                                                />
                                            </div>
                                            <button
                                                onClick={() => setLegislation(legislation.filter((l) => l.id !== item.id))}
                                                className="text-red-400 hover:text-red-300 p-2 self-start"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                    {legislation.length === 0 && (
                                        <p className="text-white/30 text-center py-8 italic">Nenhuma legislação cadastrada.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'org' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-white">Estrutura Organizacional</h3>
                                    <button
                                        onClick={() => setOrgStructure([...orgStructure, { id: uuidv4(), role: '', name: '', contact: '', responsibilities: '' }])}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition text-sm font-medium"
                                    >
                                        <Plus size={16} /> Adicionar Cargo
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {orgStructure.map((item, idx) => (
                                        <div key={item.id} className="flex gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex gap-2">
                                                    <input
                                                        value={item.role}
                                                        onChange={(e) => {
                                                            const newOrg = [...orgStructure]
                                                            newOrg[idx].role = e.target.value
                                                            setOrgStructure(newOrg)
                                                        }}
                                                        placeholder="Cargo / Função"
                                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500/50 focus:outline-none"
                                                    />
                                                    <input
                                                        value={item.name}
                                                        onChange={(e) => {
                                                            const newOrg = [...orgStructure]
                                                            newOrg[idx].name = e.target.value
                                                            setOrgStructure(newOrg)
                                                        }}
                                                        placeholder="Nome do Responsável"
                                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500/50 focus:outline-none"
                                                    />
                                                </div>
                                                <input
                                                    value={item.contact || ''}
                                                    onChange={(e) => {
                                                        const newOrg = [...orgStructure]
                                                        newOrg[idx].contact = e.target.value
                                                        setOrgStructure(newOrg)
                                                    }}
                                                    placeholder="Contato (Email/Tel)"
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500/50 focus:outline-none"
                                                />
                                                <textarea
                                                    value={item.responsibilities || ''}
                                                    onChange={(e) => {
                                                        const newOrg = [...orgStructure]
                                                        newOrg[idx].responsibilities = e.target.value
                                                        setOrgStructure(newOrg)
                                                    }}
                                                    placeholder="Responsabilidades principais"
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white/70 text-sm focus:border-cyan-500/50 focus:outline-none resize-none h-20"
                                                />
                                            </div>
                                            <button
                                                onClick={() => setOrgStructure(orgStructure.filter((o) => o.id !== item.id))}
                                                className="text-red-400 hover:text-red-300 p-2 self-start"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                    {orgStructure.length === 0 && (
                                        <p className="text-white/30 text-center py-8 italic">Nenhuma estrutura definida.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-[#070b13] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-blue-900/20 hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    )
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active
                    ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
        >
            {icon}
            <span className="font-medium text-sm">{label}</span>
        </button>
    )
}
