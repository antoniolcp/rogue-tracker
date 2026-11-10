import { Link } from 'react-router-dom'
import { Crown, MapPin } from 'lucide-react'
import { Avatar } from '../../../components/ui'
import { cn } from '../../../lib/cn'
import { battleDate } from '../utils/stats'

export function ScoreLine({ battle, className }) {
  const t1 = battle.team1Rounds || 0
  const t2 = battle.team2Rounds || 0
  const t1Won = battle.result === 'win'
  return (
    <div className={cn('flex items-center gap-2 font-display text-xl font-bold tabular', className)}>
      <span className={t1Won ? 'text-win' : 'text-muted'}>{t1}</span>
      <span className="text-subtle">–</span>
      <span className={!t1Won ? 'text-win' : 'text-muted'}>{t2}</span>
    </div>
  )
}

export function GameCard({ battle, mvp, label, compact = false }) {
  const d = battleDate(battle)
  return (
    <Link
      to={`/rogue/jogos/${battle.id}`}
      className={cn(
        'group flex items-center gap-4 rounded-2xl border border-line bg-surface/70 transition-all hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface-2',
        compact ? 'p-3' : 'p-4',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-muted">
          <MapPin className="size-3.5 text-accent" />
          <span className="truncate font-medium text-fg">{battle.map || 'Mapa desconhecido'}</span>
          {label && <span className="text-subtle">· {label}</span>}
        </div>
        <div className="mt-1 text-xs text-subtle tabular">
          {d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} ·{' '}
          {d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      <ScoreLine battle={battle} className={compact ? 'text-lg' : ''} />
      {mvp && (
        <div className="hidden min-w-0 items-center gap-2 sm:flex sm:w-36">
          <Avatar name={mvp.name} size="xs" />
          <span className="truncate text-xs text-muted">{mvp.name}</span>
          <Crown className="size-3.5 shrink-0 text-gold" />
        </div>
      )}
    </Link>
  )
}
