import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Crown, Info, Trophy } from 'lucide-react'
import {
  Avatar, DataTable, EmptyState, PageHeader, PageSkeleton, Rank, Segmented, Select, WinRate,
} from '../../../components/ui'
import { cn } from '../../../lib/cn'
import { useRogueData } from '../data'
import { calculatePlayerRanking, calculateSpecificRanking, fmtInt, RANKING_WEIGHTS } from '../utils/stats'

const TABS = [
  { value: 'overall', label: 'Geral' },
  { value: 'winrate', label: 'Win Rate' },
  { value: 'downs', label: 'Downs' },
  { value: 'damage', label: 'Damage' },
  { value: 'revives', label: 'Revives' },
  { value: 'captures', label: 'Captures' },
  { value: 'assists', label: 'Assists' },
]

const scoreLabel = { overall: 'Score', winrate: 'Win Rate', downs: 'Downs', damage: 'Damage', revives: 'Revives', captures: 'Captures', assists: 'Assists' }

const formatScore = (tab, p) =>
  tab === 'overall' ? p.score.toFixed(1)
    : tab === 'winrate' ? `${Math.round(p.winRate)}%`
      : tab === 'damage' ? fmtInt(p.avgDamage)
        : p.score.toFixed(1)

export default function Ranking() {
  const { players, battles, mvpIndex, loading } = useRogueData()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overall')
  const [minGames, setMinGames] = useState(1)
  const [viewMode, setViewMode] = useState('round')

  const ranking = useMemo(() => {
    const args = { players, battles, mvpIndex, minGames, viewMode }
    return tab === 'overall' ? calculatePlayerRanking(args) : calculateSpecificRanking({ ...args, metric: tab })
  }, [players, battles, mvpIndex, minGames, viewMode, tab])

  if (loading) return <PageSkeleton />

  const per = viewMode === 'round' ? '/ronda' : '/jogo'
  const columns = [
    { key: 'pos', header: '#', cell: (p) => <Rank value={p.pos} />, sortValue: (p) => -p.pos },
    {
      key: 'name', header: 'Jogador', sticky: true,
      cell: (p) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={p.name} size="sm" />
          <span className="font-medium">{p.name}</span>
        </div>
      ),
    },
    { key: 'score', header: scoreLabel[tab], align: 'right', cell: (p) => <span className="font-display text-base font-bold text-accent">{formatScore(tab, p)}</span> },
    { key: 'winRate', header: 'Win %', align: 'right', cell: (p) => <WinRate value={p.winRate} /> },
    { key: 'totalGames', header: 'Jogos', align: 'right' },
    { key: 'avgDowns', header: `Downs${per}`, align: 'right' },
    { key: 'avgDamage', header: `Dmg${per}`, align: 'right', cell: (p) => fmtInt(p.avgDamage) },
    { key: 'avgRevives', header: `Rev${per}`, align: 'right' },
    { key: 'avgCaptures', header: `Cap${per}`, align: 'right' },
    { key: 'avgAssists', header: `Ast${per}`, align: 'right', cell: (p) => p.avgAssists || 0 },
    { key: 'totalMVPs', header: 'MVPs', align: 'right', cell: (p) => <span className="font-semibold text-gold">{p.totalMVPs}</span> },
    { key: 'favoriteOperator', header: 'Operador', cell: (p) => <span className="text-muted">{p.favoriteOperator || '—'}</span> },
  ]

  const podium = ranking.slice(0, 3)

  return (
    <>
      <PageHeader eyebrow="Classificação" icon={Trophy} title="Ranking de Jogadores" description={`${ranking.length} jogadores com ${minGames}+ jogos.`} />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented options={TABS} value={tab} onChange={setTab} />
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            size="sm"
            options={[{ value: 'round', label: 'Por ronda' }, { value: 'game', label: 'Por jogo' }]}
            value={viewMode}
            onChange={setViewMode}
          />
          <Select value={minGames} onChange={(e) => setMinGames(parseInt(e.target.value))} className="h-9" wrapperClassName="w-36">
            {[1, 5, 10, 20].map((n) => <option key={n} value={n}>{n}+ jogos</option>)}
          </Select>
        </div>
      </div>

      {ranking.length === 0 ? (
        <EmptyState icon={Trophy} title="Nenhum jogador com os critérios selecionados" />
      ) : (
        <>
          {/* Podium */}
          <div className="mb-8 grid grid-cols-3 items-end gap-2 sm:gap-4">
            {[1, 0, 2].map((idx) => {
              const p = podium[idx]
              if (!p) return <div key={idx} />
              const tone = ['gold', 'silver', 'bronze'][idx]
              const h = ['h-52 sm:h-60', 'h-44 sm:h-52', 'h-44 sm:h-48'][idx]
              return (
                <motion.button
                  key={p.name}
                  type="button"
                  onClick={() => navigate(`/rogue/jogadores/${encodeURIComponent(p.name)}`)}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + (2 - idx) * 0.08, type: 'spring', bounce: 0.3 }}
                  className={cn(
                    'group relative flex cursor-pointer flex-col items-center justify-end overflow-hidden rounded-2xl border p-3 text-center sm:p-5',
                    h,
                    tone === 'gold' && 'border-gold/40 bg-gradient-to-t from-gold/20 to-gold/[0.02]',
                    tone === 'silver' && 'border-silver/25 bg-gradient-to-t from-silver/10 to-transparent',
                    tone === 'bronze' && 'border-bronze/30 bg-gradient-to-t from-bronze/15 to-transparent',
                  )}
                >
                  {idx === 0 && <Crown className="absolute top-3 size-6 text-gold drop-shadow-[0_0_12px_var(--gold)]" />}
                  <Avatar name={p.name} size="md" className="mb-2 transition-transform group-hover:scale-110" />
                  <div className="w-full truncate text-sm font-semibold sm:text-base">{p.name}</div>
                  <div className={cn('font-display text-2xl font-bold tabular sm:text-3xl', { gold: 'text-gold', silver: 'text-silver', bronze: 'text-bronze' }[tone])}>{formatScore(tab, p)}</div>
                  <div className="text-[11px] text-muted sm:text-xs">{p.totalGames} jogos · {Math.round(p.winRate)}%</div>
                </motion.button>
              )
            })}
          </div>

          {tab === 'overall' && (
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted">
              <Info className="size-3.5" /> Score =
              {RANKING_WEIGHTS.map((w) => (
                <span key={w.label} className="rounded-md bg-white/5 px-2 py-0.5 ring-1 ring-line">
                  {w.label} <span className="font-semibold text-fg">{w.pct}%</span>
                </span>
              ))}
            </div>
          )}

          <DataTable
            columns={columns}
            rows={ranking.map((p, i) => ({ ...p, pos: i + 1 }))}
            rowKey={(r) => r.name}
            onRowClick={(p) => navigate(`/rogue/jogadores/${encodeURIComponent(p.name)}`)}
          />
        </>
      )}
    </>
  )
}
