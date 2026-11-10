import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'

const fieldBase =
  'w-full rounded-xl border border-line-strong bg-surface-2 text-sm text-fg placeholder:text-subtle transition-colors outline-none hover:border-white/20 focus:border-accent focus:ring-2 focus:ring-accent/25 disabled:opacity-50'

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(fieldBase, 'h-10 px-3', className)} {...props} />
})

export const Select = forwardRef(function Select({ className, wrapperClassName, children, ...props }, ref) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <select ref={ref} className={cn(fieldBase, 'h-10 cursor-pointer appearance-none pr-9 pl-3', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
    </div>
  )
})

export function Label({ className, ...props }) {
  return <label className={cn('mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase', className)} {...props} />
}
