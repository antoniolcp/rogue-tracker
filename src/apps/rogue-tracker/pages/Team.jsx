import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { AlertTriangle, Check, Plus, RotateCcw, Scale, Shuffle, Swords, Trash2, Users, X } from 'lucide-react'
import {
  Avatar, Badge, Button, Card, CardBody, CardHeader, DataTable, EmptyState, Label, PageHeader, PageSkeleton,
  PlayerPicker, Segmented, Select, WinRate,
} from '../../../components/ui'
import { SectionTitle } from '../../../components/ui/PageHeader'
import { cn } from '../../../lib/cn'
import { useRogueData } from '../data'
import { addRivalry, getRivalries, removeRivalry } from '../utils/rivalries'
import {
  calculateDuoStats, calculateTeamStats, fmtInt, generateBalancedTeams, TEAM_MAKER_WEIGHTS,
} from '../utils/stats'

const TABS = [
  { value: 'duplas', label: 'Duplas', icon: Users },
  { value: 'equipas', label: 'Equipas', icon: Shuffle },
  { value: 'rivalidades', label: 'Rivalidades', icon: Swords },
  { value: 'sorteio', label: 'Fazer Equipas', icon: Scale },
]

export default function Team() {
  const { loading } = useRogueData()
  const [params, setParams] = useSearchParams()
  const tab = params.get('vista') || 'duplas'
  if (loading) return <PageSkeleton />
  return (
    <>
      <PageHeader eyebrow="Gestão de equipa" icon={Users} title="Equipa" description="Quem joga bem com quem, quem não se pode ver, e equipas equilibradas para a próxima sessão." />
      <Segmented options={TABS} value={tab} onChange={(v) => setParams(v === 'duplas' ? {} : { vista: v })} className="mb-8" />
      {tab === 'duplas' && <Duos />}
      {tab === 'equipas' && <Teams />}
      {tab === 'rivalidades' && <Rivalries />}
      {tab === 'sorteio' && <TeamMaker />}
    </>
  )
}

function Podium({ items, render }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.slice(0, 3).map((it, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={cn(
            'rounded-2xl border p-4',
            i === 0 && 'border-gold/35 bg-gradient-to-br from-gold/12 to-transparent',
            i === 1 && 'border-silver/25 bg-gradient-to-br from-silver/8 to-transparent',
            i === 2 && 'border-bronze/30 bg-gradient-to-br from-bronze/10 to-transparent',
          )}
        >
          <div className={cn('mb-2 text-xs font-bold', ['text-gold', 'text-silver', 'text-bronze'][i])}>#{i + 1}</div>
          {render(it)}
        </motion.div>
      ))}
    </div>
  )
}

function Duos() {
  const { players, battles } = useRogueData()
  const [params, setParams] = useSearchParams()
  const player = params.get('jogador')
  const duos = useMemo(() => (player ? calculateDuoStats(battles, player) : []), [battles, player])

  if (!player) return <PlayerPicker players={players} onSelect={(n) => setParams({ jogador: n })} />

  const columns = [
    { key: 'name', header: 'Parceiro', sticky: true, cell: (d) => <div className="flex items-center gap-2"><Avatar name={d.name} size="xs" /><span className="font-medium">{d.name}</span></div> },
    { key: 'totalGames', header: 'Jogos', align: 'right' },
    { key: 'totalWins', header: 'V', align: 'right', cell: (d) => <span className="text-win">{d.totalWins}</span> },
    { key: 'totalLosses', header: 'D', align: 'right', cell: (d) => <span className="text-loss">{d.totalLosses}</span> },
    { key: 'winRate', header: 'Win %', align: 'right', cell: (d) => <WinRate value={d.winRate} /> },
    { key: 'kdRatio', header: 'K/D', align: 'right' },
    { key: 'avgDowns', header: 'Downs', align: 'right' },
    { key: 'avgDamage', header: 'Damage', align: 'right', cell: (d) => fmtInt(d.avgDamage) },
    { key: 'uniqueOperators', header: 'Operadores', align: 'right' },
  ]

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Avatar name={player} size="md" />
        <h2 className="font-display text-xl font-semibold">Parcerias de {player}</h2>
        <Button variant="ghost" size="sm" onClick={() => setParams({})}><X className="size-3.5" /> Trocar</Button>
      </div>
      {duos.length === 0 ? (
        <EmptyState icon={Users} title="Este jogador ainda não jogou com outros jogadores." />
      ) : (
        <div className="space-y-6">
          <Podium
            items={duos}
            render={(d) => (
              <div className="flex items-center gap-3">
                <Avatar name={d.name} size="md" />
                <div className="min-w-0">
                  <div className="truncate font-semibold">{d.name}</div>
                  <div className="text-sm"><WinRate value={d.winRate} /> <span className="text-xs text-muted">· {d.totalGames} jogos</span></div>
                </div>
              </div>
            )}
          />
          <p className="text-xs text-subtle">Estatísticas de {player} quando joga com cada parceiro.</p>
          <DataTable columns={columns} rows={duos} rowKey={(d) => d.name} />
        </div>
      )}
    </>
  )
}

function TeamNames({ names, size = 'xs' }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {names.split(', ').map((n) => (
        <span key={n} className="inline-flex items-center gap-1.5 rounded-full bg-white/5 py-0.5 pr-2.5 pl-0.5 text-xs ring-1 ring-line">
          <Avatar name={n} size={size} />
          {n}
        </span>
      ))}
    </div>
  )
}

function Teams() {
  const { battles } = useRogueData()
  const stats = useMemo(() => calculateTeamStats(battles), [battles])
  if (stats.length === 0) return <EmptyState icon={Shuffle} title="Nenhuma equipa com dados suficientes" description="Uma equipa precisa de pelo menos 2 jogos juntos." />

  const columns = [
    { key: 'players', header: 'Equipa', sortable: false, cell: (t) => <TeamNames names={t.players} /> },
    { key: 'totalGames', header: 'Jogos', align: 'right' },
    { key: 'totalWins', header: 'V', align: 'right', cell: (t) => <span className="text-win">{t.totalWins}</span> },
    { key: 'totalLosses', header: 'D', align: 'right', cell: (t) => <span className="text-loss">{t.totalLosses}</span> },
    { key: 'winRate', header: 'Win %', align: 'right', cell: (t) => <WinRate value={t.winRate} /> },
    { key: 'avgDowns', header: 'Downs', align: 'right' },
    { key: 'avgDamage', header: 'Damage', align: 'right', cell: (t) => fmtInt(t.avgDamage) },
  ]
  return (
    <div className="space-y-6">
      <Podium
        items={stats}
        render={(t) => (
          <>
            <TeamNames names={t.players} />
            <div className="mt-3 text-sm"><WinRate value={t.winRate} /> <span className="text-xs text-muted">· {t.totalGames} jogos</span></div>
          </>
        )}
      />
      <p className="text-xs text-subtle">Equipas (formações exatas de 4) com 2+ jogos juntos.</p>
      <DataTable columns={columns} rows={stats} rowKey={(t) => t.players} />
    </div>
  )
}

function Rivalries() {
  const { players } = useRogueData()
  const [rivalries, setRivalries] = useState(getRivalries)
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const sorted = useMemo(() => [...players].sort((x, y) => x.name.localeCompare(y.name)), [players])

  const add = () => {
    if (!a || !b) return toast.error('Seleciona dois jogadores diferentes!')
    if (a === b) return toast.error('Um jogador não pode ter rivalidade consigo mesmo!')
    if (addRivalry(a, b)) {
      setRivalries(getRivalries())
      toast.success(`Rivalidade adicionada: ${a} ✕ ${b}`)
      setA('')
      setB('')
    } else toast.error('Esta rivalidade já existe!')
  }

  const remove = (x, y) => {
    if (removeRivalry(x, y)) {
      setRivalries(getRivalries())
      toast(`Rivalidade removida: ${x} e ${y}`)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader icon={Plus} title="Nova rivalidade" description="Rivais nunca ficam na mesma equipa no sorteio." />
        <CardBody className="space-y-4">
          <div>
            <Label>Jogador 1</Label>
            <Select value={a} onChange={(e) => setA(e.target.value)}>
              <option value="">Seleciona…</option>
              {sorted.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Jogador 2</Label>
            <Select value={b} onChange={(e) => setB(e.target.value)}>
              <option value="">Seleciona…</option>
              {sorted.filter((p) => p.name !== a).map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </Select>
          </div>
          <Button variant="primary" className="w-full" onClick={add} disabled={!a || !b}>
            <Plus className="size-4" /> Adicionar
          </Button>
        </CardBody>
      </Card>

      <div className="lg:col-span-3">
        <SectionTitle>Rivalidades configuradas <Badge className="ml-2">{rivalries.length}</Badge></SectionTitle>
        {rivalries.length === 0 ? (
          <EmptyState icon={Swords} title="Nenhuma rivalidade configurada ainda." />
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            <AnimatePresence initial={false}>
              {rivalries.map((r) => (
                <motion.div
                  key={r.join('|')}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface/70 p-3"
                >
                  <Avatar name={r[0]} size="sm" />
                  <span className="min-w-0 truncate text-sm font-medium">{r[0]}</span>
                  <Swords className="size-4 shrink-0 text-loss" />
                  <span className="min-w-0 truncate text-sm font-medium">{r[1]}</span>
                  <Button variant="ghost" size="icon-sm" className="ml-auto" title="Remover" onClick={() => remove(r[0], r[1])}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

function TeamMaker() {
  const { players } = useRogueData()
  const [selected, setSelected] = useState([])
  const [teams, setTeams] = useState(null)

  const toggle = (name) => {
    setTeams(null)
    if (selected.includes(name)) setSelected(selected.filter((n) => n !== name))
    else if (selected.length < 8) setSelected([...selected, name])
    else toast.error('Só podes selecionar 8 jogadores!')
  }

  const generate = () => {
    if (selected.length !== 8) return toast.error('Seleciona exatamente 8 jogadores!')
    const t = generateBalancedTeams(players, selected)
    if (t.hasRivalryIssues) {
      toast.warning('As equipas geradas não respeitam todas as rivalidades configuradas.', {
        description: [t.team1Rivalry && 'A Equipa 1 contém rivalidades internas.', t.team2Rivalry && 'A Equipa 2 contém rivalidades internas.'].filter(Boolean).join(' '),
      })
    }
    setTeams(t)
  }

  const balanced = teams && parseFloat(teams.difference) < 5

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        Ranking =
        {TEAM_MAKER_WEIGHTS.map((w) => (
          <span key={w.label} className="rounded-md bg-white/5 px-2 py-0.5 ring-1 ring-line">
            {w.label} <span className="font-semibold text-fg">{w.pct}%</span>
          </span>
        ))}
      </div>

      <div className="sticky top-[7.5rem] z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface/90 p-3 backdrop-blur xl:top-20">
        <div className="flex items-center gap-2 px-1">
          <span className={cn('font-display text-2xl font-bold tabular', selected.length === 8 ? 'text-win' : 'text-fg')}>{selected.length}</span>
          <span className="text-sm text-muted">/ 8 selecionados</span>
        </div>
        <div className="flex -space-x-2">
          {selected.map((n) => <Avatar key={n} name={n} size="sm" className="ring-2 ring-surface" />)}
        </div>
        <div className="ml-auto flex gap-2">
          {selected.length > 0 && (
            <Button variant="ghost" size="md" onClick={() => { setSelected([]); setTeams(null) }}>
              <RotateCcw className="size-4" /> Reset
            </Button>
          )}
          <Button variant="primary" onClick={generate} disabled={selected.length !== 8}>
            <Scale className="size-4" /> Criar equipas
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {teams && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {teams.hasRivalryIssues && (
              <div className="flex items-center gap-3 rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-gold">
                <AlertTriangle className="size-4 shrink-0" />
                As equipas geradas não respeitam completamente as rivalidades configuradas.
              </div>
            )}
            <div className="flex items-center justify-center gap-3 text-sm">
              <span className="text-muted">Diferença de força: <span className="font-semibold text-fg tabular">{teams.difference}</span></span>
              <Badge tone={balanced ? 'win' : 'gold'}>{balanced ? <><Check className="size-3" /> Equilibrado</> : 'Desequilibrado'}</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { t: teams.team1, s: teams.team1Strength, label: 'Equipa 1', color: '#f87171' },
                { t: teams.team2, s: teams.team2Strength, label: 'Equipa 2', color: '#60a5fa' },
              ].map(({ t, s, label, color }, ti) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: ti === 0 ? -16 : 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="overflow-hidden rounded-2xl border bg-surface/80"
                  style={{ borderColor: `color-mix(in oklab, ${color} 40%, transparent)` }}
                >
                  <div className="flex items-center justify-between px-4 py-3" style={{ background: `color-mix(in oklab, ${color} 12%, transparent)` }}>
                    <span className="font-display font-bold" style={{ color }}>{label}</span>
                    <span className="text-sm text-muted">Força <span className="font-semibold text-fg tabular">{s}</span></span>
                  </div>
                  <div className="divide-y divide-line">
                    {t.map((p, i) => (
                      <motion.div
                        key={p.name}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 + i * 0.06 }}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <span className="w-5 text-xs text-subtle">#{i + 1}</span>
                        <Avatar name={p.name} size="sm" />
                        <span className="flex-1 truncate font-medium">{p.name}</span>
                        <span className="text-xs text-muted">WR <WinRate value={p.winRate} /> · {p.avgDowns ?? 0} downs</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PlayerPicker players={players} selected={selected} onSelect={toggle} />
    </div>
  )
}
