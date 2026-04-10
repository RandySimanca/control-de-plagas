import { jsPDF } from 'jspdf'

async function getImgData(url) {
  if (!url) return null
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.error('Error fetching image:', err)
    return null
  }
}

export async function generarCertificado({ folio, cliente, orden, productos, tecnico, config, firma, actividades = [], fotos = [], firma_tecnico }) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = 20

  const logoData = config?.logo_url ? await getImgData(config.logo_url) : null
  const firmaData = firma ? await getImgData(firma) : null

  // Header background
  doc.setFillColor(5, 150, 105) // primary-600
  doc.rect(0, 0, pageWidth, 50, 'F')

  if (logoData) {
    doc.addImage(logoData, 'PNG', margin, 10, 30, 30)
  }

  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text(config?.nombre_empresa || 'PlagControl', margin + 38, 25)
  doc.setFontSize(10)
  doc.text('Certificado de Servicio de Control de Plagas', margin + 38, 35)

  y = 60
  doc.setFontSize(11)
  doc.setTextColor(100, 100, 100)
  doc.text(`Folio: ${folio}`, margin, y)
  doc.text(`Fecha: ${orden.fecha_completada || orden.fecha_programada}`, pageWidth - margin, y, { align: 'right' })
  y += 15

  doc.setDrawColor(5, 150, 105)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 12

  // Client Info
  doc.setFontSize(13); doc.setTextColor(30, 41, 59); doc.text('Datos del Cliente', margin, y)
  y += 10
  doc.setFontSize(10); doc.setTextColor(71, 85, 105)
  
  const clienteInfo = [
    ['Nombre:', cliente?.nombre || 'N/A'],
    ['Razón Social:', cliente?.razon_social || 'N/A'],
    ['ID / NIT:', cliente?.identificacion || 'N/A'],
    ['Dirección:', cliente?.direccion || 'N/A'],
    ['Teléfono:', cliente?.telefono || 'N/A']
  ]
  
  clienteInfo.forEach(([label, value]) => {
    doc.setFont('', 'bold'); doc.text(label, margin, y)
    doc.setFont('', 'normal'); doc.text(value, margin + 25, y)
    y += 6
  })

  y += 5
  doc.setFontSize(13); doc.setTextColor(30, 41, 59); doc.text('Detalles del Trabajo', margin, y)
  y += 10
  doc.setFontSize(10); doc.setTextColor(71, 85, 105)
  const serviceInfo = [['Técnico:', tecnico], ['Plaga:', orden.tipo_plaga || 'General'], ['Estado:', 'Completado']]
  serviceInfo.forEach(([label, value]) => {
    doc.setFont(undefined, 'bold'); doc.text(label, margin, y)
    doc.setFont(undefined, 'normal'); doc.text(value, margin + 45, y)
    y += 7
  })

  y += 8
  // Bitácora
  if (actividades.length > 0) {
    doc.setFontSize(13); doc.setTextColor(30, 41, 59); doc.text('Bitácora de Actividades', margin, y)
    y += 8; doc.setFontSize(9)
    actividades.slice().reverse().forEach((act) => {
      const time = new Date(act.created_at).toLocaleTimeString('es', {hour:'2-digit', minute:'2-digit'})
      const text = `${time}: ${act.descripcion}`
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin - 10)
      if (y + (lines.length * 5) > pageHeight - 60) { doc.addPage(); y = 20 }
      doc.setFillColor(200, 200, 200); doc.circle(margin + 2, y + 1, 0.8, 'F')
      doc.setTextColor(71, 85, 105); doc.text(lines, margin + 8, y + 2)
      y += lines.length * 5 + 2
    })
    y += 10
  }

  // Products
  if (productos.length > 0) {
    if (y > pageHeight - 60) { doc.addPage(); y = 20 }
    doc.setFontSize(13); doc.setTextColor(30, 41, 59); doc.text('Productos Utilizados', margin, y)
    y += 8
    productos.forEach(p => {
      doc.setFontSize(10); doc.text(p.nombre_producto, margin + 3, y)
      doc.text(p.cantidad, pageWidth - margin - 3, y, { align: 'right' })
      y += 7
    })
    y += 10
  }

  // Signatures
  if (y > pageHeight - 70) { doc.addPage(); y = 20 }
  y = pageHeight - 60
  
  // Technician Signature (Centered)
  const sigWidth = 70
  const sigX = (pageWidth - sigWidth) / 2
  doc.setDrawColor(148, 163, 184); doc.line(sigX, y, sigX + sigWidth, y)
  doc.setFontSize(9); doc.setTextColor(71, 85, 105)
  doc.text('Firma del Técnico Responsable', pageWidth / 2, y + 6, { align: 'center' })
  doc.setFontSize(10); doc.setTextColor(30, 41, 59)
  doc.text(tecnico || 'N/A', pageWidth / 2, y + 12, { align: 'center' })
  if (firma_tecnico) { 
    const fTec = await getImgData(firma_tecnico)
    if (fTec) doc.addImage(fTec, 'PNG', sigX + 10, y - 25, 50, 20)
  }

  // Photos
  if (fotos.length > 0) {
    doc.addPage()
    doc.setFontSize(16); doc.setTextColor(5, 150, 105); doc.text('Anexo Fotográfico', margin, 20)
    y = 35
    const imgSize = (pageWidth - 2 * margin - 10) / 2
    for (const foto of fotos) {
        const imgData = await getImgData(foto.url)
        if (imgData) {
            const idx = fotos.indexOf(foto)
            const col = idx % 2; const row = Math.floor((idx % 4) / 2)
            if (idx > 0 && idx % 4 === 0) { doc.addPage(); y = 35 }
            doc.addImage(imgData, 'JPEG', margin + col * (imgSize + 10), y + row * (imgSize + 20), imgSize, imgSize)
            doc.setFontSize(8); doc.setTextColor(150, 150, 150); doc.text(foto.descripcion || `Imagen ${idx+1}`, margin + col * (imgSize + 10), y + row * (imgSize + 20) + imgSize + 5)
        }
    }
  }

  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor(148, 163, 184)
    doc.text(`Página ${i} de ${totalPages} | Folio: ${folio}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
  }
  
  return doc
}

/**
 * Generates and opens the certificate PDF in a new browser tab.
 * This is the most reliable approach across all browsers.
 */
export async function abrirCertificado(params) {
  const doc = await generarCertificado(params)
  const blobUrl = doc.output('bloburl')
  window.open(blobUrl, '_blank')
}
