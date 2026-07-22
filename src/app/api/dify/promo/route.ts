import { NextRequest } from 'next/server'
import { callDify } from '../shared'

export async function POST(req: NextRequest) {
  const { merchant_id, previsao_tempo, dia_semana } = await req.json()
  return callDify(process.env.DIFY_PROMO_KEY, { merchant_id, previsao_tempo, dia_semana })
}