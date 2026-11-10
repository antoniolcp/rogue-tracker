import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Crown, Flag, Trophy } from 'lucide-react'
import { Avatar, Card, CardBody, CardHeader, EmptyState, PageHeader, PageSkeleton, Segmented } from '../../../components/ui'
import { cn } from '../../../lib/cn'
import { ChartTooltip } from '../../rogue-tracker/components/ChartTooltip'
import { useGtaData } from '../data'
import { computePlaylistStandings, displayColor, formatPlaylistDate, textOn } from '../utils/stats'

const FALLBACK = ['#ffb800', '#22d3ee', '#f472b6', '#34d399', '#a78bfa', '#fb923c', '#60a5fa', '#f87171']

export default function ChampionshipDetail() {
  const { id } = useParams()
  const { playlists, races, loading } = useGtaData()
  const [tab, setTab] = useState('individual')

  const playlist = playlists.find((p) => p.id === id)
  const { races: pRaces, individual, teams } = useMemo(
    () => computePlaylistStandings(races.filter((r) => r.playlistId === id)),
    [races, id],
  )

  const rows = tab === 'individual' ? individual : teams

  // Pontos acumulados por corrida (top 8)
  const chart = useMemo(() => {
    const series = rows.slice(0, 8)
    return pRaces.map((_, rIdx) => {
      const point = { race: `C${rIdx + 1}` }
      series.forEach((s, si) => {
        let sum = 0
        for (let k = 0; k <= rIdx; k++) sum += s.races[k] || 0
        point[`s${si}`] = sum
      })
      return point
    })
  }, [rows, pRaces])

  if (loading) return <PageSkeleton />
  if (!playlist) return <EmptyState icon={Flag} title="Campeonato não encontrado" action={<Link to="/gta/campeonatos" className="text-accent">Voltar</Link>} />

  const leader = rows[0]
  const leaderName = leader ? (tab === 'individual' ? leader.name : leader.players.join(' & ')) : ''
  const leaderColor = displayColor(leader?.teamColor || leader?.color) || 'var(--accent)'
  const seriesColor = (s, i) => {
    const c = displayColor(s.teamColor || s.color)
    // várias linhas com a mesma cor de equipa ficam indistinguíveis no modo individual
    return tab === 'teams' && c ? c : FALLBACK[i % FALLBACK.length]
  }

  return (
    <>
      <PageHeader
        backTo="/gta/campeonatos"
        backLabel="Campeonatos"
        eyebrow={formatPlaylistDate(playlist.date)}
        title={playlist.name}
        description={`${pRaces.length} corridas · ${individual.length} pilotos`}
        actions={<Segmented options={[{ value: 'individual', label: 'Individual' }, { value: 'teams', label: 'Equipas' }]} value={tab} onChange={setTab} />}
      />

      {leader && (
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8 flex items-center gap-5 overflow-hidden rounded-2xl border p-5"
          style={{
            borderColor: `color-mix(in oklab, ${leaderColor} 40%, transparent)`,
            background: `linear-gradient(110deg, color-mix(in oklab, ${leaderColor} 18%, transparent), transparent 70%)`,
          }}
        >
          <Avatar name={leaderName} size="lg" color={leaderColor}>{tab === 'teams' ? 'T' : undefined}</Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-gold uppercase">
              <Crown className="size-3.5" /> {tab === 'individual' ? 'Vencedor do campeonato' : 'Vencedores do campeonato'}
            </div>
            <div className="truncate font-display text-2xl font-bold" style={{ color: leaderColor }}>{leaderName}</div>
            <div className="text-sm text-muted">{leader.total} pontos</div>
          </div>
          <Trophy className="absolute -right-4 -bottom-6 size-32 text-gold/10" />
        </motion.div>
      )}

      {pRaces.length > 1 && (
        <Card className="mb-6">
          <CardHeader title="Pontos acumulados" description={rows.length > 8 ? 'Top 8' : undefined} />
          <CardBody className="h-72 pt-2">
            <ResponsiveContainer>
              <LineChart data={chart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="race" tick={{ fill: '#8c94a8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5c647a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                {rows.slice(0, 8).map((s, i) => (
                  <Line
                    key={i}
                    type="monotone"
                    dataKey={`s${i}`}
                    name={tab === 'individual' ? s.name : s.players.join(' & ')}
                    stroke={seriesColor(s, i)}
                    strokeWidth={i === 0 ? 3 : 1.75}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {/* Standings */}
      {rows.length === 0 ? (
        <EmptyState icon={Flag} title="Este campeonato não tem corridas registadas." />
      ) : (
      <div className="scrollbar-thin overflow-x-auto rounded-2xl border border-line bg-surface/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2/60 text-[11px] tracking-wider text-muted uppercase">
              <th className="px-3 py-2.5 text-left font-semibold">#</th>
              <th className="sticky left-0 z-10 bg-surface-2 px-3 py-2.5 text-left font-semibold">{tab === 'individual' ? 'Piloto' : 'Equipa'}</th>
              {pRaces.map((_, i) => <th key={i} className="px-2 py-2.5 text-center font-semibold">C{i + 1}</th>)}
              <th className="px-3 py-2.5 text-right font-semibold text-accent">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const color = r.teamColor || r.color
              const vis = displayColor(color)
              const label = tab === 'individual' ? r.name : r.players.join(' & ')
              const maxPerRace = pRaces.map((_, k) => Math.max(...rows.map((x) => x.races[k] || 0)))
              return (
                <motion.tr
                  key={label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.025, 0.4) }}
                  className="group border-b border-line last:border-0 hover:bg-white/[0.025]"
                  style={vis ? { boxShadow: `inset 3px 0 0 ${vis}` } : undefined}
                >
                  <td className="px-3 py-3">
                    <span
                      className="inline-grid size-7 place-items-center rounded-lg text-xs font-bold tabular ring-1 ring-white/15 ring-inset"
                      style={color ? { background: color, color: textOn(color) } : { background: 'rgba(255,255,255,0.06)' }}
                    >
                      {i + 1}º
                    </span>
                  </td>
                  <td className="sticky left-0 z-10 bg-surface px-3 py-3 whitespace-nowrap group-hover:bg-surface-2">
                    <span className={cn('font-medium', i === 0 && 'font-bold')} style={{ color: vis }}>{label}</span>
                    {i === 0 && <Crown className="ml-1.5 inline size-3.5 text-gold" />}
                  </td>
                  {pRaces.map((_, k) => {
                    const v = r.races[k]
                    const best = v !== undefined && v > 0 && v === maxPerRace[k]
                    return (
                      <td key={k} className={cn('px-2 py-3 text-center tabular', best ? 'font-semibold text-accent' : 'text-fg/75')}>
                        {v !== undefined ? v : tab === 'teams' ? 0 : '–'}
                      </td>
                    )
                  })}
                  <td className="px-3 py-3 text-right font-display text-base font-bold tabular" style={{ color: vis || 'var(--accent)' }}>{r.total}</td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
      )}
    </>
  )
}
