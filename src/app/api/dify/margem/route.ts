import { NextRequest } from 'next/server'
import { callDify } from '../shared'

export async function POST(req: NextRequest) {
  const { merchant_id, data_ref } = await req.json()
  return callDify(process.env.DIFY_MARGEM_KEY, { merchant_id, data_ref })
}