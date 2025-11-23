import { Process } from '../types/process'

export interface ProcessMetrics {
  totalElements: number
  tasks: number
  gateways: number
  events: number
  complexityScore: number
  estimatedDurationHours: number
}

export const calculateProcessMetrics = (xml: string): ProcessMetrics => {
  if (!xml) {
    return {
      totalElements: 0,
      tasks: 0,
      gateways: 0,
      events: 0,
      complexityScore: 0,
      estimatedDurationHours: 0
    }
  }

  // Simple regex-based counting for now
  // In a real implementation, we would use bpmn-moddle to parse the XML AST
  const tasks = (xml.match(/<[^:]*:task/g) || []).length + 
                (xml.match(/<[^:]*:userTask/g) || []).length +
                (xml.match(/<[^:]*:serviceTask/g) || []).length +
                (xml.match(/<[^:]*:sendTask/g) || []).length +
                (xml.match(/<[^:]*:receiveTask/g) || []).length
  
  const gateways = (xml.match(/<[^:]*:exclusiveGateway/g) || []).length +
                   (xml.match(/<[^:]*:parallelGateway/g) || []).length +
                   (xml.match(/<[^:]*:inclusiveGateway/g) || []).length +
                   (xml.match(/<[^:]*:complexGateway/g) || []).length +
                   (xml.match(/<[^:]*:eventBasedGateway/g) || []).length

  const events = (xml.match(/<[^:]*:startEvent/g) || []).length +
                 (xml.match(/<[^:]*:endEvent/g) || []).length +
                 (xml.match(/<[^:]*:intermediateCatchEvent/g) || []).length +
                 (xml.match(/<[^:]*:intermediateThrowEvent/g) || []).length

  const totalElements = tasks + gateways + events

  // Complexity Score Calculation (Simple Heuristic)
  // CNC (Control-Flow Complexity) = Gateways + Events
  // NOA (Number of Activities) = Tasks
  // Score = (Gateways * 2) + Tasks + (Events * 0.5)
  const complexityScore = Math.round((gateways * 2) + tasks + (events * 0.5))

  // Estimated Duration (Heuristic)
  // Assume avg task takes 4 hours, gateway overhead 1 hour
  const estimatedDurationHours = (tasks * 4) + (gateways * 1)

  return {
    totalElements,
    tasks,
    gateways,
    events,
    complexityScore,
    estimatedDurationHours
  }
}

export const getBoardAnalytics = (processes: Process[]) => {
  const statusDistribution = {
    draft: 0,
    pending_review: 0,
    published: 0
  }

  let totalComplexity = 0
  let totalDuration = 0

  processes.forEach(p => {
    if (p.status) {
      statusDistribution[p.status] = (statusDistribution[p.status] || 0) + 1
    }
    
    if (p.bpmn_xml) {
      const metrics = calculateProcessMetrics(p.bpmn_xml)
      totalComplexity += metrics.complexityScore
      totalDuration += metrics.estimatedDurationHours
    }
  })

  const avgComplexity = processes.length > 0 ? Math.round(totalComplexity / processes.length) : 0
  const totalProcesses = processes.length

  return {
    statusDistribution: [
      { name: 'Rascunho', value: statusDistribution.draft, color: '#fbbf24' }, // yellow-400
      { name: 'Em Revisão', value: statusDistribution.pending_review, color: '#38bdf8' }, // cyan-400
      { name: 'Publicado', value: statusDistribution.published, color: '#4ade80' } // green-400
    ],
    avgComplexity,
    totalProcesses,
    totalDuration
  }
}
