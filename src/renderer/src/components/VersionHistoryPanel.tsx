import React, { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { History, RotateCcw, GitCompare, X, CheckCircle, XCircle } from 'lucide-react'
import { ProcessVersion } from '../types/versioning'
import { getVersions, restoreVersion, getBoardVersions, updateVersionStatus } from '../lib/version-service'

interface VersionHistoryPanelProps {
    processId?: string
    boardId?: string
    isOpen: boolean
    onClose: () => void
    onRestore: (version: ProcessVersion) => void
    onCompare: (version: ProcessVersion) => void
}

export default function VersionHistoryPanel({
    processId,
    boardId,
    isOpen,
    onClose,
    onRestore,
    onCompare
}: VersionHistoryPanelProps): React.ReactElement | null {
    const [versions, setVersions] = useState<ProcessVersion[]>([])
    const [loading, setLoading] = useState(false)
    const [restoringId, setRestoringId] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            loadVersions()
        }
    }, [isOpen, processId, boardId])

    const loadVersions = async (): Promise<void> => {
        setLoading(true)
        try {
            let data: ProcessVersion[] = []
            if (processId) {
                data = await getVersions(processId)
            } else if (boardId) {
                data = await getBoardVersions(boardId)
            }
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
            await restoreVersion(version.process_id, version)
            onRestore(version) // Trigger refresh in parent
            onClose()
        } catch (error) {
            console.error('Failed to restore version', error)
            alert('Erro ao restaurar versão')
        } finally {
            setRestoringId(null)
        }
    }

    const handleStatusChange = async (version: ProcessVersion, status: 'approved' | 'rejected') => {
        try {
            await updateVersionStatus(version.id, status)
            // Optimistic update
            setVersions(versions.map(v => v.id === version.id ? { ...v, status } : v))
        } catch (error) {
            console.error('Failed to update status', error)
            alert('Erro ao atualizar status')
        }
    }

    if (!isOpen) return null

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 w-96 bg-dark-900 border-l border-white/10 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="text-cyan-400" size={20} />
                        <h2 className="font-semibold text-white">
                            {processId ? 'Histórico da Versão' : 'Atividades Recentes'}
                        </h2>
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
                        versions.map((version) => (
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

                                {!processId && (version as any).process && (
                                    <div className="mb-2">
                                        <span className="text-xs text-cyan-300 bg-cyan-950/30 px-2 py-1 rounded border border-cyan-500/20">
                                            {(version as any).process.title}
                                        </span>
                                    </div>
                                )}

                                {version.thumbnail_svg && (
                                    <div className="mb-3 rounded-lg overflow-hidden border border-white/10 bg-white/5 p-2">
                                        <img
                                            src={`data:image/svg+xml;utf8,${encodeURIComponent(version.thumbnail_svg)}`}
                                            alt={`Thumbnail v${version.version_number}`}
                                            className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity"
                                        />
                                    </div>
                                )}

                                {version.comment && (
                                    <p className="text-sm text-dark-300 mb-3 italic border-l-2 border-white/10 pl-2">
                                        "{version.comment}"
                                    </p>
                                )}

                                <div className="flex flex-col gap-2 mt-2">
                                    <div className="flex gap-2">
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

                                    {/* Approval Actions */}
                                    <div className="flex gap-2 border-t border-white/5 pt-2">
                                        <button
                                            onClick={() => handleStatusChange(version, 'approved')}
                                            disabled={version.status === 'approved'}
                                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs transition ${version.status === 'approved'
                                                    ? 'bg-green-500/20 text-green-300 cursor-default'
                                                    : 'bg-white/5 hover:bg-green-500/20 hover:text-green-300 text-dark-300'
                                                }`}
                                        >
                                            <CheckCircle size={14} />
                                            Aprovar
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange(version, 'rejected')}
                                            disabled={version.status === 'rejected'}
                                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs transition ${version.status === 'rejected'
                                                    ? 'bg-red-500/20 text-red-300 cursor-default'
                                                    : 'bg-white/5 hover:bg-red-500/20 hover:text-red-300 text-dark-300'
                                                }`}
                                        >
                                            <XCircle size={14} />
                                            Rejeitar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    )
}
