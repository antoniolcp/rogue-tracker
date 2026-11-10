import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

const variants = {
  primary:
    'bg-accent text-accent-fg font-semibold shadow-[0_0_0_1px_rgb(255_255_255/0.08)_inset,0_8px_24px_-8px_var(--accent)] hover:brightness-110 active:brightness-95',
  secondary: 'bg-surface-3 text-fg border border-line-strong hover:bg-white/10',
  outline: 'border border-line-strong text-fg hover:bg-white/5 hover:border-white/25',
  ghost: 'text-muted hover:text-fg hover:bg-white/5',
  danger: 'bg-loss/15 text-loss border border-loss/30 hover:bg-loss/25',
}

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
  icon: 'size-9 rounded-lg',
  'icon-sm': 'size-7 rounded-md',
}

export const Button = forwardRef(function Button(
  { as: Comp = 'button', variant = 'secondary', size = 'md', loading = false, className, children, disabled, ...props },
  ref,
) {
  return (
    <Comp
      ref={ref}
      disabled={Comp === 'button' ? disabled || loading : undefined}
      aria-disabled={disabled || loading || undefined}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap font-medium transition-all duration-150 select-none',
        'disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Comp>
  )
})
