'use client'

import { useEffect, useState } from 'react'

const MERCHANT_ID = process.env.NEXT_PUBLIC_MERCHANT_ID || '550e8400-e29b-41d4-a716-446655440000'
const DATA_REF = '2026-07-22'

type DashboardData = {
  resumo: {
    faturamento_bruto: number
    total_entradas: number
    divergencia_detectada: boolean
    valor_divergencia: number
    excesso_cobrado_total: number
    cmv_estimado_pct: number
    prejuizo_taxas: number
    qtd_alertas: number
  } | null
  divergencias: Array<{ forma_pagamento: string; taxa_contratada_pct: number; taxa_efetiva_pct: number; prejuizo_financeiro: number }>
  formas: Array<{ forma_pagamento: string; faturamento_pdv: number; entrada_extrato: number; taxa_contratual_pct: number; taxa_efetiva_pct: number; excesso_prejuizo: number }>
}

function fmt(n: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

function pct(n: number): string {
  return `${n.toFixed(2)}%`
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState('')
  const [alerta, setAlerta] = useState('')
  const [analise, setAnalise] = useState('')
  const [difyLoading, setDifyLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/conciliacao?merchant_id=${MERCHANT_ID}&data_ref=${DATA_REF}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function gerarInsights() {
    setDifyLoading(true)
    setInsight(''); setAlerta(''); setAnalise('')
    try {
      const [i, a, m] = await Promise.all([
        fetch('/api/dify/insight', { method: 'POST', body: JSON.stringify({ merchant_id: MERCHANT_ID, data_ref: DATA_REF }), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
        fetch('/api/dify/alerta', { method: 'POST', body: JSON.stringify({ merchant_id: MERCHANT_ID }), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
        fetch('/api/dify/margem', { method: 'POST', body: JSON.stringify({ merchant_id: MERCHANT_ID, data_ref: DATA_REF }), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
      ])
      setInsight(i.result || i.error || '')
      setAlerta(a.result || a.error || '')
      setAnalise(m.result || m.error || '')
    } catch { setInsight('Erro ao gerar insights') }
    setDifyLoading(false)
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
          <button onClick={gerarInsights} disabled={difyLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2">
            {difyLoading ? (
              <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Gerando...</>
            ) : 'Gerar Insights IA'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : !r ? (
          <p className="text-red-500">Nenhum dado de conciliação encontrado.</p>
        ) : (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard title="Faturamento Bruto" value={fmt(r.faturamento_bruto)} color="blue" />
              <MetricCard title="Entradas no Banco" value={fmt(r.total_entradas)} color="green" />
              <MetricCard title="Divergência" value={fmt(r.valor_divergencia)} color={r.divergencia_detectada ? 'red' : 'green'} badge={r.divergencia_detectada ? 'ATENÇÃO' : 'OK'} />
              <MetricCard title="CMV Estimado" value={pct(r.cmv_estimado_pct || 0)} color="orange" />
            </div>

            {/* Tables */}
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
                        <td className={`py-2 text-right ${f.taxa_efetiva_pct > f.taxa_contratual_pct ? 'text-red-600' : 'text-green-600'}`}>
                          {pct(f.taxa_efetiva_pct)}
                        </td>
                        <td className={`py-2 text-right ${f.excesso_prejuizo > 0 ? 'text-red-600 font-bold' : ''}`}>
                          {f.excesso_prejuizo > 0 ? fmt(f.excesso_prejuizo) : '-'}
                        </td>
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

            {/* Insights */}
            <Card title="Insights de IA">
              {!insight && !alerta && !analise ? (
                <p className="text-gray-500">Clique em "Gerar Insights IA" para analisar os dados com inteligência artificial.</p>
              ) : (
                <div className="space-y-4">
                  {insight && (
                    <div>
                      <h3 className="font-semibold text-blue-800 mb-1">📋 Insight Diário</h3>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 whitespace-pre-wrap text-sm">{insight}</div>
                    </div>
                  )}
                  {alerta && (
                    <div>
                      <h3 className="font-semibold text-red-800 mb-1">🔴 Alertas</h3>
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200 whitespace-pre-wrap text-sm">{alerta}</div>
                    </div>
                  )}
                  {analise && (
                    <div>
                      <h3 className="font-semibold text-green-800 mb-1">📊 Análise de Margem</h3>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200 whitespace-pre-wrap text-sm">{analise}</div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </>
        )}
      </main>
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