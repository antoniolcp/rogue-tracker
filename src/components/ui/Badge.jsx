import { cn } from '../../lib/cn'

const tones = {
  neutral: 'bg-white/5 text-muted ring-line-strong',
  accent: 'bg-accent/10 text-accent ring-accent/25',
  win: 'bg-win/10 text-win ring-win/25',
  loss: 'bg-loss/10 text-loss ring-loss/25',
  gold: 'bg-gold/10 text-gold ring-gold/30',
}

export function Badge({ tone = 'neutral', className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
