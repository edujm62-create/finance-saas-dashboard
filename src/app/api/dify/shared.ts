import { NextResponse } from 'next/server'

const DIFY_URL = process.env.DIFY_API_URL || 'https://api.dify.ai/v1'

async function callDify(apiKey: string | undefined, inputs: Record<string, string>) {
  if (!apiKey) return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })

  try {
    const res = await fetch(`${DIFY_URL}/workflows/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs, response_mode: 'blocking' }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Dify error: ${err}` }, { status: res.status })
    }

    const data = await res.json()
    const outputs = data.data?.outputs || {}
    const result = Object.values(outputs).join('\n')
    return NextResponse.json({ result })
  } catch (err) {
    return NextResponse.json({ error: `Erro de conexão: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 })
  }
}

export { callDify }