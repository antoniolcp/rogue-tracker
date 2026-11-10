import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Crown, Handshake, Swords } from 'lucide-react'
import { Avatar, Card, CardBody, CardHeader, EmptyState, Label, PageHeader, PageSkeleton, Select } from '../../../components/ui'
import { cn } from '../../../lib/cn'
import { useRogueData } from '../data'
import { ChartTooltip } from '../components/ChartTooltip'
import { calculateComparisonStats, COMPARISON_METRICS, fmtInt } from '../utils/stats'

const B = '#60a5fa' // cor do jogador 2

export default function Compare() {
  const { players, battles, mvpIndex, loading } = useRogueData()
  const [params, setParams] = useSearchParams()
  const p1 = params.get('a') || ''
  const p2 = params.get('b') || ''
  const minGames = parseInt(params.get('min') || '1')

  const set = (k, v) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    setParams(next, { replace: true })
  }

  const s1 = useMemo(() => calculateComparisonStats(battles, mvpIndex, p1, minGames), [battles, mvpIndex, p1, minGames])
  const s2 = useMemo(() => calculateComparisonStats(battles, mvpIndex, p2, minGames), [battles, mvpIndex, p2, minGames])

  const sortedPlayers = useMemo(() => [...players].sort((a, b) => a.name.localeCompare(b.name)), [players])

  if (loading) return <PageSkeleton />

  const both = s1 && s2
  const winner = both ? (s1.score > s2.score + 2 ? s1.name : s2.score > s1.score + 2 ? s2.name : null) : null

  const radar = both
    ? COMPARISON_METRICS.map((m) => {
      const max = Math.max(s1[m.key], s2[m.key], 0.0001)
      return { label: m.label.split(' ')[0], a: Math.round((s1[m.key] / max) * 100), b: Math.round((s2[m.key] / max) * 100) }
    })
    : []

  return (
    <>
      <PageHeader eyebrow="Frente a frente" icon={Swords} title="Comparação 1v1" description="Médias por jogo. Vence quem tiver mais de 2 pontos de vantagem no score combinado." />

      <Card className="mb-8">
        <CardBody className="grid items-end gap-4 md:grid-cols-[1fr_auto_1fr_auto]">
          <div>
            <Label htmlFor="p1">Jogador 1</Label>
            <Select id="p1" value={p1} onChange={(e) => set('a', e.target.value)}>
              <option value="">Escolhe um jogador</option>
              {sortedPlayers.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </Select>
          </div>
          <div className="hidden pb-2 font-display text-sm font-bold text-subtle md:block">VS</div>
          <div>
            <Label htmlFor="p2">Jogador 2</Label>
            <Select id="p2" value={p2} onChange={(e) => set('b', e.target.value)}>
              <option value="">Escolhe um jogador</option>
              {sortedPlayers.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="min">Jogos mínimos</Label>
            <Select id="min" value={minGames} onChange={(e) => set('min', e.target.value === '1' ? '' : e.target.value)} wrapperClassName="md:w-32">
              {[1, 5, 10, 20].map((n) => <option key={n} value={n}>{n}+</option>)}
            </Select>
          </div>
        </CardBody>
      </Card>

      {!both ? (
        <EmptyState
          icon={Swords}
          title={p1 && p2 ? 'Um dos jogadores não tem jogos suficientes' : 'Seleciona dois jogadores'}
          description={p1 && p2 ? 'Baixa o mínimo de jogos para comparar.' : 'Escolhe dois jogadores acima para ver quem é melhor.'}
        />
      ) : (
        <div className="space-y-6">
          {/* Verdict */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-3xl border border-line bg-gradient-to-r from-accent/10 via-surface to-[#60a5fa]/10 p-6"
          >
            <Side stats={s1} color="var(--accent)" isWinner={winner === s1.name} />
            <div className="text-center">
              {winner ? (
                <Crown className="mx-auto size-7 text-gold" />
              ) : (
                <Handshake className="mx-auto size-7 text-muted" />
              )}
              <div className="mt-1 text-xs font-semibold tracking-wider text-muted uppercase">
                {winner ? 'Vencedor' : 'Empate técnico'}
              </div>
            </div>
            <Side stats={s2} color={B} isWinner={winner === s2.name} align="right" />
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Tug-of-war bars */}
            <Card className="lg:col-span-3">
              <CardHeader title="Estatística a estatística" />
              <CardBody className="space-y-4">
                {COMPARISON_METRICS.map((m) => {
                  const a = s1[m.key] || 0
                  const b = s2[m.key] || 0
                  const total = a + b || 1
                  const fmt = (v) => (m.round ? fmtInt(v) : v) + (m.suffix || '')
                  const sig = Math.abs(a - b) > 0.1
                  return (
                    <div key={m.key}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className={cn('font-semibold tabular', sig && a > b ? 'text-accent' : 'text-muted')}>{fmt(a)}</span>
                        <span className="text-xs text-muted">{m.label}</span>
                        <span className={cn('font-semibold tabular', sig && b > a ? 'text-[#60a5fa]' : 'text-muted')}>{fmt(b)}</span>
                      </div>
                      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(a / total) * 100}%` }} transition={{ duration: 0.6 }} className="rounded-l-full bg-accent" />
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(b / total) * 100}%` }} transition={{ duration: 0.6 }} className="rounded-r-full bg-[#60a5fa]" />
                      </div>
                    </div>
                  )
                })}
              </CardBody>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader title="Perfil" />
              <CardBody className="h-80 pt-0">
                <ResponsiveContainer>
                  <RadarChart data={radar} outerRadius="72%">
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="label" tick={{ fill: '#8c94a8', fontSize: 11 }} />
                    <Radar name={s1.name} dataKey="a" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.25} strokeWidth={2} />
                    <Radar name={s2.name} dataKey="b" stroke={B} fill={B} fillOpacity={0.2} strokeWidth={2} />
                    <Tooltip content={<ChartTooltip formatter={(v) => `${v}%`} />} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[s1, s2].map((s, i) => (
              <Card key={s.name}>
                <CardBody className="grid grid-cols-3 gap-4 text-sm">
                  <Mini label="Jogos" value={s.totalGames} />
                  <Mini label="Operador fav." value={s.favoriteOperator || '—'} />
                  <Mini label="Mapa fav." value={s.favoriteMap || '—'} />
                  <div className="col-span-3 text-xs" style={{ color: i === 0 ? 'var(--accent)' : B }}>{s.name}</div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function Side({ stats, color, isWinner, align = 'left' }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3', align === 'right' && 'flex-row-reverse text-right')}>
      <Avatar name={stats.name} size="lg" color={color} className={cn(isWinner && 'ring-2 ring-gold')} />
      <div className="min-w-0">
        <div className="truncate font-display text-lg font-bold md:text-xl">{stats.name}</div>
        <div className="font-display text-3xl font-bold tabular" style={{ color }}>{stats.score.toFixed(1)}</div>
      </div>
    </div>
  )
}

function Mini({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted">{label}</div>
      <div className="truncate font-semibold">{value}</div>
    </div>
  )
}
