import React, { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { History, RotateCcw, GitCompare, Check, X } from 'lucide-react'
import { ProcessVersion } from '../types/versioning'
import { getVersions, restoreVersion } from '../lib/version-service'

interface VersionHistoryPanelProps {
    processId: string
    isOpen: boolean
    onClose: () => void
    onRestore: () => void
    onCompare: (version: ProcessVersion) => void
}

export default function VersionHistoryPanel({
    processId,
    isOpen,
    onClose,
    onRestore,
    onCompare
}: VersionHistoryPanelProps): React.ReactElement | null {
    const [versions, setVersions] = useState<ProcessVersion[]>([])
    const [loading, setLoading] = useState(false)
    const [restoringId, setRestoringId] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen && processId) {
            loadVersions()
        }
    }, [isOpen, processId])

    const loadVersions = async (): Promise<void> => {
        setLoading(true)
        try {
            const data = await getVersions(processId)
            setVersions(data)
        } catch (error) {
            console.error('Failed to load versions', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRestore = async (version: ProcessVersion): Promise<void> => {
        if (!confirm(`Tem certeza que deseja restaurar a versão ${version.version_number}?`)) return

        setRestoringId(version.id)
        try {
            await restoreVersion(processId, version)
            onRestore() // Trigger refresh in parent
            onClose()
        } catch (error) {
            console.error('Failed to restore version', error)
            alert('Erro ao restaurar versão')
        } finally {
            setRestoringId(null)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-dark-100 border-l border-white/10 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <History className="text-cyan-400" size={20} />
                    <h2 className="font-semibold text-white">Histórico de Versões</h2>
                </div>
                <button onClick={onClose} className="text-dark-400 hover:text-white transition">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center text-dark-400 py-8">Carregando histórico...</div>
                ) : versions.length === 0 ? (
                    <div className="text-center text-dark-400 py-8">Nenhuma versão anterior encontrada.</div>
                ) : (
                    versions.map((version, index) => (
                        <div
                            key={version.id}
                            className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition group"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-cyan-500/20 text-cyan-300 text-xs px-2 py-0.5 rounded-full font-mono">
                                            v{version.version_number}
                                        </span>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full border ${version.status === 'approved'
                                                    ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                                    : version.status === 'rejected'
                                                        ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                                        : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                                }`}
                                        >
                                            {version.status === 'approved'
                                                ? 'Aprovado'
                                                : version.status === 'rejected'
                                                    ? 'Rejeitado'
                                                    : 'Rascunho'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-dark-400 mt-1">
                                        {formatDistanceToNow(new Date(version.created_at), {
                                            addSuffix: true,
                                            locale: ptBR
                                        })}
                                    </p>
                                    <p className="text-xs text-dark-500">
                                        por {version.created_by_user?.full_name || 'Usuário desconhecido'}
                                    </p>
                                </div>
                            </div>

                            {version.comment && (
                                <p className="text-sm text-dark-300 mb-3 italic border-l-2 border-white/10 pl-2">
                                    "{version.comment}"
                                </p>
                            )}

                            <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleRestore(version)}
                                    disabled={restoringId === version.id}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs text-white transition disabled:opacity-50"
                                >
                                    {restoringId === version.id ? (
                                        <span className="animate-spin">⌛</span>
                                    ) : (
                                        <RotateCcw size={14} />
                                    )}
                                    Restaurar
                                </button>
                                <button
                                    onClick={() => onCompare(version)}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs text-white transition"
                                >
                                    <GitCompare size={14} />
                                    Comparar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
