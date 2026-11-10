import { useId } from 'react'
import { motion } from 'motion/react'
import { cn } from '../../lib/cn'

/**
 * Pill-style segmented control with an animated active indicator.
 * options: [{ value, label, icon? }]
 */
export function Segmented({ options, value, onChange, className, size = 'md' }) {
  const id = useId()
  return (
    <div
      role="tablist"
      className={cn(
        'no-scrollbar inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-colors',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm',
              active ? 'text-accent-fg' : 'text-muted hover:text-fg',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-lg bg-accent"
                transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {Icon && <Icon className="size-3.5" />}
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
