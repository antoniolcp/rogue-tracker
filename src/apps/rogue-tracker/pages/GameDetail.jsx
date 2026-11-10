import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Crown, MapPin, Trophy } from 'lucide-react'
import { Avatar, Badge, EmptyState, PageHeader, PageSkeleton } from '../../../components/ui'
import { cn } from '../../../lib/cn'
import { useRogueData } from '../data'
import { battleDate, fmtInt } from '../utils/stats'

const COLS = [
  { key: 'elims', label: 'Elims', short: 'K' },
  { key: 'downs', label: 'Downs', short: 'D' },
  { key: 'assists', label: 'Assists', short: 'A' },
  { key: 'revives', label: 'Revives', short: 'R' },
  { key: 'damage', label: 'Damage', short: 'DMG' },
  { key: 'captures', label: 'Captures', short: 'CP' },
]

export default function GameDetail() {
  const { id } = useParams()
  const { battles, mvpIndex, loading } = useRogueData()
  const battle = useMemo(() => battles.find((b) => b.id === id), [battles, id])

  if (loading) return <PageSkeleton />
  if (!battle) {
    return <EmptyState title="Jogo não encontrado" description="Este jogo pode ter sido removido." action={<Link to="/rogue/jogos" className="text-accent">Voltar à lista</Link>} />
  }

  const mvp = mvpIndex.get(battle.id)
  const d = battleDate(battle)
  const t1Won = battle.result === 'win'
  const maxOf = (k) => Math.max(...[...battle.team1, ...battle.team2].map((p) => p[k] || 0))

  return (
    <>
      <PageHeader
        backTo="/rogue/jogos"
        backLabel="Lista de jogos"
        eyebrow={d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
        title={
          <span className="flex items-center gap-3">
            <MapPin className="size-7 text-accent" />
            {battle.map || 'Mapa desconhecido'}
          </span>
        }
      />

      {/* Scoreboard header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-3xl border border-line bg-gradient-to-r from-surface-2 via-surface to-surface-2 p-6 md:p-8"
      >
        <TeamBadge label="Team 1" won={t1Won} />
        <div className="flex items-center gap-4 font-display text-5xl font-bold tabular md:text-7xl">
          <span className={t1Won ? 'text-fg' : 'text-subtle'}>{battle.team1Rounds || 0}</span>
          <span className="text-2xl text-subtle">:</span>
          <span className={!t1Won ? 'text-fg' : 'text-subtle'}>{battle.team2Rounds || 0}</span>
        </div>
        <TeamBadge label="Team 2" won={!t1Won} align="right" />
      </motion.div>

      {/* MVP */}
      {mvp && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="relative mb-8 flex items-center gap-5 overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-r from-gold/15 via-gold/5 to-transparent p-5"
        >
          <Avatar name={mvp.name} size="lg" color="var(--gold)" />
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-gold uppercase">
              <Crown className="size-3.5" /> MVP do jogo
            </div>
            <Link to={`/rogue/jogadores/${encodeURIComponent(mvp.name)}`} className="font-display text-2xl font-bold hover:underline">
              {mvp.name}
            </Link>
            <div className="text-sm text-muted">
              {mvp.operator || 'Sem operador'} · {mvp.downs || 0} downs · {fmtInt(mvp.damage)} dmg
            </div>
          </div>
          <Trophy className="absolute -right-4 -bottom-6 size-32 text-gold/10" />
        </motion.div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        {[battle.team1, battle.team2].map((team, ti) => {
          const won = ti === 0 ? t1Won : !t1Won
          return (
            <div key={ti} className={cn('overflow-hidden rounded-2xl border bg-surface/70', won ? 'border-win/30' : 'border-line')}>
              <div className={cn('flex items-center justify-between px-4 py-3', won ? 'bg-win/10' : 'bg-white/[0.02]')}>
                <span className="font-display font-semibold">Team {ti + 1}</span>
                <Badge tone={won ? 'win' : 'loss'}>{won ? 'Vitória' : 'Derrota'}</Badge>
              </div>
              <div className="scrollbar-thin overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-[11px] tracking-wider text-muted uppercase">
                      <th className="px-4 py-2 text-left font-semibold">Jogador</th>
                      {COLS.map((c) => (
                        <th key={c.key} className="px-2 py-2 text-right font-semibold">
                          <span className="hidden md:inline">{c.label}</span>
                          <span className="md:hidden">{c.short}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {team.map((p, i) => {
                      const isMVP = mvp && mvp.name === p.name
                      return (
                        <tr key={i} className={cn('border-b border-line last:border-0', isMVP && 'bg-gold/[0.06]')}>
                          <td className="px-4 py-3">
                            <Link to={`/rogue/jogadores/${encodeURIComponent(p.name)}`} className="flex items-center gap-2.5 hover:text-accent">
                              <Avatar name={p.name} size="sm" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 font-medium">
                                  <span className="max-w-[9rem] truncate">{p.name}</span>
                                  {isMVP && <Crown className="size-3.5 text-gold" />}
                                </div>
                                <div className="text-xs text-muted">{p.operator || 'Sem operador'}</div>
                              </div>
                            </Link>
                          </td>
                          {COLS.map((c) => {
                            const v = p[c.key] || 0
                            const best = v > 0 && v === maxOf(c.key)
                            return (
                              <td key={c.key} className={cn('px-2 py-3 text-right tabular', best ? 'font-semibold text-accent' : 'text-fg/90')}>
                                {c.key === 'damage' ? fmtInt(v) : v}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-subtle">Valores destacados = melhor do jogo nessa estatística.</p>
    </>
  )
}

function TeamBadge({ label, won, align = 'left' }) {
  return (
    <div className={cn('flex flex-col gap-1.5', align === 'right' ? 'items-end' : 'items-start')}>
      <span className="font-display text-lg font-semibold md:text-2xl">{label}</span>
      <Badge tone={won ? 'win' : 'loss'}>{won ? 'Vitória' : 'Derrota'}</Badge>
    </div>
  )
}
