import React, { useEffect, useRef, useState } from 'react'
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer'
import { X, ArrowRight, ZoomIn, ZoomOut } from 'lucide-react'
import { ProcessVersion, DiffResult } from '../types/versioning'
import { compareVersions } from '../lib/version-service'

interface ProcessDiffViewerProps {
    currentXml: string
    compareVersion: ProcessVersion | null
    onClose: () => void
}

export default function ProcessDiffViewer({
    currentXml,
    compareVersion,
    onClose
}: ProcessDiffViewerProps): React.ReactElement | null {
    const containerRef = useRef<HTMLDivElement>(null)
    const [viewer, setViewer] = useState<BpmnViewer | null>(null)
    const [diffStats, setDiffStats] = useState<{ added: number; removed: number; modified: number }>({
        added: 0,
        removed: 0,
        modified: 0
    })

    useEffect(() => {
        if (!compareVersion || !containerRef.current) return

        const bpmnViewer = new BpmnViewer({
            container: containerRef.current,
            height: '100%',
            width: '100%'
        })

        setViewer(bpmnViewer)

        return () => {
            bpmnViewer.destroy()
        }
    }, [compareVersion])

    useEffect(() => {
        if (!viewer || !compareVersion) return

        const renderDiff = async (): Promise<void> => {
            try {
                // We display the CURRENT XML, but highlight changes relative to the OLD version
                // Ideally, a diff view might show side-by-side or a merged view.
                // For simplicity and effectiveness, we show the Current Version and highlight:
                // - Green: Added since old version
                // - Yellow: Modified since old version
                // - Red: Removed (This is tricky to show on the new diagram. We might need a side-by-side or just list them)

                // Better approach for single view: Show the NEW diagram.
                // - Elements present in NEW but not OLD -> Added (Green)
                // - Elements present in BOTH but changed -> Modified (Yellow)
                // - Elements present in OLD but not NEW -> Removed (Cannot show easily on NEW diagram without ghosting)

                await viewer.importXML(currentXml)

                const canvas = viewer.get('canvas') as any
                const overlays = viewer.get('overlays') as any
                const elementRegistry = viewer.get('elementRegistry') as any

                canvas.zoom('fit-viewport')

                const diff = compareVersions(compareVersion.bpmn_xml || '', currentXml)
                setDiffStats({
                    added: diff.added.length,
                    removed: diff.removed.length,
                    modified: diff.modified.length
                })

                // Apply highlighting
                // We need to inject CSS for these markers

                // Highlight Added
                diff.added.forEach(id => {
                    try {
                        const element = elementRegistry.get(id)
                        if (element) {
                            canvas.addMarker(id, 'diff-added')
                        }
                    } catch (e) {
                        // Element might not be visible or exist in view
                    }
                })

                // Highlight Modified
                diff.modified.forEach(id => {
                    try {
                        const element = elementRegistry.get(id)
                        if (element) {
                            canvas.addMarker(id, 'diff-modified')
                        }
                    } catch (e) { }
                })

                // For removed elements, we can't easily show them on the current diagram.
                // We could list them in a sidebar.

            } catch (error) {
                console.error('Error rendering diff:', error)
            }
        }

        renderDiff()
    }, [viewer, currentXml, compareVersion])

    if (!compareVersion) return null

    return (
        <div className="fixed inset-0 bg-dark-900/95 z-[60] flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-dark-100">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-white">Comparação de Versões</h2>
                    <div className="flex items-center gap-3 bg-dark-200 px-4 py-2 rounded-full border border-white/5">
                        <div className="flex items-center gap-2">
                            <span className="text-dark-400 text-sm">Versão {compareVersion.version_number}</span>
                            <span className="text-xs text-dark-500">(Anterior)</span>
                        </div>
                        <ArrowRight className="text-dark-500" size={16} />
                        <div className="flex items-center gap-2">
                            <span className="text-cyan-400 text-sm font-semibold">Versão Atual</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-dark-300">Adicionado ({diffStats.added})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="text-dark-300">Modificado ({diffStats.modified})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-dark-300">Removido ({diffStats.removed})</span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full text-white transition"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 relative bg-dark-50 overflow-hidden">
                <div ref={containerRef} className="w-full h-full" />

                <style>{`
          .diff-added .djs-visual > :nth-child(1) {
            stroke: #22c55e !important;
            stroke-width: 4px !important;
            fill: rgba(34, 197, 94, 0.1) !important;
          }
          .diff-modified .djs-visual > :nth-child(1) {
            stroke: #eab308 !important;
            stroke-width: 4px !important;
            fill: rgba(234, 179, 8, 0.1) !important;
          }
        `}</style>
            </div>
        </div>
    )
}
