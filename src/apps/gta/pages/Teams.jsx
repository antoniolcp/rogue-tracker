import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { AlertTriangle, ArrowLeft, ArrowRight, Plus, RotateCcw, Scale, Swords, Trash2 } from 'lucide-react'
import {
  Avatar, Badge, Button, Card, CardBody, CardHeader, EmptyState, Label, PageHeader, PageSkeleton, PlayerPicker, Segmented, Select,
} from '../../../components/ui'
import { SectionTitle } from '../../../components/ui/PageHeader'
import { cn } from '../../../lib/cn'
import { useGtaData } from '../data'
import { addRivalry, getRivalries, hasTeamRivalries, removeRivalry } from '../utils/rivalries'

const TEAM_TINTS = ['#ffb800', '#22d3ee', '#f472b6', '#34d399', '#a78bfa']

export default function GtaTeams() {
  const { loading } = useGtaData()
  const [params, setParams] = useSearchParams()
  const tab = params.get('vista') || 'rivalidades'
  if (loading) return <PageSkeleton />
  return (
    <>
      <PageHeader eyebrow="Gestão" icon={Scale} title="Equipas" description="Rivalidades e gerador de equipas equilibradas por PPR." />
      <Segmented
        className="mb-8"
        options={[{ value: 'rivalidades', label: 'Rivalidades', icon: Swords }, { value: 'gerador', label: 'Criar equipas', icon: Scale }]}
        value={tab}
        onChange={(v) => setParams(v === 'rivalidades' ? {} : { vista: v })}
      />
      {tab === 'rivalidades' ? <Rivalries /> : <Generator />}
    </>
  )
}

function Rivalries() {
  const { players } = useGtaData()
  const [rivalries, setRivalries] = useState(getRivalries)
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const sorted = useMemo(() => [...players].sort((x, y) => x.name.localeCompare(y.name)), [players])

  const add = () => {
    if (!a || !b) return toast.error('Seleciona dois jogadores!')
    if (a === b) return toast.error('Um jogador não pode ser rival de si mesmo.')
    if (addRivalry(a, b)) {
      setRivalries(getRivalries())
      toast.success(`Rivalidade adicionada: ${a} ✕ ${b}`)
      setA('')
      setB('')
    } else toast.error('Essa rivalidade já existe ou é inválida.')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader icon={Plus} title="Nova rivalidade" description="Rivais nunca ficam na mesma equipa." />
        <CardBody className="space-y-4">
          <div>
            <Label>Jogador 1</Label>
            <Select value={a} onChange={(e) => setA(e.target.value)}>
              <option value="">Seleciona…</option>
              {sorted.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Jogador 2</Label>
            <Select value={b} onChange={(e) => setB(e.target.value)}>
              <option value="">Seleciona…</option>
              {sorted.filter((p) => p.name !== a).map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </Select>
          </div>
          <Button variant="primary" className="w-full" onClick={add} disabled={!a || !b}><Plus className="size-4" /> Adicionar</Button>
        </CardBody>
      </Card>
      <div className="lg:col-span-3">
        <SectionTitle>Rivalidades <Badge className="ml-2">{rivalries.length}</Badge></SectionTitle>
        {rivalries.length === 0 ? (
          <EmptyState icon={Swords} title="Sem rivalidades registadas." />
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
                  <Swords className="size-4 shrink-0 text-accent-2" />
                  <span className="min-w-0 truncate text-sm font-medium">{r[1]}</span>
                  <Button
                    variant="ghost" size="icon-sm" className="ml-auto" title="Remover"
                    onClick={() => { if (removeRivalry(r[0], r[1])) setRivalries(getRivalries()) }}
                  >
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

const calculatePlayerRank = (player) => {
  const stats = player.stats || { wins: 0, totalPoints: 0, races: 0 }
  if (!stats.races) return 0
  return stats.totalPoints / stats.races
}

function Generator() {
  const { players } = useGtaData()
  const [step, setStep] = useState(1)
  const [numTeams, setNumTeams] = useState(2)
  const [selected, setSelected] = useState([])
  const [result, setResult] = useState(null)

  const pickerPlayers = useMemo(
    () => players.map((p) => ({ name: p.name, totalGames: p.stats?.races || 0, ppr: calculatePlayerRank(p) })),
    [players],
  )

  const toggle = (name) => {
    setResult(null)
    if (selected.includes(name)) setSelected((c) => c.filter((p) => p !== name))
    else if (selected.length < 20) setSelected((c) => [...c, name])
    else toast.error('Máximo de 20 jogadores por segurança!')
  }

  const generate = () => {
    if (selected.length % numTeams !== 0 || selected.length === 0) {
      toast.error(`Seleciona um número de jogadores divisível por ${numTeams} (ex: ${numTeams}, ${numTeams * 2}, …).`)
      return
    }
    const data = players
      .filter((p) => selected.includes(p.name))
      .map((p) => ({ ...p, rank: calculatePlayerRank(p) }))
      .sort((a, b) => b.rank - a.rank)

    const teamSize = data.length / numTeams
    const teams = Array.from({ length: numTeams }, () => [])
    const scores = new Array(numTeams).fill(0)
    const target = data.reduce((s, p) => s + p.rank, 0) / numTeams
    let best = null
    let bestDiff = Infinity
    let minConflicts = Infinity

    const solve = (idx) => {
      if (idx === data.length) {
        let diff = 0
        let conflicts = 0
        for (let i = 0; i < numTeams; i++) {
          diff += Math.abs(scores[i] - target)
          if (hasTeamRivalries(teams[i])) conflicts++
        }
        if (conflicts < minConflicts || (conflicts === minConflicts && diff < bestDiff)) {
          minConflicts = conflicts
          bestDiff = diff
          best = teams.map((t) => [...t])
        }
        return
      }
      const player = data[idx]
      for (let i = 0; i < numTeams; i++) {
        if (teams[i].length < teamSize) {
          teams[i].push(player)
          scores[i] += player.rank
          solve(idx + 1)
          scores[i] -= player.rank
          teams[i].pop()
          // Evitar permutações de equipas vazias equivalentes
          if (teams[i].length === 0) break
        }
      }
    }
    solve(0)

    if (best) {
      setResult({
        teams: best.map((t, i) => ({ id: i + 1, players: t, score: t.reduce((s, p) => s + p.rank, 0).toFixed(1) })),
        diff: bestDiff.toFixed(1),
        conflicts: minConflicts,
      })
    }
  }

  if (step === 1) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <CardBody className="p-8">
          <h3 className="font-display text-xl font-semibold">Quantas equipas?</h3>
          <p className="mt-1 text-sm text-muted">As equipas são equilibradas por PPR (pontos por corrida), respeitando rivalidades.</p>
          <div className="mt-6 flex justify-center gap-3">
            {[2, 3, 4, 5].map((n) => (
              <motion.button
                key={n}
                whileTap={{ scale: 0.92 }}
                onClick={() => setNumTeams(n)}
                className={cn(
                  'grid size-16 cursor-pointer place-items-center rounded-2xl font-display text-2xl font-bold transition-colors',
                  numTeams === n ? 'bg-accent text-accent-fg shadow-[0_8px_24px_-8px_var(--accent)]' : 'border border-line-strong bg-surface-2 hover:border-white/25',
                )}
              >
                {n}
              </motion.button>
            ))}
          </div>
          <Button variant="primary" size="lg" className="mt-8" onClick={() => setStep(2)}>
            Selecionar jogadores <ArrowRight className="size-4" />
          </Button>
        </CardBody>
      </Card>
    )
  }

  const divisible = selected.length > 0 && selected.length % numTeams === 0

  return (
    <div className="space-y-6">
      <div className="sticky top-[7.5rem] z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface/90 p-3 backdrop-blur xl:top-20">
        <Button variant="ghost" size="sm" onClick={() => { setStep(1); setResult(null) }}><ArrowLeft className="size-4" /> {numTeams} equipas</Button>
        <div className="flex items-center gap-2">
          <span className={cn('font-display text-2xl font-bold tabular', divisible ? 'text-win' : 'text-fg')}>{selected.length}</span>
          <span className="text-sm text-muted">selecionados · múltiplo de {numTeams}</span>
        </div>
        <div className="ml-auto flex gap-2">
          {selected.length > 0 && <Button variant="ghost" onClick={() => { setSelected([]); setResult(null) }}><RotateCcw className="size-4" /> Limpar</Button>}
          <Button variant="primary" onClick={generate} disabled={selected.length === 0}><Scale className="size-4" /> Gerar {numTeams} equipas</Button>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {result.conflicts > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-loss/30 bg-loss/10 p-3 text-sm text-loss">
                <AlertTriangle className="size-4 shrink-0" /> Atenção: {result.conflicts} conflito(s) de rivalidade encontrados!
              </div>
            )}
            <p className="text-center text-sm text-muted">Desvio de skill (PPR): <span className="font-semibold text-accent tabular">{result.diff}</span></p>
            <div className={cn('grid gap-4', result.teams.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3')}>
              {result.teams.map((team, i) => {
                const tint = TEAM_TINTS[i % TEAM_TINTS.length]
                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="overflow-hidden rounded-2xl border bg-surface/80"
                    style={{ borderColor: `color-mix(in oklab, ${tint} 40%, transparent)` }}
                  >
                    <div className="flex items-center justify-between px-4 py-3" style={{ background: `color-mix(in oklab, ${tint} 12%, transparent)` }}>
                      <span className="font-display font-bold" style={{ color: tint }}>Equipa {team.id}</span>
                      <span className="text-sm text-muted">PPR total <span className="font-semibold text-fg tabular">{team.score}</span></span>
                    </div>
                    <ul className="divide-y divide-line">
                      {team.players.map((p) => (
                        <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                          <Avatar name={p.name} size="sm" />
                          <span className="flex-1 truncate font-medium">{p.name}</span>
                          <span className="text-xs text-muted tabular">{p.rank.toFixed(1)}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PlayerPicker
        players={pickerPlayers}
        selected={selected}
        onSelect={toggle}
        renderMeta={(p) => <span className="tabular">{p.totalGames} corridas · {p.ppr.toFixed(1)} PPR</span>}
      />
    </div>
  )
}
