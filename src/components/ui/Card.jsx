import { cn } from '../../lib/cn'

export function Card({ className, interactive = false, as: Comp = 'div', ...props }) {
  return (
    <Comp
      className={cn(
        'relative rounded-2xl border border-line bg-surface/80 backdrop-blur-sm',
        interactive &&
          'cursor-pointer text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface-2',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, title, description, icon: Icon, action, children }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 pt-5', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/20">
            <Icon className="size-[18px]" />
          </div>
        )}
        <div className="min-w-0">
          {title && <h3 className="font-display text-base font-semibold tracking-tight text-fg">{title}</h3>}
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          {children}
        </div>
      </div>
      {action}
    </div>
  )
}

export function CardBody({ className, ...props }) {
  return <div className={cn('p-5', className)} {...props} />
}
