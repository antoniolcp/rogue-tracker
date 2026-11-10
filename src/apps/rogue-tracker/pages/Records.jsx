import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, Medal } from 'lucide-react'
import { Avatar, EmptyState, PageHeader, PageSkeleton } from '../../../components/ui'
import { useRogueData } from '../data'
import { battleDate, calculateRecords, fmtInt, RECORD_STATS } from '../utils/stats'

export default function Records() {
  const { battles, loading } = useRogueData()
  const records = useMemo(() => calculateRecords(battles), [battles])

  if (loading) return <PageSkeleton />
  if (battles.length === 0) return <EmptyState icon={Medal} title="Ainda não há jogos registados" />

  return (
    <>
      <PageHeader eyebrow="Hall of fame" icon={Medal} title="Melhor Performance" description="Os recordes absolutos num único jogo. Clica para ver o jogo." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RECORD_STATS.map(({ key, label }, i) => {
          const r = records[key]
          const inner = (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-[0.18em] text-gold uppercase">{label}</span>
                {r.battleId && <ArrowUpRight className="size-4 text-subtle transition-colors group-hover:text-fg" />}
              </div>
              <div className="mt-4 font-display text-6xl font-bold tracking-tight tabular">{key === 'damage' ? fmtInt(r.value) : r.value || 0}</div>
              <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                <Avatar name={r.player || '?'} size="sm" />
                <div className="min-w-0">
                  <div className="truncate font-medium">{r.player || '—'}</div>
                  {r.battle && (
                    <div className="text-xs text-muted">
                      {r.operator || '—'} · {r.battle.map} · {battleDate(r.battle).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </div>
              </div>
              <Medal className="absolute -right-6 -bottom-6 size-36 text-gold/[0.05]" />
            </>
          )
          return (
            <motion.div key={key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              {r.battleId ? (
                <Link to={`/rogue/jogos/${r.battleId}`} className="group relative block overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-gold/[0.07] to-surface p-6 transition-all hover:-translate-y-1 hover:border-gold/40">
                  {inner}
                </Link>
              ) : (
                <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6">{inner}</div>
              )}
            </motion.div>
          )
        })}
      </div>
    </>
  )
}
