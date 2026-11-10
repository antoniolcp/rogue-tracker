import { createContext, useCallback, useContext, useRef, useState } from 'react'
import * as AD from '@radix-ui/react-alert-dialog'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { Input } from './Field'

const ConfirmContext = createContext(null)

/**
 * Promise-based confirm dialog: const ok = await confirm({ title, description, confirmText, danger, typeToConfirm })
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)
  const [typed, setTyped] = useState('')
  const resolver = useRef(null)

  const confirm = useCallback((opts) => {
    setTyped('')
    setState(opts)
    return new Promise((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const close = (value) => {
    resolver.current?.(value)
    resolver.current = null
    setState(null)
  }

  const blocked = state?.typeToConfirm && typed !== state.typeToConfirm

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AD.Root open={!!state} onOpenChange={(o) => !o && close(false)}>
        <AD.Portal>
          <AD.Overlay className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" />
          <AD.Content className="fixed top-1/2 left-1/2 z-[60] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line-strong bg-surface p-6 shadow-2xl outline-none">
            <div className="flex gap-4">
              {state?.danger && (
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-loss/15 text-loss">
                  <AlertTriangle className="size-5" />
                </div>
              )}
              <div className="min-w-0">
                <AD.Title className="font-display text-lg font-semibold">{state?.title}</AD.Title>
                {state?.description && (
                  <AD.Description className="mt-1.5 text-sm whitespace-pre-line text-muted">
                    {state.description}
                  </AD.Description>
                )}
              </div>
            </div>
            {state?.typeToConfirm && (
              <div className="mt-4">
                <p className="mb-2 text-xs text-muted">
                  Escreve <span className="font-mono font-semibold text-fg">{state.typeToConfirm}</span> para confirmar.
                </p>
                <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <AD.Cancel asChild>
                <Button variant="ghost">{state?.cancelText || 'Cancelar'}</Button>
              </AD.Cancel>
              <Button
                variant={state?.danger ? 'danger' : 'primary'}
                disabled={blocked}
                onClick={() => close(true)}
              >
                {state?.confirmText || 'Confirmar'}
              </Button>
            </div>
          </AD.Content>
        </AD.Portal>
      </AD.Root>
    </ConfirmContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>')
  return ctx
}
