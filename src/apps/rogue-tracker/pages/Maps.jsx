import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Map as MapIcon, ThumbsDown, ThumbsUp, X } from 'lucide-react'
import {
  Avatar, Button, DataTable, EmptyState, Meter, PageHeader, PageSkeleton, PlayerPicker, Segmented, WinRate,
} from '../../../components/ui'
import { SectionTitle } from '../../../components/ui/PageHeader'
import { cn } from '../../../lib/cn'
import { useRogueData } from '../data'
import { calculateGeneralMapStats, calculateIndividualMapStats, fmtInt } from '../utils/stats'

export default function Maps() {
  const { players, battles, mvpIndex, loading } = useRogueData()
  const [params, setParams] = useSearchParams()
  const tab = params.get('vista') || 'individual'
  const player = params.get('jogador')

  const general = useMemo(() => calculateGeneralMapStats(battles), [battles])
  const individual = useMemo(
    () => (player ? calculateIndividualMapStats(battles, mvpIndex, player) : []),
    [battles, mvpIndex, player],
  )

  if (loading) return <PageSkeleton />
  const setTab = (v) => setParams(v === 'individual' ? {} : { vista: v })

  return (
    <>
      <PageHeader
        eyebrow="Mapas"
        icon={MapIcon}
        title="Análise por Mapa"
        description={tab === 'geral' ? 'Os mapas mais jogados e o que acontece em cada um.' : 'Onde cada jogador brilha — e onde afunda.'}
        actions={
          <Segmented
            options={[{ value: 'individual', label: 'Individual' }, { value: 'geral', label: 'Geral' }]}
            value={tab}
            onChange={setTab}
          />
        }
      />

      {tab === 'geral' ? (
        <General stats={general} />
      ) : !player ? (
        <PlayerPicker players={players} onSelect={(n) => setParams({ jogador: n })} />
      ) : (
        <>
          <div className="mb-6 flex items-center gap-3">
            <Avatar name={player} size="md" />
            <h2 className="font-display text-xl font-semibold">{player}</h2>
            <Button variant="ghost" size="sm" onClick={() => setParams({})}>
              <X className="size-3.5" /> Trocar
            </Button>
          </div>
          {individual.length === 0 ? (
            <EmptyState icon={MapIcon} title="Este jogador ainda não jogou em nenhum mapa." />
          ) : (
            <Individual stats={individual} />
          )}
        </>
      )}
    </>
  )
}

function MapCard({ map, i, good, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
      className={cn(
        'rounded-2xl border p-4',
        good ? 'border-win/25 bg-gradient-to-br from-win/10 to-transparent' : 'border-loss/25 bg-gradient-to-br from-loss/10 to-transparent',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted">#{i + 1}</span>
        {good ? <ThumbsUp className="size-4 text-win" /> : <ThumbsDown className="size-4 text-loss" />}
      </div>
      <div className="mt-2 truncate font-display text-lg font-semibold">{map}</div>
      {children}
    </motion.div>
  )
}

function Individual({ stats }) {
  const columns = [
    { key: 'map', header: 'Mapa', sticky: true, cell: (m) => <span className="font-semibold">{m.map}</span> },
    { key: 'totalGames', header: 'Jogos', align: 'right' },
    { key: 'totalWins', header: 'V', align: 'right', cell: (m) => <span className="text-win">{m.totalWins}</span> },
    { key: 'totalLosses', header: 'D', align: 'right', cell: (m) => <span className="text-loss">{m.totalLosses}</span> },
    {
      key: 'winRate', header: 'Win %', align: 'right',
      cell: (m) => (
        <div className="flex items-center justify-end gap-2">
          <Meter value={m.winRate} tone={m.winRate >= 50 ? 'win' : 'loss'} className="hidden w-16 sm:block" />
          <WinRate value={m.winRate} />
        </div>
      ),
    },
    { key: 'avgDowns', header: 'Downs', align: 'right' },
    { key: 'avgDamage', header: 'Damage', align: 'right', cell: (m) => fmtInt(m.avgDamage) },
    { key: 'totalMVPs', header: 'MVPs', align: 'right', cell: (m) => <span className="font-semibold text-gold">{m.totalMVPs}</span> },
    { key: 'favoriteOperator', header: 'Operador', cell: (m) => <span className="text-muted">{m.favoriteOperator || '—'}</span> },
  ]
  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <SectionTitle>Melhores mapas</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            {stats.slice(0, 3).map((m, i) => (
              <MapCard key={m.map} map={m.map} i={i} good>
                <div className="mt-1 text-sm"><WinRate value={m.winRate} /> <span className="text-xs text-muted">· {m.totalGames}j</span></div>
              </MapCard>
            ))}
          </div>
        </div>
        <div>
          <SectionTitle>Piores mapas</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            {stats.slice(-3).reverse().map((m, i) => (
              <MapCard key={m.map} map={m.map} i={i}>
                <div className="mt-1 text-sm"><WinRate value={m.winRate} /> <span className="text-xs text-muted">· {m.totalGames}j</span></div>
              </MapCard>
            ))}
          </div>
        </div>
      </div>
      <DataTable columns={columns} rows={stats} rowKey={(m) => m.map} />
    </div>
  )
}

function General({ stats }) {
  if (stats.length === 0) return <EmptyState icon={MapIcon} title="Nenhum mapa com dados encontrado." />
  const max = stats[0]?.totalGames || 1
  const columns = [
    { key: 'map', header: 'Mapa', sticky: true, cell: (m) => <span className="font-semibold">{m.map}</span> },
    {
      key: 'totalGames', header: 'Jogos', align: 'right',
      cell: (m) => (
        <div className="flex items-center justify-end gap-2">
          <Meter value={m.totalGames} max={max} className="hidden w-20 sm:block" />
          <span>{m.totalGames}</span>
        </div>
      ),
    },
    { key: 'avgRounds', header: 'Média rondas', align: 'right' },
    { key: 'uniquePlayers', header: 'Jogadores', align: 'right' },
    { key: 'mostUsedOperator', header: 'Operador + usado', cell: (m) => m.mostUsedOperator || '—' },
    { key: 'mostUsedTeam', header: 'Equipa + usada', cell: (m) => <span className="text-xs text-muted">{m.mostUsedTeam || '—'}</span> },
  ]
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.slice(0, 3).map((m, i) => (
          <motion.div
            key={m.map}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-2xl border border-line bg-surface/70 p-5"
          >
            <span className="absolute -top-4 -right-1 font-display text-8xl font-black text-white/[0.03]">{i + 1}</span>
            <div className="text-xs font-semibold tracking-wider text-accent uppercase">Mais jogado #{i + 1}</div>
            <div className="mt-2 font-display text-2xl font-bold">{m.map}</div>
            <div className="mt-1 text-sm text-muted">{m.totalGames} jogos · {m.uniquePlayers} jogadores</div>
          </motion.div>
        ))}
      </div>
      <DataTable columns={columns} rows={stats} rowKey={(m) => m.map} />
    </div>
  )
}
