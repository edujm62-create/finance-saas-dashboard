'use client'

import { useEffect, useState } from 'react'

const MERCHANT_ID = process.env.NEXT_PUBLIC_MERCHANT_ID || '550e8400-e29b-41d4-a716-446655440000'
const DATA_REF = '2026-07-22'

type DashboardData = {
  resumo: {
    faturamento_bruto: number; total_entradas: number; divergencia_detectada: boolean
    valor_divergencia: number; excesso_cobrado_total: number; cmv_estimado_pct: number
    prejuizo_taxas: number; qtd_alertas: number
  } | null
  divergencias: Array<{ forma_pagamento: string; taxa_contratada_pct: number; taxa_efetiva_pct: number; prejuizo_financeiro: number }>
  formas: Array<{ forma_pagamento: string; faturamento_pdv: number; entrada_extrato: number; taxa_contratual_pct: number; taxa_efetiva_pct: number; excesso_prejuizo: number }>
}

function fmt(n: number): string { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n) }
function pct(n: number): string { return `${n.toFixed(2)}%` }

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState('')
  const [alerta, setAlerta] = useState('')
  const [analise, setAnalise] = useState('')
  const [difyLoading, setDifyLoading] = useState(false)
  const [promo, setPromo] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/conciliacao?merchant_id=${MERCHANT_ID}&data_ref=${DATA_REF}`)
      .then(r => r.json()).then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
    fetch('/api/analytics').then(r => r.json()).then(setAnalytics).catch(() => {})
  }, [])

  async function gerarInsights() {
    setDifyLoading(true); setInsight(''); setAlerta(''); setAnalise('')
    try {
      const [i, a, m] = await Promise.all([
        fetch('/api/dify/insight', { method: 'POST', body: JSON.stringify({ merchant_id: MERCHANT_ID, data_ref: DATA_REF }), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
        fetch('/api/dify/alerta', { method: 'POST', body: JSON.stringify({ merchant_id: MERCHANT_ID }), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
        fetch('/api/dify/margem', { method: 'POST', body: JSON.stringify({ merchant_id: MERCHANT_ID, data_ref: DATA_REF }), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
      ])
      setInsight(i.result || i.error || ''); setAlerta(a.result || a.error || ''); setAnalise(m.result || m.error || '')
    } catch { setInsight('Erro ao gerar insights') }
    setDifyLoading(false)
  }

  async function gerarPromocao() {
    setPromoLoading(true); setPromo('')
    try {
      const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
      const climas = ['calor','frio','ameno','chuvoso','nublado']
      const dia = dias[new Date().getDay()]
      const clima = climas[Math.floor(Math.random() * climas.length)]
      const res = await fetch('/api/dify/promo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant_id: MERCHANT_ID, previsao_tempo: clima, dia_semana: dia }),
      }).then(r => r.json())
      setPromo(res.result || res.error || 'Erro')
    } catch { setPromo('Erro ao gerar promoção') }
    setPromoLoading(false)
  }

  const r = data?.resumo

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">FinanceSaaS</h1>
            <p className="text-sm text-gray-500">Dashboard de Conciliação Financeira — {DATA_REF}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={gerarPromocao} disabled={promoLoading}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 text-sm font-medium flex items-center gap-2">
              {promoLoading ? (
                <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Gerando...</>
              ) : '⚡ Gerar Promoção do Dia'}
            </button>
            <button onClick={gerarInsights} disabled={difyLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2">
              {difyLoading ? (
                <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Gerando...</>
              ) : 'Gerar Insights IA'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : !r ? (
          <p className="text-red-500">Nenhum dado de conciliação encontrado.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard title="Faturamento Bruto" value={fmt(r.faturamento_bruto)} color="blue" />
              <MetricCard title="Entradas no Banco" value={fmt(r.total_entradas)} color="green" />
              <MetricCard title="Divergência" value={fmt(r.valor_divergencia)} color={r.divergencia_detectada ? 'red' : 'green'} badge={r.divergencia_detectada ? 'ATENÇÃO' : 'OK'} />
              <MetricCard title="CMV Estimado" value={pct(r.cmv_estimado_pct || 0)} color="orange" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card title="Conciliação por Forma de Pagamento">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-semibold text-gray-600">Forma</th>
                      <th className="text-right py-2 font-semibold text-gray-600">PDV</th>
                      <th className="text-right py-2 font-semibold text-gray-600">Extrato</th>
                      <th className="text-right py-2 font-semibold text-gray-600">Tx Contrat.</th>
                      <th className="text-right py-2 font-semibold text-gray-600">Tx Efetiva</th>
                      <th className="text-right py-2 font-semibold text-gray-600">Excesso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.formas.map(f => (
                      <tr key={f.forma_pagamento} className="border-b border-gray-100">
                        <td className="py-2 font-medium">{f.forma_pagamento}</td>
                        <td className="py-2 text-right">{fmt(f.faturamento_pdv)}</td>
                        <td className="py-2 text-right">{fmt(f.entrada_extrato)}</td>
                        <td className="py-2 text-right">{pct(f.taxa_contratual_pct)}</td>
                        <td className={`py-2 text-right ${f.taxa_efetiva_pct > f.taxa_contratual_pct ? 'text-red-600' : 'text-green-600'}`}>{pct(f.taxa_efetiva_pct)}</td>
                        <td className={`py-2 text-right ${f.excesso_prejuizo > 0 ? 'text-red-600 font-bold' : ''}`}>{f.excesso_prejuizo > 0 ? fmt(f.excesso_prejuizo) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

              <Card title="Divergências de Taxas">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-semibold text-gray-600">Forma</th>
                      <th className="text-right py-2 font-semibold text-gray-600">Tx Contratada</th>
                      <th className="text-right py-2 font-semibold text-gray-600">Tx Efetiva</th>
                      <th className="text-right py-2 font-semibold text-gray-600">Prejuízo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.divergencias.length ? data.divergencias.map(d => (
                      <tr key={d.forma_pagamento} className="border-b border-gray-100">
                        <td className="py-2 font-medium">{d.forma_pagamento}</td>
                        <td className="py-2 text-right">{pct(d.taxa_contratada_pct)}</td>
                        <td className="py-2 text-right text-red-600">{pct(d.taxa_efetiva_pct)}</td>
                        <td className="py-2 text-right text-red-600 font-bold">{fmt(d.prejuizo_financeiro)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="py-4 text-center text-gray-500">Nenhuma divergência detectada ✅</td></tr>
                    )}
                  </tbody>
                </table>
                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm"><span className="font-semibold">Excesso total cobrado:</span> {fmt(r.excesso_cobrado_total)}</p>
                  <p className="text-sm text-gray-600 mt-1">Prejuízo em taxas: {fmt(r.prejuizo_taxas)} · Alertas: {r.qtd_alertas}</p>
                </div>
              </Card>
            </div>

            <Card title="Insights de IA">
              {!insight && !alerta && !analise ? (
                <p className="text-gray-500">Clique em "Gerar Insights IA" para analisar os dados.</p>
              ) : (
                <div className="space-y-4">
                  {insight && <div><h3 className="font-semibold text-blue-800 mb-1">📋 Insight Diário</h3><div className="p-4 bg-blue-50 rounded-lg border border-blue-200 whitespace-pre-wrap text-sm">{insight}</div></div>}
                  {alerta && <div><h3 className="font-semibold text-red-800 mb-1">🔴 Alertas</h3><div className="p-4 bg-red-50 rounded-lg border border-red-200 whitespace-pre-wrap text-sm">{alerta}</div></div>}
                  {analise && <div><h3 className="font-semibold text-green-800 mb-1">📊 Análise de Margem</h3><div className="p-4 bg-green-50 rounded-lg border border-green-200 whitespace-pre-wrap text-sm">{analise}</div></div>}
                </div>
              )}
            </Card>
            </>
        )}
      </main>

      {/* Analytics */}
      {analytics && analytics.vendas_por_dia && analytics.vendas_por_dia.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-4">
          <Card title="📈 Análise Histórica">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500">🎟️ Ticket Médio</p>
                <p className="text-xl font-bold">{fmt(analytics.ticket_medio)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500">📊 Categorias</p>
                <p className="text-xl font-bold">{analytics.categorias?.length || 0}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500">⏰ Pico</p>
                <p className="text-xl font-bold">
                  {analytics.horarios?.sort((a: any, b: any) => b.valor - a.valor)?.[0]?.hora || '-'}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500">🏆 Melhor Dia</p>
                <p className="text-xl font-bold">
                  {analytics.vendas_por_dia?.sort((a: any, b: any) => b.total - a.total)?.[0]?.dia || '-'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Vendas por Dia da Semana</h3>
                <div className="space-y-1">
                  {analytics.vendas_por_dia?.map((d: any) => {
                    const maxV = Math.max(...analytics.vendas_por_dia.map((x: any) => x.total))
                    const pct = (d.total / maxV) * 100
                    return (
                      <div key={d.dia} className="flex items-center gap-2">
                        <span className="w-20 text-xs text-gray-600">{d.dia}</span>
                        <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="text-xs font-medium w-20 text-right">{fmt(d.total)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Vendas por Categoria</h3>
                <div className="space-y-1">
                  {analytics.categorias?.sort((a: any, b: any) => b.valor - a.valor).map((c: any) => {
                    const maxV = Math.max(...analytics.categorias.map((x: any) => x.valor))
                    const pct = (c.valor / maxV) * 100
                    const cores = ['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500']
                    return (
                      <div key={c.nome} className="flex items-center gap-2">
                        <span className="w-32 text-xs text-gray-600 truncate">{c.nome}</span>
                        <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${cores[0]} rounded-full`} style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="text-xs font-medium w-20 text-right">{fmt(c.valor)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {analytics.horarios && analytics.horarios.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-700 mb-2">Vendas por Horário</h3>
                <div className="flex items-end gap-1 h-24">
                  {analytics.horarios.sort((a: any, b: any) => parseInt(a.hora) - parseInt(b.hora)).map((h: any) => {
                    const maxV = Math.max(...analytics.horarios.map((x: any) => x.valor))
                    const pct = (h.valor / maxV) * 100
                    return (
                      <div key={h.hora} className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-blue-500 rounded-t" style={{ height: `${pct}%`, minHeight: pct > 0 ? '4px' : '0' }}></div>
                        <span className="text-[10px] text-gray-500 mt-1">{h.hora}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">☀️ Promoção do Dia</h2>
            <button onClick={gerarPromocao} disabled={promoLoading} className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              {promoLoading ? 'Gerando...' : '🔄 Nova sugestão'}
            </button>
          </div>
          {!promo ? (
            <p className="text-gray-500">Clique em "⚡ Gerar Promoção do Dia" para gerar uma campanha baseada no clima e nas vendas.</p>
          ) : (
            <div className="whitespace-pre-wrap text-sm font-mono bg-amber-50 p-4 rounded-lg border border-amber-200">{promo}</div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, color, badge }: { title: string; value: string; color: string; badge?: string }) {
  const colors: Record<string, string> = { blue: 'border-blue-500', green: 'border-green-500', red: 'border-red-500', orange: 'border-orange-500' }
  const badgeColors: Record<string, string> = { red: 'bg-red-100 text-red-800', green: 'bg-green-100 text-green-800' }
  return (
    <div className={`bg-white rounded-xl border-t-4 ${colors[color] || 'border-gray-500'} shadow-sm p-6`}>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {badge && <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${badgeColors[color] || 'bg-gray-100 text-gray-800'}`}>{badge}</span>}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  )
}