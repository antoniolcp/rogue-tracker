import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Crown, Trophy } from 'lucide-react'
import { Avatar, DataTable, EmptyState, PageHeader, PageSkeleton, Rank, Segmented } from '../../../components/ui'
import { cn } from '../../../lib/cn'
import { useGtaData } from '../data'
import { computeIndividualRanking, computeTeamRanking, sortIndividual } from '../utils/stats'

const TABS = [
  { value: 'total', label: 'Pontos totais' },
  { value: 'ppr', label: 'Média (PPR)' },
  { value: 'teams', label: 'Equipas' },
]

export default function GtaRanking() {
  const { players, races, loading } = useGtaData()
  const [tab, setTab] = useState('total')

  const individual = useMemo(() => computeIndividualRanking(players, races), [players, races])
  const teams = useMemo(() => computeTeamRanking(players, races), [players, races])

  if (loading) return <PageSkeleton />

  const rows = (tab === 'teams' ? teams : sortIndividual(individual, tab)).map((p, i) => ({ ...p, pos: i + 1 }))

  const name = {
    key: 'name', header: 'Piloto', sticky: true,
    cell: (p) => (
      <div className="flex items-center gap-2.5">
        <Avatar name={p.name} size="sm" />
        <span className="font-medium">{p.name}</span>
        {p.pos === 1 && <Crown className="size-3.5 text-gold" />}
      </div>
    ),
  }
  const pos = { key: 'pos', header: '#', cell: (p) => <Rank value={p.pos} />, sortValue: (p) => -p.pos }
  const hi = (on) => (on ? 'font-display text-base font-bold text-accent' : 'text-fg/80')

  const columns = tab === 'teams'
    ? [
      pos, name,
      { key: 'teamChampionships', header: 'Campeonatos', align: 'right', cell: (p) => <span className={p.teamChampionships ? 'font-semibold text-gold' : 'text-subtle'}>{p.teamChampionships}</span> },
      { key: 'teamRaces', header: 'Corridas', align: 'right' },
      { key: 'teamWins', header: 'Vitórias', align: 'right' },
      { key: 'teamPoints', header: 'Pontos equipa', align: 'right', cell: (p) => <span className="font-semibold text-accent">{p.teamPoints}</span> },
      { key: 'ppr', header: 'PPR equipa', align: 'right', cell: (p) => p.ppr.toFixed(2) },
    ]
    : [
      pos, name,
      { key: 'championships', header: 'Campeonatos', align: 'right', cell: (p) => <span className={p.championships ? 'font-semibold text-gold' : 'text-subtle'}>{p.championships}</span> },
      { key: 'races', header: 'Corridas', align: 'right', cell: (p) => p.stats.races, sortValue: (p) => p.stats.races },
      { key: 'wins', header: 'Vitórias', align: 'right', cell: (p) => p.stats.wins, sortValue: (p) => p.stats.wins },
      { key: 'totalPoints', header: 'Total', align: 'right', cell: (p) => <span className={hi(tab === 'total')}>{p.stats.totalPoints}</span>, sortValue: (p) => p.stats.totalPoints },
      { key: 'ppr', header: 'PPR', align: 'right', cell: (p) => <span className={hi(tab === 'ppr')}>{p.ppr.toFixed(2)}</span> },
    ]

  const podium = rows.slice(0, 3)
  const value = (p) => (tab === 'teams' ? `${p.teamChampionships} 🏆` : tab === 'total' ? p.stats.totalPoints : p.ppr.toFixed(2))
  const sub = (p) => (tab === 'teams' ? `${p.teamWins} vitórias · ${p.ppr.toFixed(1)} PPR` : `${p.stats.races} corridas · ${p.championships} 🏆`)

  return (
    <>
      <PageHeader
        eyebrow="Ranking global"
        icon={Trophy}
        title="Classificação"
        description={tab === 'teams'
          ? 'Crédito por equipa: campeonatos e corridas ganhas pela equipa (cor) de cada piloto.'
          : 'PPR = pontos por corrida.'}
        actions={<Segmented options={TABS} value={tab} onChange={setTab} />}
      />

      {rows.length === 0 ? (
        <EmptyState icon={Trophy} title="Ainda sem corridas" />
      ) : (
        <>
          <div className="mb-8 grid grid-cols-3 items-end gap-2 sm:gap-4">
            {[1, 0, 2].map((idx) => {
              const p = podium[idx]
              if (!p) return <div key={idx} />
              return (
                <motion.div
                  key={`${tab}-${p.id}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + (2 - idx) * 0.08, type: 'spring', bounce: 0.3 }}
                  className={cn(
                    'relative flex flex-col items-center justify-end overflow-hidden rounded-2xl border p-3 text-center sm:p-5',
                    ['h-52 sm:h-60', 'h-44 sm:h-52', 'h-44 sm:h-48'][idx],
                    idx === 0 && 'border-gold/40 bg-gradient-to-t from-gold/20 to-transparent',
                    idx === 1 && 'border-silver/25 bg-gradient-to-t from-silver/10 to-transparent',
                    idx === 2 && 'border-bronze/30 bg-gradient-to-t from-bronze/15 to-transparent',
                  )}
                >
                  {idx === 0 && <Crown className="absolute top-3 size-6 text-gold" />}
                  <Avatar name={p.name} size="md" className="mb-2" />
                  <div className="w-full truncate text-sm font-semibold sm:text-base">{p.name}</div>
                  <div className={cn('font-display text-2xl font-bold tabular sm:text-3xl', ['text-gold', 'text-silver', 'text-bronze'][idx])}>{value(p)}</div>
                  <div className="text-[11px] text-muted sm:text-xs">{sub(p)}</div>
                </motion.div>
              )
            })}
          </div>
          <DataTable key={tab} columns={columns} rows={rows} rowKey={(p) => p.id} />
        </>
      )}
    </>
  )
}
