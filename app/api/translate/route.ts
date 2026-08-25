import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Valid text is required' }, { status: 400 })
    }

    // Try Google Translate first (client=dict-chrome-ex or gtx)
    let translatedText = ''
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl=auto&tl=id&dt=t&q=${encodeURIComponent(text)}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Google API responded with status ${response.status}`)
      }

      const data = await response.json()
      // For dict-chrome-ex, the format is slightly different or same.
      // Wait, let's use standard gtx format parser:
      if (data && data[0] && Array.isArray(data[0])) {
        data[0].forEach((item: any) => {
          if (item[0]) {
            translatedText += item[0]
          }
        })
      } else if (data && data.sentences) {
         data.sentences.forEach((s: any) => {
             if (s.trans) translatedText += s.trans
         })
      }
    } catch (googleError) {
      console.warn('Google Translate failed, falling back to MyMemory API...', googleError)
    }

    // Fallback to MyMemory API
    if (!translatedText) {
      const fallbackUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|id`
      const response = await fetch(fallbackUrl)
      
      if (!response.ok) {
        throw new Error(`MyMemory API responded with status ${response.status}`)
      }
      
      const data = await response.json()
      if (data && data.responseData && data.responseData.translatedText) {
        translatedText = data.responseData.translatedText
      }
    }

    if (!translatedText) {
      throw new Error('Could not parse translation result from any provider')
    }

    return NextResponse.json({ result: translatedText })
  } catch (error: any) {
    console.error('Translation error:', error)
    return NextResponse.json({ error: error.message || 'Translation failed' }, { status: 500 })
  }
}
