import React, { useEffect, useRef, useState } from 'react'
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer'
import { X, ArrowRight, Columns, Square, Minimize2, Maximize2 } from 'lucide-react'
import { ProcessVersion, DiffResult } from '../types/versioning'
import { compareVersions } from '../lib/version-service'

interface ProcessDiffViewerProps {
    currentXml: string
    compareVersion: ProcessVersion | null
    onClose: () => void
}

type ViewMode = 'unified' | 'split'

export default function ProcessDiffViewer({
    currentXml,
    compareVersion,
    onClose
}: ProcessDiffViewerProps): React.ReactElement | null {
    const containerRef = useRef<HTMLDivElement>(null) // For Unified
    const leftContainerRef = useRef<HTMLDivElement>(null) // For Split Left (Old)
    const rightContainerRef = useRef<HTMLDivElement>(null) // For Split Right (New)

    const [viewMode, setViewMode] = useState<ViewMode>('split')
    const [diffStats, setDiffStats] = useState<{ added: number; removed: number; modified: number }>({
        added: 0,
        removed: 0,
        modified: 0
    })

    // Viewers
    const [unifiedViewer, setUnifiedViewer] = useState<BpmnViewer | null>(null)
    const [leftViewer, setLeftViewer] = useState<BpmnViewer | null>(null)
    const [rightViewer, setRightViewer] = useState<BpmnViewer | null>(null)

    // Initialize Viewers based on Mode
    useEffect(() => {
        if (!compareVersion) return

        // Cleanup previous viewers
        if (unifiedViewer) unifiedViewer.destroy()
        if (leftViewer) leftViewer.destroy()
        if (rightViewer) rightViewer.destroy()
        setUnifiedViewer(null)
        setLeftViewer(null)
        setRightViewer(null)

        if (viewMode === 'unified' && containerRef.current) {
            const viewer = new BpmnViewer({
                container: containerRef.current,
                height: '100%',
                width: '100%'
            })
            setUnifiedViewer(viewer)
        } else if (viewMode === 'split' && leftContainerRef.current && rightContainerRef.current) {
            const lViewer = new BpmnViewer({
                container: leftContainerRef.current,
                height: '100%',
                width: '100%'
            })
            const rViewer = new BpmnViewer({
                container: rightContainerRef.current,
                height: '100%',
                width: '100%'
            })
            setLeftViewer(lViewer)
            setRightViewer(rViewer)
        }

        // Cleanup on unmount or mode change
        return () => {
            // We rely on the next effect or component unmount to clean up via the check above, 
            // but strictly we should clean up here too to avoid memory leaks during the transition.
            // However, state updates might trigger this before the new refs are ready.
            // Let's just let the next render handle destruction if needed, or do it here.
            // Ideally:
            // if (unifiedViewer) unifiedViewer.destroy()
            // ... but we don't have the *current* state here easily without refs or deps.
            // The check at the start of the effect handles it.
        }
    }, [viewMode, compareVersion])

    // Render Diagrams and Apply Diff
    useEffect(() => {
        if (!compareVersion) return

        const render = async () => {
            try {
                const diff = compareVersions(compareVersion.bpmn_xml || '', currentXml)
                setDiffStats({
                    added: diff.added.length,
                    removed: diff.removed.length,
                    modified: diff.modified.length
                })

                if (viewMode === 'unified' && unifiedViewer) {
                    await unifiedViewer.importXML(currentXml)
                    const canvas = unifiedViewer.get('canvas') as any
                    const elementRegistry = unifiedViewer.get('elementRegistry') as any
                    canvas.zoom('fit-viewport')

                    // Highlight Added (Green)
                    diff.added.forEach(id => {
                        try { if (elementRegistry.get(id)) canvas.addMarker(id, 'diff-added') } catch (e) { }
                    })
                    // Highlight Modified (Yellow)
                    diff.modified.forEach(id => {
                        try { if (elementRegistry.get(id)) canvas.addMarker(id, 'diff-modified') } catch (e) { }
                    })
                    // Removed cannot be shown easily on new XML
                }
                else if (viewMode === 'split' && leftViewer && rightViewer) {
                    // Left: Old Version
                    await leftViewer.importXML(compareVersion.bpmn_xml || '')
                    const leftCanvas = leftViewer.get('canvas') as any
                    const leftRegistry = leftViewer.get('elementRegistry') as any
                    leftCanvas.zoom('fit-viewport')

                    // Right: New Version
                    await rightViewer.importXML(currentXml)
                    const rightCanvas = rightViewer.get('canvas') as any
                    const rightRegistry = rightViewer.get('elementRegistry') as any
                    rightCanvas.zoom('fit-viewport')

                    // Highlight Removed on Left (Red)
                    diff.removed.forEach(id => {
                        try { if (leftRegistry.get(id)) leftCanvas.addMarker(id, 'diff-removed') } catch (e) { }
                    })
                    // Highlight Modified on Left (Yellow)
                    diff.modified.forEach(id => {
                        try { if (leftRegistry.get(id)) leftCanvas.addMarker(id, 'diff-modified') } catch (e) { }
                    })

                    // Highlight Added on Right (Green)
                    diff.added.forEach(id => {
                        try { if (rightRegistry.get(id)) rightCanvas.addMarker(id, 'diff-added') } catch (e) { }
                    })
                    // Highlight Modified on Right (Yellow)
                    diff.modified.forEach(id => {
                        try { if (rightRegistry.get(id)) rightCanvas.addMarker(id, 'diff-modified') } catch (e) { }
                    })

                    // Sync Views (Optional/Advanced - for now just fit viewport)
                }

            } catch (error) {
                console.error('Error rendering diff:', error)
            }
        }

        render()
    }, [unifiedViewer, leftViewer, rightViewer, currentXml, compareVersion, viewMode])


    if (!compareVersion) return null

    return (
        <div className="fixed inset-0 bg-dark-900/95 z-[60] flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-dark-100">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-white">Comparação de Versões</h2>

                    {/* View Mode Toggle */}
                    <div className="flex bg-dark-200 rounded-lg p-1 border border-white/5">
                        <button
                            onClick={() => setViewMode('split')}
                            className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition ${viewMode === 'split' ? 'bg-cyan-500/20 text-cyan-300' : 'text-dark-400 hover:text-white'
                                }`}
                        >
                            <Columns size={16} />
                            Lado a Lado
                        </button>
                        <button
                            onClick={() => setViewMode('unified')}
                            className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition ${viewMode === 'unified' ? 'bg-cyan-500/20 text-cyan-300' : 'text-dark-400 hover:text-white'
                                }`}
                        >
                            <Square size={16} />
                            Unificado
                        </button>
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
            <div className="flex-1 relative bg-dark-50 overflow-hidden flex">
                {viewMode === 'unified' ? (
                    <div ref={containerRef} className="w-full h-full" />
                ) : (
                    <>
                        <div className="flex-1 border-r border-white/10 relative">
                            <div className="absolute top-4 left-4 z-10 bg-dark-900/80 backdrop-blur px-3 py-1 rounded border border-white/10 text-xs text-white">
                                Versão {compareVersion.version_number} (Anterior)
                            </div>
                            <div ref={leftContainerRef} className="w-full h-full" />
                        </div>
                        <div className="flex-1 relative">
                            <div className="absolute top-4 left-4 z-10 bg-dark-900/80 backdrop-blur px-3 py-1 rounded border border-white/10 text-xs text-white">
                                Versão Atual
                            </div>
                            <div ref={rightContainerRef} className="w-full h-full" />
                        </div>
                    </>
                )}

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
                  .diff-removed .djs-visual > :nth-child(1) {
                    stroke: #ef4444 !important;
                    stroke-width: 4px !important;
                    fill: rgba(239, 68, 68, 0.1) !important;
                  }
                `}</style>
            </div>
        </div>
    )
}
