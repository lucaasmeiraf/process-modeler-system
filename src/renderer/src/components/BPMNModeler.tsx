import { useEffect, useRef, useState } from 'react'
import BpmnModeler from 'bpmn-js/lib/Modeler'
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css'
import { Loader2 } from 'lucide-react'

// Default empty BPMN 2.0 diagram
const emptyBpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`

type BPMNModelerProps = {
  xml?: string
  onModelerInit?: (modeler: BpmnModeler) => void
  onElementClick?: (element: any) => void
  onChange?: (xml: string) => void
}

export default function BPMNModeler({
  xml,
  onModelerInit,
  onElementClick,
  onChange
}: BPMNModelerProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const modelerRef = useRef<BpmnModeler | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return

    const modeler = new BpmnModeler({
      container: containerRef.current,
      keyboard: {
        bindTo: document
      }
    })

    modelerRef.current = modeler

    if (onModelerInit) {
      onModelerInit(modeler)
    }

    modeler.on('selection.changed', (e: any) => {
      const selection = e.newSelection[0]
      if (onElementClick) {
        onElementClick(selection)
      }
    })

    modeler.on('commandStack.changed', async () => {
      if (onChange) {
        try {
          const { xml } = await modeler.saveXML({ format: true })
          if (xml) onChange(xml)
        } catch (err) {
          console.error('Error saving XML:', err)
        }
      }
    })

    return () => {
      modeler.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (modelerRef.current) {
      const importXml = async (): Promise<void> => {
        try {
          await modelerRef.current!.importXML(xml || emptyBpmn)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const canvas = modelerRef.current!.get('canvas') as any
          canvas.zoom('fit-viewport')
        } catch (err) {
          console.error('Error importing XML:', err)
        } finally {
          setLoading(false)
        }
      }
      importXml()
    }
  }, [xml])

  return (
    <div className="relative w-full h-full bg-white">
      <div ref={containerRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-dark-500" />
        </div>
      )}
    </div>
  )
}
