import * as RD from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'

export function Dialog({ open, onOpenChange, title, description, children, className, footer }) {
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in" />
        <RD.Content
          className={cn(
            'fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-line-strong bg-surface p-6 shadow-2xl outline-none',
            className,
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <RD.Title className="font-display text-lg font-semibold">{title}</RD.Title>
              {description && <RD.Description className="mt-1 text-sm text-muted">{description}</RD.Description>}
            </div>
            <RD.Close className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted hover:bg-white/5 hover:text-fg">
              <X className="size-4" />
            </RD.Close>
          </div>
          {children}
          {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  )
}
