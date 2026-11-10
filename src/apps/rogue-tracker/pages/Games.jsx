import { useMemo, useState } from 'react'
import { ListOrdered, Search } from 'lucide-react'
import { EmptyState, Input, PageHeader, PageSkeleton, Select } from '../../../components/ui'
import { useRogueData } from '../data'
import { GameCard } from '../components/GameCard'
import { battleDate } from '../utils/stats'

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Agrupa por dia (mais recente primeiro) e numera os jogos de cada dia por ordem cronológica. */
// eslint-disable-next-line react-refresh/only-export-components
export function groupBattlesByDay(battles) {
  const groups = new Map()
  battles.forEach((b) => {
    const d = battleDate(b)
    const k = dayKey(d)
    if (!groups.has(k)) groups.set(k, { key: k, date: d, battles: [] })
    groups.get(k).battles.push(b)
  })
  const list = [...groups.values()].sort((a, b) => b.key.localeCompare(a.key))
  list.forEach((g) => {
    const chrono = [...g.battles].sort((a, b) => battleDate(a) - battleDate(b))
    g.numbers = new Map(chrono.map((b, i) => [b.id, i + 1]))
    g.battles.sort((a, b) => battleDate(b) - battleDate(a))
  })
  return list
}

export default function Games() {
  const { battles, mvpIndex, loading } = useRogueData()
  const [q, setQ] = useState('')
  const [map, setMap] = useState('')

  const maps = useMemo(() => [...new Set(battles.map((b) => b.map).filter(Boolean))].sort(), [battles])

  const groups = useMemo(() => {
    const s = q.trim().toLowerCase()
    const filtered = battles.filter(
      (b) =>
        (!map || b.map === map) &&
        (!s || [...b.team1, ...b.team2].some((p) => p.name?.toLowerCase().includes(s))),
    )
    return groupBattlesByDay(filtered)
  }, [battles, q, map])

  if (loading) return <PageSkeleton />

  return (
    <>
      <PageHeader
        eyebrow="Histórico"
        icon={ListOrdered}
        title="Lista de Jogos"
        description={`${battles.length} jogos registados. Clica num jogo para ver o scoreboard completo.`}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar por jogador…" className="pl-9" />
        </div>
        <Select value={map} onChange={(e) => setMap(e.target.value)} wrapperClassName="sm:w-52">
          <option value="">Todos os mapas</option>
          {maps.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={ListOrdered} title="Nenhum jogo encontrado" description="Tenta outro filtro ou adiciona uma batalha." />
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.key}>
              <div className="sticky top-[7.5rem] z-10 -mx-1 mb-3 flex items-center gap-3 bg-bg/80 px-1 py-1.5 backdrop-blur xl:top-[4.5rem]">
                <h2 className="font-display text-sm font-semibold first-letter:uppercase">
                  {g.date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h2>
                <span className="h-px flex-1 bg-line" />
                <span className="text-xs text-muted tabular">{g.battles.length} jogos</span>
              </div>
              <div className="grid gap-2.5 md:grid-cols-2">
                {g.battles.map((b) => (
                  <GameCard key={b.id} battle={b} mvp={mvpIndex.get(b.id)} label={`Jogo ${g.numbers.get(b.id)}`} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
