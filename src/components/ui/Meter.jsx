import { cn } from '../../lib/cn'

/** Horizontal bar for percentages / relative values. */
export function Meter({ value = 0, max = 100, tone = 'accent', className }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  const color = { accent: 'bg-accent', win: 'bg-win', loss: 'bg-loss', gold: 'bg-gold' }[tone]
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]', className)}>
      <div className={cn('h-full rounded-full transition-[width] duration-700 ease-out', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Win rate pill coloured by value. */
export function WinRate({ value = 0, className }) {
  const v = Math.round(value || 0)
  const tone = v >= 60 ? 'text-win' : v >= 45 ? 'text-fg' : 'text-loss'
  return <span className={cn('font-semibold tabular', tone, className)}>{v}%</span>
}
