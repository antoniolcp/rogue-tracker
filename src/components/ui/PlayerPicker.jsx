import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Search, Users } from 'lucide-react'
import { Avatar } from './Avatar'
import { Input } from './Field'
import { WinRate } from './Meter'
import { EmptyState } from './EmptyState'
import { cn } from '../../lib/cn'

/** Searchable grid of players. players: [{ name, totalGames, winRate }] */
export function PlayerPicker({ players, onSelect, selected = [], renderMeta, emptyText = 'Nenhum jogador encontrado.' }) {
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return [...players]
      .filter((p) => !s || p.name.toLowerCase().includes(s))
      .sort((a, b) => (b.totalGames || 0) - (a.totalGames || 0))
  }, [players, q])

  if (players.length === 0) return <EmptyState icon={Users} title={emptyText} />

  return (
    <div>
      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar jogador…" className="pl-9" />
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {list.map((p, i) => {
          const isSel = selected.includes(p.name)
          return (
            <motion.button
              key={p.name}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.015, 0.3) }}
              onClick={() => onSelect(p.name)}
              className={cn(
                'group flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all',
                isSel
                  ? 'border-accent/60 bg-accent/10'
                  : 'border-line bg-surface/70 hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface-2',
              )}
            >
              <Avatar name={p.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-fg">{p.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                  {renderMeta ? (
                    renderMeta(p)
                  ) : (
                    <>
                      <span className="tabular">{p.totalGames || 0} jogos</span>
                      <span className="text-subtle">·</span>
                      <WinRate value={p.winRate} className="font-medium" />
                    </>
                  )}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
      {list.length === 0 && <p className="py-8 text-center text-sm text-muted">Sem resultados para “{q}”.</p>}
    </div>
  )
}
