import { pdfjs } from 'react-pdf'
import JSZip from 'jszip'

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
}

export async function convertPdfToEpub(
  pdfInput: ArrayBuffer | Blob,
  title: string = 'Document',
  onProgress?: (current: number, total: number, statusText?: string) => void
): Promise<ArrayBuffer> {
  const pdfBuffer = pdfInput instanceof Blob ? await pdfInput.arrayBuffer() : pdfInput
  const loadingTask = pdfjs.getDocument({ data: pdfBuffer })
  const pdfDoc = await loadingTask.promise
  const numPages = pdfDoc.numPages

  let htmlBody = ''

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (onProgress) onProgress(pageNum, numPages, 'Memuat halaman...')

    const page = await pdfDoc.getPage(pageNum)
    const textContent = await page.getTextContent()

    // Collect all text items into paragraphs
    const pageParagraphs: string[] = []
    let currentParagraph = ''
    let lastY: number | null = null

    for (const item of textContent.items as any[]) {
      if (!('str' in item)) continue
      const str: string = item.str
      const y: number | null = item.transform ? item.transform[5] : null
      const isNewLine = (lastY !== null && y !== null && Math.abs(lastY - y) > 6) || item.hasEOL
      if (isNewLine) {
        if (currentParagraph.trim()) pageParagraphs.push(currentParagraph.trim())
        currentParagraph = ''
      }
      currentParagraph += str
      if (y !== null) lastY = y
    }
    if (currentParagraph.trim()) pageParagraphs.push(currentParagraph.trim())

    // Only treat as text page if there are enough meaningful words
    const fullText = pageParagraphs.join(' ')
    const wordCount = fullText.trim().split(/\s+/).filter(w => w.length > 1).length
    const hasRealText = wordCount >= 5

    let pageHtml = `<div class="pdf-page" id="page-${pageNum}">`
    pageHtml += `<h3 style="text-align:center;color:#888;font-size:0.8em;margin-top:1.5em;border-bottom:1px dashed #ccc;padding-bottom:0.4em;">— Halaman ${pageNum} —</h3>`

    if (hasRealText) {
      // Render as reflowable text paragraphs
      for (const p of pageParagraphs) {
        if (p.trim().split(/\s+/).filter(w => w.length > 1).length >= 2) {
          pageHtml += `<p style="margin:0.8em 0;line-height:1.7;text-indent:1.2em;text-align:justify;">${escapeXml(p)}</p>`
        }
      }
    } else {
      // Scanned page — render page to canvas image
      try {
        const viewport = page.getViewport({ scale: 1.5 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!
        await (page.render({ canvasContext: ctx, viewport, canvas } as any).promise)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        pageHtml += `<div style="text-align:center;margin:0.5em 0;"><img src="${dataUrl}" style="max-width:100%;height:auto;" alt="Halaman ${pageNum}"/></div>`
      } catch (e) {
        console.error('Error rendering page canvas', e)
        pageHtml += `<p style="color:#aaa;text-align:center;font-style:italic;">[Gagal memuat halaman ${pageNum}]</p>`
      }
    }

    pageHtml += `</div>`
    htmlBody += pageHtml
  }

  // Build EPUB package using JSZip
  const zip = new JSZip()

  // 1. mimetype (must be uncompressed according to EPUB spec)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })

  // 2. META-INF/container.xml
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
   <rootfiles>
      <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
   </rootfiles>
</container>`
  )

  // 3. OEBPS/chapter1.html
  const safeTitle = escapeXml(title)
  const chapterHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${safeTitle}</title>
  <style type="text/css">
    body { font-family: sans-serif; padding: 1em; line-height: 1.6; }
    p { margin-bottom: 0.8em; text-align: justify; }
    .pdf-page { margin-bottom: 2em; }
  </style>
</head>
<body>
  <h1 style="text-align: center; margin-bottom: 1.5em;">${safeTitle}</h1>
  ${htmlBody}
</body>
</html>`

  zip.file('OEBPS/chapter1.html', chapterHtml)

  // 4. OEBPS/toc.ncx
  zip.file(
    'OEBPS/toc.ncx',
    `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:baloer-pdf-conv-${Date.now()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${safeTitle}</text>
  </docTitle>
  <navMap>
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel>
        <text>Buku Lengkap</text>
      </navLabel>
      <content src="chapter1.html"/>
    </navPoint>
  </navMap>
</ncx>`
  )

  // 5. OEBPS/content.opf
  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:title>${safeTitle}</dc:title>
        <dc:creator>PDF Auto Convert</dc:creator>
        <dc:language>id</dc:language>
        <dc:identifier id="BookId">urn:uuid:baloer-pdf-conv-${Date.now()}</dc:identifier>
    </metadata>
    <manifest>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        <item id="chapter1" href="chapter1.html" media-type="application/xhtml+xml"/>
    </manifest>
    <spine toc="ncx">
        <itemref idref="chapter1"/>
    </spine>
</package>`
  )

  return await zip.generateAsync({ type: 'arraybuffer', mimeType: 'application/epub+zip' })
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
