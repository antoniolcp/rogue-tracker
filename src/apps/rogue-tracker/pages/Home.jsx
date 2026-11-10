import { useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowRight, BarChart3, Crosshair, Gamepad2, ListOrdered, Map, Medal, Plus, Swords, Trophy, Users,
} from 'lucide-react'
import { Avatar, Button, Card, Rank, Skeleton, StatTile, WinRate } from '../../../components/ui'
import { SectionTitle } from '../../../components/ui/PageHeader'
import { useRogueData } from '../data'
import { STICKERS } from '../constants'
import { GameCard } from '../components/GameCard'
import { calculateGeneralMapStats, calculatePlayerRanking } from '../utils/stats'

const features = [
  { to: 'jogos', title: 'Lista de Jogos', desc: 'Histórico completo com MVP de cada partida', icon: ListOrdered },
  { to: 'ranking', title: 'Rankings', desc: 'Score geral e por métrica, por ronda ou jogo', icon: Trophy },
  { to: 'jogadores', title: 'Estatísticas', desc: 'Perfil detalhado e evolução de cada jogador', icon: BarChart3 },
  { to: 'operadores', title: 'Operadores', desc: 'Quem rende mais com cada operador', icon: Crosshair },
  { to: 'mapas', title: 'Análise por Mapa', desc: 'Melhores e piores mapas de cada um', icon: Map },
  { to: 'equipa', title: 'Gestão de Equipa', desc: 'Duplas, equipas, rivalidades e sorteio', icon: Users },
  { to: 'comparar', title: 'Comparação 1v1', desc: 'Frente a frente entre dois jogadores', icon: Swords },
  { to: 'recordes', title: 'Recordes', desc: 'As melhores performances de sempre', icon: Medal },
]

export default function RogueHome() {
  const { battles, players, mvpIndex, loading } = useRogueData()
  const heroRef = useRef(null)

  const ranking = useMemo(
    () => calculatePlayerRanking({ players, battles, mvpIndex, minGames: 1, viewMode: 'round' }).slice(0, 5),
    [players, battles, mvpIndex],
  )
  const topMap = useMemo(() => calculateGeneralMapStats(battles).find((m) => m.map !== 'Unknown'), [battles])
  const totalRounds = battles.reduce((s, b) => s + (b.team1Rounds || 0) + (b.team2Rounds || 0), 0)

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section
        ref={heroRef}
        className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-surface-2 via-surface to-bg px-6 py-14 md:px-12 md:py-20"
      >
        <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_left,black,transparent_75%)]" />
        <div className="relative z-10 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold tracking-wider text-accent uppercase"
          >
            <Gamepad2 className="size-3.5" /> Los Chinelos · Strikeout 4v4
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-5xl leading-[0.95] font-bold tracking-tight md:text-7xl"
          >
            Rogue
            <br />
            <span className="text-gradient">Tracker</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-5 max-w-md text-lg text-muted"
          >
            Cada down, cada revive, cada derrota humilhante — tudo registado.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button as={Link} to="/rogue/nova" variant="primary" size="lg">
              <Plus className="size-5" /> Adicionar batalha
            </Button>
            <Button as={Link} to="/rogue/ranking" variant="outline" size="lg">
              Ver ranking <ArrowRight className="size-4" />
            </Button>
          </motion.div>
        </div>

        {/* Mobile sticker strip */}
        <div className="no-scrollbar relative z-10 -mx-6 mt-10 flex gap-2 overflow-x-auto px-6 lg:hidden">
          {STICKERS.map((s, i) => (
            <motion.img
              key={s.src}
              src={s.src}
              alt=""
              initial={{ opacity: 0, y: 12, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: s.rotate / 2 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="h-28 w-auto shrink-0 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
            />
          ))}
        </div>

        {/* Draggable stickers */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[52%] lg:block">
          {STICKERS.map((s, i) => (
            <motion.img
              key={s.src}
              src={s.src}
              alt=""
              draggable={false}
              drag
              dragConstraints={heroRef}
              dragElastic={0.2}
              initial={{ opacity: 0, scale: 0.6, rotate: s.rotate * 2 }}
              animate={{ opacity: 1, scale: 1, rotate: s.rotate }}
              whileHover={{ scale: 1.08, rotate: 0, zIndex: 20 }}
              whileDrag={{ scale: 1.15, zIndex: 30, cursor: 'grabbing' }}
              transition={{ delay: 0.2 + i * 0.07, type: 'spring', bounce: 0.4 }}
              className="pointer-events-auto absolute w-36 cursor-grab drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] xl:w-40"
              style={{
                top: `${[6, 4, 40, 52, 30, 62][i]}%`,
                left: `${[8, 40, 70, 12, 38, 64][i]}%`,
              }}
            />
          ))}
        </div>
      </section>

      {/* Quick stats */}
      <section>
        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile index={0} label="Jogos" value={battles.length} hint={`${totalRounds} rondas jogadas`} icon={Gamepad2} />
            <StatTile index={1} label="Jogadores" value={players.length} icon={Users} />
            <StatTile index={2} label="Mapa favorito" value={topMap?.map || '—'} hint={topMap ? `${topMap.totalGames} jogos` : undefined} icon={Map} />
            <StatTile index={3} label="Líder" value={ranking[0]?.name || '—'} hint={ranking[0] ? `Score ${ranking[0].score.toFixed(1)}` : undefined} icon={Trophy} tone="accent" />
          </div>
        )}
      </section>

      {/* Recent + Top */}
      <section className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SectionTitle
            action={<Link to="/rogue/jogos" className="text-sm text-muted hover:text-fg">Ver todos →</Link>}
          >
            Últimos jogos
          </SectionTitle>
          <div className="space-y-2.5">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[72px]" />)
              : battles.slice(0, 5).map((b) => <GameCard key={b.id} battle={b} mvp={mvpIndex.get(b.id)} />)}
          </div>
        </div>
        <div className="lg:col-span-2">
          <SectionTitle
            action={<Link to="/rogue/ranking" className="text-sm text-muted hover:text-fg">Completo →</Link>}
          >
            Top 5
          </SectionTitle>
          <Card className="divide-y divide-line">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-3"><Skeleton className="h-9" /></div>)
              : ranking.map((p, i) => (
                <Link
                  key={p.name}
                  to={`/rogue/jogadores/${encodeURIComponent(p.name)}`}
                  className="flex items-center gap-3 p-3 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-white/[0.03]"
                >
                  <Rank value={i + 1} />
                  <Avatar name={p.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted">{p.totalGames} jogos · <WinRate value={p.winRate} /></div>
                  </div>
                  <span className="font-display text-lg font-bold text-accent tabular">{p.score.toFixed(1)}</span>
                </Link>
              ))}
          </Card>
        </div>
      </section>

      {/* Features */}
      <section>
        <SectionTitle>Explorar</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.to}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={`/rogue/${f.to}`}
                className="group block h-full rounded-2xl border border-line bg-surface/70 p-5 transition-all hover:-translate-y-1 hover:border-accent/40 hover:bg-surface-2"
              >
                <div className="mb-4 grid size-10 place-items-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/20 transition-transform group-hover:scale-110">
                  <f.icon className="size-5" />
                </div>
                <h3 className="font-display font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted">{f.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
