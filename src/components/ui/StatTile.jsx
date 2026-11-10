import { motion } from 'motion/react'
import { cn } from '../../lib/cn'

export function StatTile({ label, value, hint, icon: Icon, tone, className, index = 0 }) {
  const toneClass = { win: 'text-win', loss: 'text-loss', gold: 'text-gold', accent: 'text-accent' }[tone] || 'text-fg'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={cn('rounded-2xl border border-line bg-surface/80 p-4', className)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium tracking-wide text-muted uppercase">{label}</span>
        {Icon && <Icon className="size-4 text-subtle" />}
      </div>
      <div className={cn('mt-2 font-display text-2xl font-bold tracking-tight tabular', toneClass)}>{value}</div>
      {hint && <div className="mt-0.5 truncate text-xs text-subtle">{hint}</div>}
    </motion.div>
  )
}
