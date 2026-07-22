'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  Title,
  Text,
  Metric,
  Grid,
  Col,
  Badge,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Tab,
  TabList,
  TabGroup,
  TabPanel,
  TabPanels,
  Bold,
} from '@tremor/react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Percent,
  Coffee,
  RefreshCw,
} from 'lucide-react'

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
  divergencias: Array<{
    forma_pagamento: string
    taxa_contratada_pct: number
    taxa_efetiva_pct: number
    prejuizo_financeiro: number
  }>
  formas: Array<{
    forma_pagamento: string
    faturamento_pdv: number
    entrada_extrato: number
    taxa_contratual_pct: number
    taxa_efetiva_pct: number
    excesso_prejuizo: number
  }>
}

type DifyResult = {
  data?: { outputs?: Record<string, unknown> }
  error?: string
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState<string>('')
  const [alerta, setAlerta] = useState<string>('')
  const [analise, setAnalise] = useState<string>('')
  const [difyLoading, setDifyLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/conciliacao?merchant_id=${MERCHANT_ID}&data_ref=${DATA_REF}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function gerarInsights() {
    setDifyLoading(true)
    setInsight('')
    setAlerta('')
    setAnalise('')

    try {
      const [iRes, aRes, mRes] = await Promise.all([
        fetch('/api/dify/insight', { method: 'POST', body: JSON.stringify({ merchant_id: MERCHANT_ID, data_ref: DATA_REF }), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
        fetch('/api/dify/alerta', { method: 'POST', body: JSON.stringify({ merchant_id: MERCHANT_ID }), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
        fetch('/api/dify/margem', { method: 'POST', body: JSON.stringify({ merchant_id: MERCHANT_ID, data_ref: DATA_REF }), headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
      ])
      setInsight(iRes.result || iRes.error || '')
      setAlerta(aRes.result || aRes.error || '')
      setAnalise(mRes.result || mRes.error || '')
    } catch (e) {
      setInsight('Erro ao gerar insights')
    }
    setDifyLoading(false)
  }

  const resumo = data?.resumo

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Title className="text-2xl font-bold">FinanceSaaS</Title>
          <Text>Dashboard de Conciliação Financeira — {DATA_REF}</Text>
        </div>
        <button
          onClick={gerarInsights}
          disabled={difyLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${difyLoading ? 'animate-spin' : ''}`} />
          {difyLoading ? 'Gerando...' : 'Gerar Insights IA'}
        </button>
      </div>

      {loading ? (
        <Text>Carregando...</Text>
      ) : !resumo ? (
        <Text className="text-red-500">Nenhum dado de conciliação encontrado.</Text>
      ) : (
        <>
          {/* Cards de Métricas */}
          <Grid numItemsMd={2} numItemsLg={4} className="gap-6 mb-8">
            <Card decoration="top" decorationColor="blue">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-500" />
                <Text>Faturamento Bruto</Text>
              </div>
              <Metric>{formatMoney(resumo.faturamento_bruto)}</Metric>
            </Card>
            <Card decoration="top" decorationColor="green">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <Text>Entradas no Banco</Text>
              </div>
              <Metric>{formatMoney(resumo.total_entradas)}</Metric>
            </Card>
            <Card decoration="top" decorationColor={resumo.divergencia_detectada ? 'red' : 'green'}>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${resumo.divergencia_detectada ? 'text-red-500' : 'text-green-500'}`} />
                <Text>Divergência</Text>
              </div>
              <Metric>{formatMoney(resumo.valor_divergencia)}</Metric>
              <Badge color={resumo.divergencia_detectada ? 'red' : 'green'} size="sm">
                {resumo.divergencia_detectada ? 'ATENÇÃO' : 'OK'}
              </Badge>
            </Card>
            <Card decoration="top" decorationColor="orange">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-orange-500" />
                <Text>CMV Estimado</Text>
              </div>
              <Metric>{formatPercent(resumo.cmv_estimado_pct || 0)}</Metric>
            </Card>
          </Grid>

          {/* Detalhamento */}
          <Grid numItemsMd={2} className="gap-6 mb-8">
            <Card>
              <Title>Conciliação por Forma de Pagamento</Title>
              <Table className="mt-4">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Forma</TableHeaderCell>
                    <TableHeaderCell>PDV</TableHeaderCell>
                    <TableHeaderCell>Extrato</TableHeaderCell>
                    <TableHeaderCell>Tx Contrat.</TableHeaderCell>
                    <TableHeaderCell>Tx Efetiva</TableHeaderCell>
                    <TableHeaderCell>Excesso</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.formas.map((f) => (
                    <TableRow key={f.forma_pagamento}>
                      <TableCell><Bold>{f.forma_pagamento}</Bold></TableCell>
                      <TableCell>{formatMoney(f.faturamento_pdv)}</TableCell>
                      <TableCell>{formatMoney(f.entrada_extrato)}</TableCell>
                      <TableCell>{formatPercent(f.taxa_contratual_pct)}</TableCell>
                      <TableCell>
                        <span className={f.taxa_efetiva_pct > f.taxa_contratual_pct ? 'text-red-600' : 'text-green-600'}>
                          {formatPercent(f.taxa_efetiva_pct)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={f.excesso_prejuizo > 0 ? 'text-red-600 font-bold' : ''}>
                          {f.excesso_prejuizo > 0 ? formatMoney(f.excesso_prejuizo) : '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Card>
              <Title>Divergências de Taxas</Title>
              <Table className="mt-4">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Forma</TableHeaderCell>
                    <TableHeaderCell>Tx Contratada</TableHeaderCell>
                    <TableHeaderCell>Tx Efetiva</TableHeaderCell>
                    <TableHeaderCell>Prejuízo</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.divergencias.length ? (
                    data.divergencias.map((d) => (
                      <TableRow key={d.forma_pagamento}>
                        <TableCell><Bold>{d.forma_pagamento}</Bold></TableCell>
                        <TableCell>{formatPercent(d.taxa_contratada_pct)}</TableCell>
                        <TableCell className="text-red-600">{formatPercent(d.taxa_efetiva_pct)}</TableCell>
                        <TableCell className="text-red-600 font-bold">{formatMoney(d.prejuizo_financeiro)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={4}><Text>Nenhuma divergência detectada ✅</Text></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <Text>Excesso total cobrado: <Bold>{formatMoney(resumo.excesso_cobrado_total)}</Bold></Text>
                </div>
                <Text className="text-sm text-gray-600 mt-1">
                  Prejuízo em taxas: {formatMoney(resumo.prejuizo_taxas)} · Alertas: {resumo.qtd_alertas}
                </Text>
              </div>
            </Card>
          </Grid>

          {/* Insights Dify */}
          <Card>
            <Title>Insights de IA</Title>
            {!insight && !alerta && !analise ? (
              <Text className="mt-4 text-gray-500">
                Clique em &quot;Gerar Insights IA&quot; para analisar os dados com inteligência artificial.
              </Text>
            ) : (
              <TabGroup className="mt-4">
                <TabList>
                  <Tab>📋 Insight Diário</Tab>
                  <Tab>🔴 Alertas</Tab>
                  <Tab>📊 Margem</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg whitespace-pre-wrap">
                      <Text>{insight}</Text>
                    </div>
                  </TabPanel>
                  <TabPanel>
                    <div className="mt-4 p-4 bg-red-50 rounded-lg whitespace-pre-wrap">
                      <Text>{alerta}</Text>
                    </div>
                  </TabPanel>
                  <TabPanel>
                    <div className="mt-4 p-4 bg-green-50 rounded-lg whitespace-pre-wrap">
                      <Text>{analise}</Text>
                    </div>
                  </TabPanel>
                </TabPanels>
              </TabGroup>
            )}
          </Card>
        </>
      )}
    </div>
  )
}