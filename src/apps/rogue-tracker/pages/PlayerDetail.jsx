import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Area, AreaChart, CartesianGrid, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Crosshair, Crown, Flame, Gamepad2, Map, Percent, Trophy } from 'lucide-react'
import {
  Avatar, Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, PageSkeleton, StatTile,
} from '../../../components/ui'
import { cn } from '../../../lib/cn'
import { useRogueData } from '../data'
import { ChartTooltip } from '../components/ChartTooltip'
import {
  battleDate, calculateFavoriteOperator, calculateIndividualMapStats, countPlayerMVPs, fmtInt, fmtPct, playerHistory,
} from '../utils/stats'

const RADAR = [
  { key: 'winRate', label: 'Win %' },
  { key: 'avgDowns', label: 'Downs' },
  { key: 'avgDamage', label: 'Damage' },
  { key: 'avgRevives', label: 'Revives' },
  { key: 'avgCaptures', label: 'Captures' },
  { key: 'avgAssists', label: 'Assists' },
]

export default function PlayerDetail() {
  const { name: rawName } = useParams()
  const name = decodeURIComponent(rawName)
  const { players, battles, mvpIndex, loading } = useRogueData()
  const player = players.find((p) => p.name === name)

  const history = useMemo(() => playerHistory(battles, mvpIndex, name), [battles, mvpIndex, name])
  const mvps = useMemo(() => countPlayerMVPs(mvpIndex, name), [mvpIndex, name])
  const favOp = useMemo(() => player?.favoriteOperator || calculateFavoriteOperator(battles, name), [battles, name, player])
  const bestMap = useMemo(() => calculateIndividualMapStats(battles, mvpIndex, name).find((m) => m.totalGames >= 2), [battles, mvpIndex, name])

  const trend = useMemo(
    () =>
      [...history].reverse().slice(-25).map((h, i) => ({
        i: i + 1,
        label: battleDate(h.battle).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }) + ` · ${h.battle.map || '?'}`,
        downs: h.player?.downs || 0,
        damage: h.player?.damage || 0,
      })),
    [history],
  )

  const radar = useMemo(() => {
    if (!player) return []
    const active = players.filter((p) => (p.totalGames || 0) > 0)
    return RADAR.map(({ key, label }) => {
      const max = Math.max(...active.map((p) => p[key] || 0), 1)
      const avg = active.reduce((s, p) => s + (p[key] || 0), 0) / (active.length || 1)
      return { label, player: Math.round(((player[key] || 0) / max) * 100), group: Math.round((avg / max) * 100) }
    })
  }, [player, players])

  if (loading) return <PageSkeleton />
  if (!player) {
    return <EmptyState title="Jogador não encontrado" action={<Link to="/rogue/jogadores" className="text-accent">Ver todos os jogadores</Link>} />
  }

  const form = history.slice(0, 10)

  return (
    <>
      <PageHeader
        backTo="/rogue/jogadores"
        backLabel="Jogadores"
        title={
          <span className="flex items-center gap-4">
            <Avatar name={player.name} size="lg" />
            <span className="min-w-0 truncate">{player.name}</span>
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {favOp && <Badge tone="accent"><Crosshair className="size-3" /> {favOp}</Badge>}
            {bestMap && <Badge tone="win"><Map className="size-3" /> {bestMap.map} ({bestMap.winRate}%)</Badge>}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile index={0} label="Jogos" value={player.totalGames || 0} icon={Gamepad2} />
        <StatTile index={1} label="Vitórias" value={player.totalWins || 0} tone="win" icon={Trophy} />
        <StatTile index={2} label="Derrotas" value={player.totalLosses || 0} tone="loss" />
        <StatTile index={3} label="Win rate" value={fmtPct(player.winRate)} icon={Percent} tone="accent" />
        <StatTile index={4} label="MVPs" value={mvps} icon={Crown} tone="gold" className="col-span-2 md:col-span-1" />
      </div>

      {/* Form */}
      {form.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted uppercase">
            <Flame className="size-3.5" /> Forma recente
          </span>
          {form.map((h) => (
            <Link
              key={h.battle.id}
              to={`/rogue/jogos/${h.battle.id}`}
              title={`${h.battle.map} · ${h.won ? 'Vitória' : 'Derrota'}${h.isMVP ? ' · MVP' : ''}`}
              className={cn(
                'relative grid size-8 place-items-center rounded-lg text-xs font-bold ring-1 ring-inset transition-transform hover:scale-110',
                h.won ? 'bg-win/15 text-win ring-win/30' : 'bg-loss/15 text-loss ring-loss/30',
              )}
            >
              {h.won ? 'V' : 'D'}
              {h.isMVP && <Crown className="absolute -top-1.5 -right-1.5 size-3.5 text-gold" />}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Evolução" description={`Downs e damage nos últimos ${trend.length} jogos`} />
          <CardBody className="h-72 pt-2">
            {trend.length > 1 ? (
              <ResponsiveContainer>
                <AreaChart data={trend} margin={{ top: 10, right: 4, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gDowns" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.4 }} />
                      <stop offset="100%" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} />
                    </linearGradient>
                    <linearGradient id="gDmg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" style={{ stopColor: 'var(--accent-2)', stopOpacity: 0.3 }} />
                      <stop offset="100%" style={{ stopColor: 'var(--accent-2)', stopOpacity: 0 }} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="i" tick={{ fill: '#5c647a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="d" tick={{ fill: '#5c647a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="dmg" orientation="right" hide />
                  <Tooltip content={<ChartTooltip />} labelFormatter={(_, p) => p?.[0]?.payload?.label} />
                  <Area yAxisId="dmg" type="monotone" dataKey="damage" name="Damage" stroke="var(--accent-2)" fill="url(#gDmg)" strokeWidth={2} />
                  <Area yAxisId="d" type="monotone" dataKey="downs" name="Downs" stroke="var(--accent)" fill="url(#gDowns)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted">Precisa de pelo menos 2 jogos.</div>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Perfil" description="Médias por ronda vs. média do grupo" />
          <CardBody className="h-72 pt-0">
            <ResponsiveContainer>
              <RadarChart data={radar} outerRadius="72%">
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="label" tick={{ fill: '#8c94a8', fontSize: 11 }} />
                <Radar name="Grupo" dataKey="group" stroke="#5c647a" fill="#5c647a" fillOpacity={0.15} />
                <Radar name={player.name} dataKey="player" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.3} strokeWidth={2} />
                <Tooltip content={<ChartTooltip formatter={(v) => `${v}%`} />} />
              </RadarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <StatList
          title="Totais"
          rows={[
            ['Eliminações', fmtInt(player.totalElims)],
            ['Downs', fmtInt(player.totalDowns)],
            ['Assists', fmtInt(player.totalAssists)],
            ['Revives', fmtInt(player.totalRevives)],
            ['Damage', fmtInt(player.totalDamage)],
            ['Captures', fmtInt(player.totalCaptures)],
          ]}
        />
        <StatList
          title="Médias por ronda"
          rows={[
            ['Elims', player.avgElims ?? 0],
            ['Downs', player.avgDowns ?? 0],
            ['Assists', player.avgAssists ?? 0],
            ['Revives', player.avgRevives ?? 0],
            ['Damage', fmtInt(player.avgDamage)],
            ['Captures', player.avgCaptures ?? 0],
          ]}
        />
        <StatList
          title="Melhores performances"
          accent
          rows={[
            ['Eliminações', player.bestElims ?? 0],
            ['Downs', player.bestDowns ?? 0],
            ['Assists', player.bestAssists ?? 0],
            ['Revives', player.bestRevives ?? 0],
            ['Damage', fmtInt(player.bestDamage)],
            ['Captures', player.bestCaptures ?? 0],
          ]}
        />
      </div>
    </>
  )
}

function StatList({ title, rows, accent }) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody className="pt-3">
        <dl className="divide-y divide-line">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2.5 text-sm">
              <dt className="text-muted">{k}</dt>
              <dd className={cn('font-semibold tabular', accent && 'text-gold')}>{v}</dd>
            </div>
          ))}
        </dl>
      </CardBody>
    </Card>
  )
}
