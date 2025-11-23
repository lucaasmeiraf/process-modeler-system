import React, { useMemo } from 'react'
import { X, PieChart as PieChartIcon, Clock, Zap, FileText } from 'lucide-react'
import { getBoardAnalytics } from '../lib/analytics-service'
import { Process } from '../types/process'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts'

interface BoardAnalyticsProps {
    isOpen: boolean
    onClose: () => void
    processes: Process[]
    boardName: string
}

export default function BoardAnalytics({
    isOpen,
    onClose,
    processes,
    boardName
}: BoardAnalyticsProps): React.ReactElement | null {
    const analytics = useMemo(() => getBoardAnalytics(processes), [processes])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-4xl bg-dark-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-xl font-bold text-white">Dashboard do Quadro</h2>
                        <p className="text-sm text-white/50">{boardName}</p>
                    </div>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Stats Cards */}
                    <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 text-cyan-400 mb-2">
                                <FileText size={18} />
                                <span className="text-xs font-medium uppercase tracking-wider">Total de Processos</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{analytics.totalProcesses}</p>
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 text-purple-400 mb-2">
                                <Zap size={18} />
                                <span className="text-xs font-medium uppercase tracking-wider">Complexidade Média</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{analytics.avgComplexity}</p>
                            <p className="text-xs text-white/40 mt-1">Pontos por processo</p>
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 text-green-400 mb-2">
                                <Clock size={18} />
                                <span className="text-xs font-medium uppercase tracking-wider">Duração Total Est.</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{analytics.totalDuration}h</p>
                        </div>
                    </div>

                    {/* Status Distribution Chart */}
                    <div className="md:col-span-1 bg-white/5 p-4 rounded-xl border border-white/5 h-80">
                        <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                            <PieChartIcon size={16} /> Distribuição por Status
                        </h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analytics.statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {analytics.statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1d2d', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Process Complexity Chart (Top 5) */}
                    <div className="md:col-span-2 bg-white/5 p-4 rounded-xl border border-white/5 h-80">
                        <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                            <Zap size={16} /> Top 5 Processos Mais Complexos
                        </h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={processes
                                    .map(p => ({
                                        name: p.title,
                                        complexity: p.bpmn_xml ? (p.bpmn_xml.match(/<[^:]*:task/g) || []).length + (p.bpmn_xml.match(/<[^:]*:exclusiveGateway/g) || []).length * 2 : 0
                                    }))
                                    .sort((a, b) => b.complexity - a.complexity)
                                    .slice(0, 5)
                                }
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                                <XAxis type="number" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" width={150} stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1d2d', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="complexity" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}
