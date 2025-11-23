import React, { useMemo } from 'react'
import { X, Activity, GitMerge, Clock, Zap } from 'lucide-react'
import { calculateProcessMetrics } from '../lib/analytics-service'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts'

import { Process } from '../types/process'

interface ProcessAnalyticsProps {
    isOpen: boolean
    onClose: () => void
    process: Process | null
}

export default function ProcessAnalytics({
    isOpen,
    onClose,
    process
}: ProcessAnalyticsProps): React.ReactElement | null {
    const metrics = useMemo(() => calculateProcessMetrics(process?.bpmn_xml || ''), [process?.bpmn_xml])

    if (!isOpen || !process) return null

    const chartData = [
        { name: 'Tarefas', value: metrics.tasks, color: '#38bdf8' },
        { name: 'Decisões', value: metrics.gateways, color: '#fbbf24' },
        { name: 'Eventos', value: metrics.events, color: '#a78bfa' }
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-3xl bg-dark-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-xl font-bold text-white">Análise do Processo</h2>
                        <p className="text-sm text-white/50">{process.title}</p>
                    </div>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 text-cyan-400 mb-2">
                                <Activity size={18} />
                                <span className="text-xs font-medium uppercase tracking-wider">Elementos</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{metrics.totalElements}</p>
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 text-purple-400 mb-2">
                                <Zap size={18} />
                                <span className="text-xs font-medium uppercase tracking-wider">Complexidade</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{metrics.complexityScore}</p>
                            <p className="text-xs text-white/40 mt-1">Pontuação CNC</p>
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 text-yellow-400 mb-2">
                                <GitMerge size={18} />
                                <span className="text-xs font-medium uppercase tracking-wider">Decisões</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{metrics.gateways}</p>
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 text-green-400 mb-2">
                                <Clock size={18} />
                                <span className="text-xs font-medium uppercase tracking-wider">Duração Est.</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{metrics.estimatedDurationHours}h</p>
                            <p className="text-xs text-white/40 mt-1">Baseado em atividades</p>
                        </div>
                    </div>

                    {/* Chart & Info */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 h-48">
                            <h3 className="text-sm font-medium text-white mb-4">Distribuição de Elementos</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="rgba(255,255,255,0.5)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="rgba(255,255,255,0.5)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1d2d', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Last Modified Info */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex-1 flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-white/50">Última modificação</span>
                                <span className="text-xs text-white">{new Date(process.updated_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/50">Criado por</span>
                                <span className="text-xs text-white truncate max-w-[150px]">{process.created_by}</span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                                <span className="text-xs text-white/50">Status</span>
                                <span className={`text-xs px-2 py-1 rounded ${process.status === 'published' ? 'bg-green-500/20 text-green-400' :
                                        process.status === 'pending_review' ? 'bg-cyan-500/20 text-cyan-400' :
                                            'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                    {process.status === 'published' ? 'Publicado' :
                                        process.status === 'pending_review' ? 'Em Revisão' : 'Rascunho'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
