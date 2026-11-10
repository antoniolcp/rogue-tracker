import { cn } from '../../lib/cn'

const medal = {
  1: 'bg-gold/15 text-gold ring-gold/40',
  2: 'bg-silver/10 text-silver ring-silver/30',
  3: 'bg-bronze/15 text-bronze ring-bronze/40',
}

export function Rank({ value, className }) {
  return (
    <span
      className={cn(
        'inline-grid size-7 place-items-center rounded-lg font-display text-xs font-bold tabular ring-1 ring-inset',
        medal[value] || 'bg-white/[0.03] text-muted ring-line',
        className,
      )}
    >
      {value}
    </span>
  )
}
