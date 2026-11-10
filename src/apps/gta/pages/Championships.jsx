import { useMemo, useState } from 'react'
import { Flag, Search } from 'lucide-react'
import { EmptyState, Input, PageHeader, PageSkeleton } from '../../../components/ui'
import { useGtaData } from '../data'
import { ChampionshipRow } from './Home'

export default function Championships() {
  const { playlists, loading } = useGtaData()
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return playlists.filter((p) => !s || p.name?.toLowerCase().includes(s) || p.winner?.toLowerCase().includes(s))
  }, [playlists, q])

  if (loading) return <PageSkeleton />

  return (
    <>
      <PageHeader eyebrow="Histórico" icon={Flag} title="Campeonatos" description={`${playlists.length} campeonatos disputados.`} />
      <div className="relative mb-6 max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar campeonato ou vencedor…" className="pl-9" />
      </div>
      {list.length === 0 ? (
        <EmptyState icon={Flag} title="Nenhum campeonato encontrado" />
      ) : (
        <div className="grid gap-2.5 md:grid-cols-2">
          {list.map((pl) => <ChampionshipRow key={pl.id} pl={pl} />)}
        </div>
      )}
    </>
  )
}
