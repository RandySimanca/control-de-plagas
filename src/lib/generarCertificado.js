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

export async function generarCertificado({ folio, cliente, orden, productos, estaciones = [], tecnico, config, firma, actividades = [], fotos = [], firma_tecnico }) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let y = margin

  const logoData = config?.logo_url ? await getImgData(config.logo_url) : null

  // --- 1. PORTADA ---
  // Diseño diagonal corporativo
  doc.setFillColor(5, 150, 105) // primary-600
  doc.triangle(0, 0, pageWidth * 0.7, 0, 0, pageHeight * 0.4, 'F')
  doc.setFillColor(4, 120, 87) // primary-700
  doc.triangle(pageWidth, pageHeight, pageWidth * 0.3, pageHeight, pageWidth, pageHeight * 0.6, 'F')
  
  // Título Principal
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(28)
  doc.setFont(undefined, 'bold')
  doc.text('INFORME TÉCNICO', pageWidth / 2, pageHeight * 0.45, { align: 'center' })
  doc.setFontSize(18)
  doc.text('Manejo Integrado de Plagas (MIP)', pageWidth / 2, pageHeight * 0.52, { align: 'center' })
  
  doc.setFontSize(14)
  doc.setFont(undefined, 'normal')
  doc.text(`Cliente: ${cliente?.nombre || 'N/A'}`, pageWidth / 2, pageHeight * 0.65, { align: 'center' })
  doc.text(`Fecha del Servicio: ${orden.fecha_completada || orden.fecha_programada}`, pageWidth / 2, pageHeight * 0.7, { align: 'center' })

  if (logoData) {
    doc.addImage(logoData, 'PNG', (pageWidth - 40) / 2, pageHeight * 0.2, 40, 40)
  }

  // --- PÁGINAS INTERNAS ---
  doc.addPage()
  
  function drawHeader(pageNumber, totalPages) {
    const headerY = 10
    const headerHeight = 25
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.2)
    
    // Logo
    doc.rect(margin, headerY, 40, headerHeight)
    if (logoData) doc.addImage(logoData, 'PNG', margin + 5, headerY + 2, 30, 21)
    
    // Título Central
    doc.rect(margin + 40, headerY, 90, headerHeight)
    doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(30, 41, 59)
    doc.text('INFORME TÉCNICO DEL SERVICIO', margin + 85, headerY + 14, { align: 'center' })
    
    // Metadatos Lateral
    doc.rect(margin + 130, headerY, pageWidth - 2 * margin - 130, headerHeight)
    doc.setFontSize(8); doc.setFont(undefined, 'normal')
    doc.text(`INFORME: IT-${folio}`, margin + 132, headerY + 6)
    doc.line(margin + 130, headerY + 8, pageWidth - margin, headerY + 8)
    doc.text(`VERSIÓN: 1.0`, margin + 132, headerY + 14)
    doc.line(margin + 130, headerY + 16, pageWidth - margin, headerY + 16)
    doc.text(`PÁGINA: ${pageNumber} de ${totalPages}`, margin + 132, headerY + 22)
  }

  function drawSectionHeader(title, yPos) {
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
    doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(30, 41, 59)
    doc.text(title.toUpperCase(), margin + 3, yPos + 5.5)
    return yPos + 15
  }

  y = 45
  // Sección 1: Identificación
  y = drawSectionHeader('1. Identificación del Cliente', y)
  doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(50, 50, 50)
  doc.text('FECHA DE EJECUCIÓN:', margin, y); doc.setFont(undefined, 'normal'); doc.text(orden.fecha_completada || orden.fecha_programada, margin + 45, y); y += 6
  doc.setFont(undefined, 'bold'); doc.text('NOMBRE O RAZÓN SOCIAL:', margin, y); doc.setFont(undefined, 'normal'); doc.text(cliente?.nombre || 'N/A', margin + 45, y); y += 6
  doc.setFont(undefined, 'bold'); doc.text('NIT / IDENTIFICACIÓN:', margin, y); doc.setFont(undefined, 'normal'); doc.text(cliente?.identificacion || 'N/A', margin + 45, y); y += 6
  doc.setFont(undefined, 'bold'); doc.text('DIRECCIÓN:', margin, y); doc.setFont(undefined, 'normal'); doc.text(cliente?.direccion || 'N/A', margin + 45, y); y += 6
  doc.setFont(undefined, 'bold'); doc.text('TÉCNICO RESPONSABLE:', margin, y); doc.setFont(undefined, 'normal'); doc.text(tecnico || 'N/A', margin + 45, y); y += 10

  // Sección 2: Áreas (NUEVO)
  y = drawSectionHeader('2. Áreas Intervenidas', y)
  doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(71, 85, 105)
  const areaLines = doc.splitTextToSize(orden.areas_intervenidas || 'General / Todo el establecimiento.', pageWidth - 2 * margin - 6)
  doc.text(areaLines, margin + 3, y)
  y += areaLines.length * 5 + 10

  // Sección 3: Actividades
  if (actividades.length > 0) {
    if (y > pageHeight - 40) { doc.addPage(); y = 45 }
    y = drawSectionHeader('3. Actividades Ejecutadas / Diagnosis', y)
    doc.setFontSize(8)
    actividades.slice().reverse().forEach((act) => {
      const time = new Date(act.created_at).toLocaleTimeString('es', {hour:'2-digit', minute:'2-digit'})
      const text = `${time} - ${act.descripcion}`
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin - 10)
      if (y + (lines.length * 4) > pageHeight - 20) { doc.addPage(); y = 45 }
      doc.setFillColor(150, 150, 150); doc.circle(margin + 2, y + 1, 0.5, 'F')
      doc.text(lines, margin + 6, y + 2)
      y += lines.length * 4 + 2
    })
    y += 8
  }

  // Sección 4: Estaciones y Químicos
  if (productos.length > 0 || estaciones.length > 0) {
    if (y > pageHeight - 60) { doc.addPage(); y = 45 }
    y = drawSectionHeader('4. Control de Estaciones y Aplicación de Productos', y)
    
    if (productos.length > 0) {
        doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.text('Productos Utilizados:', margin, y); y += 6
        doc.setFont(undefined, 'normal'); doc.setFontSize(8)
        productos.forEach(p => {
          const info = `${p.tipo_producto || 'Producto'}: ${p.nombre_comercial || ''} (${p.ingrediente_activo || 'S/IA'}) - Cant: ${p.cantidad || '1'}`
          doc.text(`• ${info}`, margin + 3, y); y += 5
        })
        y += 5
    }

    if (estaciones.length > 0) {
        if (y > pageHeight - 30) { doc.addPage(); y = 45 }
        doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.text('Inventario / Revisión de Estaciones:', margin, y); y += 6
        doc.setFont(undefined, 'normal'); doc.setFontSize(8)
        estaciones.forEach(e => {
            doc.text(`• ${e.tipo_estacion}: ${e.cantidad} unidades`, margin + 3, y); y += 5
        })
        y += 8
    }
  }

  // Sección 5: Recomendaciones
  if (orden.recomendaciones) {
    if (y > pageHeight - 40) { doc.addPage(); y = 45 }
    y = drawSectionHeader('5. Recomendaciones y Sugerencias Propuestas', y)
    doc.setFontSize(9); doc.setFont(undefined, 'normal')
    const recLines = doc.splitTextToSize(orden.recomendaciones, pageWidth - 2 * margin - 6)
    doc.text(recLines, margin + 3, y)
    y += recLines.length * 5 + 10
  }

  // Sección 6: Firmas
  if (y > pageHeight - 60) { doc.addPage(); y = 45 }
  y = pageHeight - 50
  const sigWidth = 60
  // Firma Técnico
  doc.setDrawColor(150, 150, 150); doc.line(margin + 10, y, margin + 10 + sigWidth, y)
  doc.setFontSize(8); doc.text('Firma del Técnico Responsable', margin + 10 + (sigWidth/2), y + 4, { align: 'center' })
  if (firma_tecnico) {
    const ft = await getImgData(firma_tecnico)
    if (ft) doc.addImage(ft, 'PNG', margin + 15, y - 18, 50, 15)
  }

  // Firma Cliente
  const clientX = pageWidth - margin - sigWidth - 10
  doc.line(clientX, y, clientX + sigWidth, y)
  doc.text('Firma del Cliente / Receptor', clientX + (sigWidth/2), y + 4, { align: 'center' })

  // Anexo Fotográfico
  if (fotos.length > 0) {
    doc.addPage()
    y = 45
    y = drawSectionHeader('ANEXO FOTOGRÁFICO', y)
    const imgSize = (pageWidth - 2 * margin - 10) / 2
    for (const foto of fotos) {
      const imgData = await getImgData(foto.url)
      if (imgData) {
        const idx = fotos.indexOf(foto)
        const col = idx % 2; const row = Math.floor((idx % 4) / 2)
        if (idx > 0 && idx % 4 === 0) { doc.addPage(); y = 45 }
        doc.addImage(imgData, 'JPEG', margin + col * (imgSize + 10), y + row * (imgSize + 22), imgSize, imgSize)
        doc.setFontSize(8); doc.setTextColor(100, 100, 100)
        doc.text(foto.descripcion || `Evidencia ${idx+1}`, margin + col * (imgSize + 10), y + row * (imgSize + 22) + imgSize + 5)
      }
    }
  }

  // Dibujar cabeceras en todas las páginas internas (2 en adelante)
  const totalPagesCount = doc.internal.getNumberOfPages()
  for (let i = 2; i <= totalPagesCount; i++) {
    doc.setPage(i)
    drawHeader(i - 1, totalPagesCount - 1)
  }

  return doc
}

/**
 * Generates and opens the certificate PDF in a new browser tab.
 */
export async function abrirCertificado(params) {
  const doc = await generarCertificado(params)
  const blobUrl = doc.output('bloburl')
  window.open(blobUrl, '_blank')
}
