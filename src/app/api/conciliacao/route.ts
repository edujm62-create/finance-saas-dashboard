import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const merchantId = searchParams.get('merchant_id') || '550e8400-e29b-41d4-a716-446655440000'
  const dataRef = searchParams.get('data_ref') || '2026-07-22'

  // 1. Buscar resumo
  const { data: resumo } = await supabase
    .from('v_resumo_conciliacao')
    .select('*')
    .eq('merchant_id', merchantId)
    .eq('data_ref', dataRef)
    .single()

  if (!resumo) {
    return NextResponse.json({ error: 'Nenhuma conciliação encontrada para esta data' }, { status: 404 })
  }

  // 2. Buscar ID da conciliação
  const { data: conc } = await supabase
    .from('conciliacoes')
    .select('id')
    .eq('merchant_id', merchantId)
    .eq('data_ref', dataRef)
    .single()

  if (!conc) {
    return NextResponse.json({ resumo, divergencias: [], formas: [] })
  }

  const concId = conc.id

  // 3. Buscar divergências
  const { data: divergencias } = await supabase
    .from('divergencias_taxas')
    .select('*')
    .eq('conciliacao_id', concId)

  // 4. Buscar formas
  const { data: formas } = await supabase
    .from('conciliacao_formas')
    .select('*')
    .eq('conciliacao_id', concId)

  return NextResponse.json({
    resumo,
    divergencias: divergencias || [],
    formas: formas || [],
  })
}