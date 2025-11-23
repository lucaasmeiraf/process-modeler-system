import React, { useEffect, useState, useRef } from 'react'
import { Search, X, FileText, User, Building } from 'lucide-react'
import { searchProcesses, SearchResult } from '../lib/search-service'
import { useNavigate } from 'react-router-dom'

interface SearchModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps): React.ReactElement | null {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const navigate = useNavigate()

    const [filters, setFilters] = useState({
        status: '',
        tag: '',
        department: '',
        responsible_role: ''
    })

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen])

    useEffect(() => {
        const handleSearch = async () => {
            if (!query.trim() && !filters.status && !filters.tag && !filters.department && !filters.responsible_role) {
                setResults([])
                return
            }

            setIsLoading(true)
            try {
                const data = await searchProcesses(query, filters)
                setResults(data)
            } catch (error) {
                console.error('Search failed:', error)
            } finally {
                setIsLoading(false)
            }
        }

        const debounce = setTimeout(handleSearch, 300)
        return () => clearTimeout(debounce)
    }, [query, filters])

    if (!isOpen) return null

    const handleSelect = (processId: string) => {
        navigate(`/processes/${processId}`)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-2xl bg-dark-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col border-b border-white/10">
                    <div className="flex items-center gap-3 p-4">
                        <Search className="text-white/50" size={20} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar processos, tags, responsáveis..."
                            className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30 text-lg"
                        />
                        <button onClick={onClose} className="text-white/50 hover:text-white transition">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        >
                            <option value="">Todos Status</option>
                            <option value="draft">Rascunho</option>
                            <option value="published">Publicado</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Tag..."
                            value={filters.tag}
                            onChange={(e) => setFilters(prev => ({ ...prev, tag: e.target.value }))}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500/50 w-24"
                        />
                        <input
                            type="text"
                            placeholder="Departamento..."
                            value={filters.department}
                            onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500/50 w-28"
                        />
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {isLoading ? (
                        <div className="p-8 text-center text-white/30">Buscando...</div>
                    ) : results.length > 0 ? (
                        <div className="space-y-1">
                            {results.map(({ process, matchType, snippet }) => (
                                <button
                                    key={process.id}
                                    onClick={() => handleSelect(process.id)}
                                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition text-left group"
                                >
                                    <div className="mt-1 p-2 bg-cyan-500/10 rounded-lg text-cyan-400 group-hover:bg-cyan-500/20 transition">
                                        <FileText size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-white font-medium truncate">{process.title}</h4>
                                            {matchType === 'content' && (
                                                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                                                    Conteúdo
                                                </span>
                                            )}
                                        </div>

                                        {snippet ? (
                                            <p className="text-sm text-white/70 mt-1 line-clamp-2 italic border-l-2 border-white/10 pl-2">
                                                "{snippet}"
                                            </p>
                                        ) : (
                                            <p className="text-sm text-white/50 truncate">{process.description || 'Sem descrição'}</p>
                                        )}

                                        <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                                            {process.status && (
                                                <span className={`px-1.5 py-0.5 rounded border ${process.status === 'published'
                                                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                                    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                    {process.status === 'published' ? 'Publicado' : 'Rascunho'}
                                                </span>
                                            )}
                                            {process.responsible_role && (
                                                <span className="flex items-center gap-1">
                                                    <User size={10} /> {process.responsible_role}
                                                </span>
                                            )}
                                            {process.department && (
                                                <span className="flex items-center gap-1">
                                                    <Building size={10} /> {process.department}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (query || filters.status || filters.tag || filters.department) ? (
                        <div className="p-8 text-center text-white/30">Nenhum resultado encontrado.</div>
                    ) : (
                        <div className="p-8 text-center text-white/30">
                            Digite para buscar em todos os processos.
                        </div>
                    )}
                </div>

                <div className="p-2 bg-white/5 border-t border-white/10 text-[10px] text-white/30 flex justify-between px-4">
                    <span>Procurar por <strong>título</strong>, <strong>descrição</strong>, <strong>conteúdo BPMN</strong></span>
                    <span>ESC para fechar</span>
                </div>
            </div>
        </div>
    )
}
