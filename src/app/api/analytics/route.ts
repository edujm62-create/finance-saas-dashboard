import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const mid = '550e8400-e29b-41d4-a716-446655440000'

  // Vendas por dia da semana
  const { data: vendas } = await supabase
    .from('pdv_vendas_raw')
    .select('data_hora, total_item, item, categoria, quantidade')
    .limit(500)

  if (!vendas || vendas.length === 0) {
    return NextResponse.json({ vendas_por_dia: [], categorias: [], ticket_medio: 0, horarios: [] })
  }

  const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
  const porDia: Record<string, {total: number, qtd: number}> = {}
  const porCategoria: Record<string, number> = {}
  const porHora: Record<string, number> = {}
  let totalVendas = 0
  let totalPedidos = 0

  vendas.forEach(v => {
    const d = new Date(v.data_hora)
    const dia = dias[d.getUTCDay()]
    const hora = d.getUTCHours().toString().padStart(2,'0') + 'h'
    const cat = v.categoria || 'Outros'

    if (!porDia[dia]) porDia[dia] = { total: 0, qtd: 0 }
    porDia[dia].total += Number(v.total_item)
    porDia[dia].qtd += Number(v.quantidade)

    porCategoria[cat] = (porCategoria[cat] || 0) + Number(v.total_item)
    porHora[hora] = (porHora[hora] || 0) + Number(v.total_item)
    totalVendas += Number(v.total_item)
    totalPedidos += Number(v.quantidade)
  })

  return NextResponse.json({
    vendas_por_dia: Object.entries(porDia).map(([k, v]) => ({ dia: k, total: Math.round(v.total), qtd: v.qtd })),
    categorias: Object.entries(porCategoria).map(([k, v]) => ({ nome: k, valor: Math.round(v) })),
    ticket_medio: totalPedidos > 0 ? Math.round(totalVendas / totalPedidos) : 0,
    horarios: Object.entries(porHora).map(([k, v]) => ({ hora: k, valor: Math.round(v) })),
  })
}