const DIFY_URL = process.env.DIFY_API_URL || 'https://api.dify.ai/v1'

export async function gerarInsightDiario(merchantId: string, dataRef: string) {
  return callDify(process.env.DIFY_INSIGHT_KEY!, {
    inputs: { merchant_id: merchantId, data_ref: dataRef },
    response_mode: 'blocking',
  })
}

export async function gerarAlertaDivergencia(merchantId: string) {
  return callDify(process.env.DIFY_ALERTA_KEY!, {
    inputs: { merchant_id: merchantId },
    response_mode: 'blocking',
  })
}

export async function gerarAnaliseMargem(merchantId: string, dataRef: string) {
  return callDify(process.env.DIFY_MARGEM_KEY!, {
    inputs: { merchant_id: merchantId, data_ref: dataRef },
    response_mode: 'blocking',
  })
}

async function callDify(apiKey: string | undefined, body: Record<string, unknown>) {
  if (!apiKey) return { error: 'API key não configurada' }

  try {
    const res = await fetch(`${DIFY_URL}/workflows/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      return { error: `Dify API error ${res.status}: ${err}` }
    }

    const data = await res.json()
    return { data }
  } catch (err) {
    return { error: `Erro de conexão: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export type InsightResult = {
  data?: {
    data?: {
      outputs?: Record<string, unknown>
    }
  }
  error?: string
}