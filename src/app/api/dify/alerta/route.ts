import { NextRequest } from 'next/server'
import { callDify } from '../shared'

export async function POST(req: NextRequest) {
  const { merchant_id } = await req.json()
  return callDify(process.env.DIFY_ALERTA_KEY, { merchant_id })
}