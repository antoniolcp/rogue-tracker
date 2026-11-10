import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Crosshair, X } from 'lucide-react'
import {
  Avatar, Button, Card, CardBody, CardHeader, DataTable, EmptyState, Meter, PageHeader, PageSkeleton, PlayerPicker, Segmented, WinRate,
} from '../../../components/ui'
import { useRogueData } from '../data'
import { ChartTooltip } from '../components/ChartTooltip'
import { calculateGeneralOperatorStats, calculateIndividualOperatorStats, fmtInt } from '../utils/stats'

export default function Operators() {
  const { players, battles, mvpIndex, loading } = useRogueData()
  const [params, setParams] = useSearchParams()
  const tab = params.get('vista') || 'geral'
  const player = params.get('jogador')

  const general = useMemo(() => calculateGeneralOperatorStats(battles, mvpIndex), [battles, mvpIndex])
  const individual = useMemo(
    () => (player ? calculateIndividualOperatorStats(battles, mvpIndex, player) : []),
    [battles, mvpIndex, player],
  )

  if (loading) return <PageSkeleton />

  const setTab = (v) => setParams(v === 'geral' ? {} : { vista: v })
  const rows = tab === 'geral' ? general : individual
  const maxGames = Math.max(...rows.map((o) => o.totalGames), 1)

  const columns = [
    { key: 'name', header: 'Operador', sticky: true, cell: (o) => <span className="font-semibold">{o.name}</span> },
    {
      key: 'totalGames', header: 'Jogos', align: 'right',
      cell: (o) => (
        <div className="flex items-center justify-end gap-2">
          <Meter value={o.totalGames} max={maxGames} className="hidden w-16 sm:block" />
          <span>{o.totalGames}</span>
        </div>
      ),
    },
    { key: 'totalWins', header: 'V', align: 'right', cell: (o) => <span className="text-win">{o.totalWins}</span> },
    { key: 'totalLosses', header: 'D', align: 'right', cell: (o) => <span className="text-loss">{o.totalLosses}</span> },
    { key: 'winRate', header: 'Win %', align: 'right', cell: (o) => <WinRate value={o.winRate} /> },
    { key: 'weightedScore', header: 'Score', align: 'right', cell: (o) => <span className="font-display font-bold text-accent">{o.weightedScore.toFixed(1)}</span> },
    ...(tab === 'geral' ? [{ key: 'uniquePlayers', header: 'Jogadores', align: 'right' }] : []),
    { key: 'avgDowns', header: 'Downs', align: 'right' },
    { key: 'avgDamage', header: 'Damage', align: 'right', cell: (o) => fmtInt(o.avgDamage) },
    { key: 'totalMVPs', header: 'MVPs', align: 'right', cell: (o) => <span className="font-semibold text-gold">{o.totalMVPs}</span> },
  ]

  const chartData = rows.filter((o) => o.totalGames >= (tab === 'geral' ? 3 : 1)).slice(0, 12)

  return (
    <>
      <PageHeader
        eyebrow="Operadores"
        icon={Crosshair}
        title="Estatísticas de Operadores"
        description="Score = Win Rate 35% · Downs 35% · Damage 15% · Revives 10% · Captures 5% (por jogo)."
        actions={
          <Segmented
            options={[{ value: 'geral', label: 'Geral' }, { value: 'individual', label: 'Individual' }]}
            value={tab}
            onChange={setTab}
          />
        }
      />

      {tab === 'individual' && !player ? (
        <PlayerPicker players={players} onSelect={(n) => setParams({ vista: 'individual', jogador: n })} />
      ) : (
        <>
          {tab === 'individual' && (
            <div className="mb-6 flex items-center gap-3">
              <Avatar name={player} size="md" />
              <h2 className="font-display text-xl font-semibold">{player}</h2>
              <Button variant="ghost" size="sm" onClick={() => setParams({ vista: 'individual' })}>
                <X className="size-3.5" /> Trocar
              </Button>
            </div>
          )}

          {rows.length === 0 ? (
            <EmptyState icon={Crosshair} title="Sem dados de operadores" />
          ) : (
            <div className="space-y-6">
              {chartData.length > 1 && (
                <Card>
                  <CardHeader title="Score por operador" description={tab === 'geral' ? 'Operadores com 3+ jogos' : undefined} />
                  <CardBody className="h-64 pt-2">
                    <ResponsiveContainer>
                      <BarChart data={chartData} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#8c94a8', fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                        <YAxis tick={{ fill: '#5c647a', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={<ChartTooltip formatter={(v) => v.toFixed(1)} />} />
                        <Bar dataKey="weightedScore" name="Score" radius={[6, 6, 0, 0]} maxBarSize={42}>
                          {chartData.map((_, i) => (
                            <Cell key={i} fill={i === 0 ? 'var(--accent)' : 'color-mix(in oklab, var(--accent) 35%, transparent)'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>
              )}
              <DataTable columns={columns} rows={rows} rowKey={(o) => o.name} />
            </div>
          )}
        </>
      )}
    </>
  )
}
