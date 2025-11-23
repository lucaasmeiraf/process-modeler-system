import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import BpmnModeler from 'bpmn-js/lib/Modeler'

export const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const downloadXML = async (modeler: BpmnModeler, filename: string) => {
  try {
    const { xml } = await modeler.saveXML({ format: true })
    if (xml) {
      downloadFile(xml, `${filename}.bpmn`, 'application/xml')
    }
  } catch (err) {
    console.error('Error saving XML', err)
  }
}

export const downloadSVG = async (modeler: BpmnModeler, filename: string) => {
  try {
    const { svg } = await modeler.saveSVG()
    if (svg) {
      downloadFile(svg, `${filename}.svg`, 'image/svg+xml')
    }
  } catch (err) {
    console.error('Error saving SVG', err)
  }
}

export const generatePDF = async (
  modeler: BpmnModeler,
  processTitle: string,
  processDescription: string | null
) => {
  try {
    // 1. Get SVG from modeler
    // @ts-ignore
    const container = modeler.get('canvas').getContainer()
    const canvas = await html2canvas(container as HTMLElement, {
      scale: 2 // Higher quality
    })
    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    // --- Cover Page ---
    pdf.setFontSize(24)
    pdf.text(processTitle, 20, 30)

    pdf.setFontSize(12)
    if (processDescription) {
      const splitDesc = pdf.splitTextToSize(processDescription, 170)
      pdf.text(splitDesc, 20, 50)
    }

    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, pageHeight - 20)

    // --- Diagram Page ---
    pdf.addPage()
    pdf.text('Process Diagram', 20, 20)

    // Fit image to page
    const imgProps = pdf.getImageProperties(imgData)
    const pdfWidth = pageWidth - 40
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

    pdf.addImage(imgData, 'PNG', 20, 30, pdfWidth, pdfHeight)

    // --- Detailed Report Page(s) ---
    pdf.addPage()
    pdf.setFontSize(16)
    pdf.text('Activity Details', 20, 20)
    
    // Extract elements
    // @ts-ignore
    const elementRegistry = modeler.get('elementRegistry') as any
    const elements = elementRegistry.filter((element: any) => {
      return (
        element.type !== 'bpmn:Process' &&
        element.type !== 'bpmn:SequenceFlow' &&
        element.type !== 'label' &&
        element.type !== 'bpmn:Collaboration' &&
        element.type !== 'bpmn:Participant'
      )
    })

    let yPos = 40
    pdf.setFontSize(12)

    elements.forEach((element: any) => {
      // Check for page break
      if (yPos > pageHeight - 30) {
        pdf.addPage()
        yPos = 20
      }

      const name = element.businessObject.name || '(Unnamed Activity)'
      const type = element.type.replace('bpmn:', '')
      const doc = element.businessObject.documentation?.[0]?.text || 'No description provided.'

      // Activity Header
      pdf.setFont('helvetica', 'bold')
      pdf.text(`${name} [${type}]`, 20, yPos)
      yPos += 7

      // Activity Description
      pdf.setFont('helvetica', 'normal')
      const splitDoc = pdf.splitTextToSize(doc, 170)
      pdf.text(splitDoc, 20, yPos)
      
      // Calculate height of description
      const docHeight = splitDoc.length * 5
      yPos += docHeight + 10
    })

    pdf.save(`${processTitle}.pdf`)
  } catch (err) {
    console.error('Error generating PDF', err)
    alert('Failed to generate PDF')
  }
}
