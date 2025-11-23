import { useEffect, useState, useCallback, useMemo } from 'react'
import BpmnModeler from 'bpmn-js/lib/Modeler'

type PropertiesPanelProps = {
  modeler: BpmnModeler | null
  element: any
}

export default function PropertiesPanel({ modeler, element }: PropertiesPanelProps): JSX.Element {
  type ActivityInfo = {
    id: string
    name: string
    type: string
    documentation: string
    owner: string
    sla: string
  }

  const [activities, setActivities] = useState<ActivityInfo[]>([])
  const [focusedActivityId, setFocusedActivityId] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [descriptionInput, setDescriptionInput] = useState('')
  const [ownerInput, setOwnerInput] = useState('')
  const [slaInput, setSlaInput] = useState('')
  const [saving, setSaving] = useState(false)

  const refreshActivities = useCallback(() => {
    if (!modeler) return
    // @ts-ignore
    const elementRegistry = modeler.get('elementRegistry')
    const elements = elementRegistry
      .filter((e: any) => {
        return (
          e.type !== 'bpmn:Process' &&
          e.type !== 'bpmn:SequenceFlow' &&
          e.type !== 'label' &&
          e.type !== 'bpmn:Collaboration' &&
          e.type !== 'bpmn:Participant'
        )
      })
      .map((el: any) => {
        const attrs = el.businessObject.$attrs ?? {}
        return {
          id: el.id,
          name: el.businessObject.name || 'Atividade sem nome',
          type: el.type.replace('bpmn:', ''),
          documentation: el.businessObject.documentation?.[0]?.text || 'Sem descrição',
          owner: attrs['custom:owner'] || '',
          sla: attrs['custom:sla'] || ''
        }
      })
    setActivities(elements)
  }, [modeler])

  const handleSelectElement = (elementId: string) => {
    if (!modeler) return
    // @ts-ignore
    const selection = modeler.get('selection')
    // @ts-ignore
    const elementRegistry = modeler.get('elementRegistry')
    let el = elementRegistry.get(elementId)
    if (el?.type === 'label' && el.labelTarget) {
      el = el.labelTarget
    }
    if (el) {
      selection.select(el)
      setFocusedActivityId(el.id)
    }
  }

  const handleClearFocus = () => {
    if (!modeler) return
    // @ts-ignore
    const selection = modeler.get('selection')
    selection.clear()
    setFocusedActivityId(null)
  }

  useEffect(() => {
    if (!modeler) {
      setActivities([])
      return
    }
    
    // Aguarda um pouco para garantir que o XML foi importado
    const timeoutId = setTimeout(() => {
      refreshActivities()
    }, 100)

    // @ts-ignore
    const eventBus = modeler.get('eventBus')

    const handleUpdate = () => {
      // Pequeno delay para garantir que o registry foi atualizado
      setTimeout(() => {
        refreshActivities()
      }, 50)
    }
    
    eventBus.on('commandStack.changed', handleUpdate)
    eventBus.on('import.done', handleUpdate)
    eventBus.on('shape.added', handleUpdate)
    eventBus.on('shape.removed', handleUpdate)

    return () => {
      clearTimeout(timeoutId)
      eventBus.off('commandStack.changed', handleUpdate)
      eventBus.off('import.done', handleUpdate)
      eventBus.off('shape.added', handleUpdate)
      eventBus.off('shape.removed', handleUpdate)
    }
  }, [modeler, refreshActivities])

  useEffect(() => {
    if (!modeler) {
      setActivities([])
      setFocusedActivityId(null)
      setNameInput('')
      setDescriptionInput('')
      setOwnerInput('')
      setSlaInput('')
      return
    }
    
    if (element) {
      const activeElement = element.type === 'label' && element.labelTarget ? element.labelTarget : element
      setFocusedActivityId(activeElement.id)
      const businessObject = activeElement.businessObject
      const attrs = businessObject.$attrs ?? {}
      setNameInput(businessObject.name || '')
      setDescriptionInput(businessObject.documentation?.[0]?.text || '')
      setOwnerInput(attrs['custom:owner'] || '')
      setSlaInput(attrs['custom:sla'] || '')
    } else {
      setFocusedActivityId(null)
      setNameInput('')
      setDescriptionInput('')
      setOwnerInput('')
      setSlaInput('')
    }
  }, [element, modeler])

  const visibleActivities =
    focusedActivityId && activities.length > 0
      ? activities.filter((activity) => activity.id === focusedActivityId)
      : activities

  const activeActivity = useMemo(() => {
    if (!focusedActivityId) return null
    return activities.find((activity) => activity.id === focusedActivityId) || null
  }, [activities, focusedActivityId])

  const handleUpdateActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modeler || !focusedActivityId) return

    setSaving(true)
    try {
      // @ts-ignore
      const modeling = modeler.get('modeling')
      // @ts-ignore
      const moddle = modeler.get('moddle')
      // @ts-ignore
      const elementRegistry = modeler.get('elementRegistry')
      
      let targetElement = elementRegistry.get(focusedActivityId)
      if (!targetElement) return
      
      // Se for label, pega o elemento real
      if (targetElement.type === 'label' && targetElement.labelTarget) {
        targetElement = targetElement.labelTarget
      }
      
      const documentation = descriptionInput
        ? [moddle.create('bpmn:Documentation', { text: descriptionInput })]
        : []

      modeling.updateProperties(targetElement, {
        name: nameInput || undefined,
        documentation,
        'custom:owner': ownerInput || undefined,
        'custom:sla': slaInput || undefined
      })
      
      // Aguarda um pouco para o registry atualizar
      setTimeout(() => {
        refreshActivities()
      }, 100)
    } catch (error) {
      console.error('Failed to update activity', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#070b13] text-white">
      <div className="p-5 border-b border-white/5 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.5em] text-cyan-300/70 mb-1">Mapa</p>
          <h2 className="font-semibold text-lg text-white">Atividades do processo</h2>
          <p className="text-xs text-dark-300 mt-1">
            {focusedActivityId
              ? 'Exibindo a atividade selecionada'
              : 'Explore as etapas do seu fluxo'}
          </p>
        </div>
        {focusedActivityId && (
          <button
            onClick={handleClearFocus}
            className="text-xs px-3 py-1 rounded-full border border-white/10 text-dark-200 hover:text-white hover:border-cyan-400/50 transition"
          >
            Mostrar todas
          </button>
        )}
      </div>

      {activeActivity && (
        <>
          <div className="p-5 border-b border-white/5 space-y-3 bg-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/70">Descrição</p>
                <h3 className="text-xl font-semibold">{activeActivity.name}</h3>
              </div>
              <span className="text-xs text-white/60">{activeActivity.type}</span>
            </div>
            <p className="text-sm text-white/80 whitespace-pre-line">
              {descriptionInput || 'Ainda sem descrição para esta atividade.'}
            </p>
            <div className="flex gap-2 text-[11px] text-white/60">
              {ownerInput && (
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">
                  Owner: {ownerInput}
                </span>
              )}
              {slaInput && (
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">
                  SLA: {slaInput}
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleUpdateActivity} className="p-5 space-y-4 border-b border-white/5">
            <div>
              <label className="block text-xs uppercase tracking-[0.4em] text-white/60 mb-1">
                Nome da atividade
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-cyan-400/60"
                placeholder="Ex: Aprovar solicitação"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.4em] text-white/60 mb-1">
                Descrição
              </label>
              <textarea
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-cyan-400/60 h-28 resize-none"
                placeholder="Contexto detalhado do passo"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs uppercase tracking-[0.4em] text-white/60 mb-1">
                  Responsável
                </label>
                <input
                  type="text"
                  value={ownerInput}
                  onChange={(e) => setOwnerInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-cyan-400/60"
                  placeholder="Time / Papel"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs uppercase tracking-[0.4em] text-white/60 mb-1">SLA</label>
                <input
                  type="text"
                  value={slaInput}
                  onChange={(e) => setSlaInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-cyan-400/60"
                  placeholder="Ex: 48h"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 font-semibold text-sm shadow-lg shadow-emerald-900/40 border border-white/10 disabled:opacity-40"
              disabled={saving}
            >
              {saving ? 'Atualizando...' : 'Atualizar atividade'}
            </button>
          </form>
        </>
      )}

      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {visibleActivities.length === 0 ? (
          <p className="text-dark-400 text-sm text-center mt-4">Nenhuma atividade encontrada.</p>
        ) : (
          visibleActivities.map((activity) => (
            <button
              key={activity.id}
              onClick={() => handleSelectElement(activity.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                focusedActivityId === activity.id
                  ? 'border-cyan-400/70 bg-white/10'
                  : 'border-white/5 bg-white/5 hover:border-cyan-400/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] tracking-wide uppercase text-white/60">
                  {activity.type}
                </span>
                <span className="text-[10px] text-white/40">{activity.id}</span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">{activity.name}</h3>
              <p className="text-xs text-white/70 whitespace-pre-wrap">{activity.documentation}</p>
              {(activity.owner || activity.sla) && (
                <div className="flex gap-2 mt-2 text-[11px] text-white/70">
                  {activity.owner && (
                    <span className="px-2 py-1 rounded-full bg-white/10 border border-white/10">
                      {activity.owner}
                    </span>
                  )}
                  {activity.sla && (
                    <span className="px-2 py-1 rounded-full bg-white/10 border border-white/10">
                      SLA {activity.sla}
                    </span>
                  )}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
