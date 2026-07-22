import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type ResumoConciliacao = {
  merchant_id: string
  data_ref: string
  faturamento_bruto: number
  total_entradas: number
  divergencia_detectada: boolean
  valor_divergencia: number
  excesso_cobrado_total: number
  cmv_estimado_pct: number | null
  prejuizo_taxas: number
  qtd_alertas: number
}

export type DivergenciaTaxa = {
  forma_pagamento: string
  taxa_contratada_pct: number
  taxa_efetiva_pct: number
  liquido_esperado: number
  liquido_recebido: number
  prejuizo_financeiro: number
}
