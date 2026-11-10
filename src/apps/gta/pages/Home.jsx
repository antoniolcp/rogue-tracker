import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Crown, Flag, Plus, Timer, Trophy, Users } from 'lucide-react'
import { Avatar, Button, Card, Rank, Skeleton, StatTile } from '../../../components/ui'
import { SectionTitle } from '../../../components/ui/PageHeader'
import gtaChar from '../../../assets/gta_char_1.png'
import { useGtaData } from '../data'
import { computeIndividualRanking, formatPlaylistDate, sortIndividual } from '../utils/stats'

export default function GtaHome() {
  const { players, playlists, races, loading } = useGtaData()
  const top = useMemo(() => sortIndividual(computeIndividualRanking(players, races), 'total').slice(0, 5), [players, races])

  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-3xl border border-line bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--accent)_25%,transparent),transparent_60%),linear-gradient(135deg,var(--surface-2),var(--bg))] px-6 py-14 md:px-12 md:py-20">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent_0_22px,rgb(255_255_255/0.015)_22px_44px)]" />
        <div className="relative z-10 max-w-xl">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold tracking-wider text-accent uppercase">
            <Timer className="size-3.5" /> Gestor de corridas e campeonatos
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="font-display text-6xl leading-[0.9] font-black tracking-tight uppercase italic md:text-8xl">
            GTA
            <br />
            <span className="text-gradient">Los Chinelos</span>
          </motion.h1>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mt-8 flex flex-wrap gap-3">
            <Button as={Link} to="/gta/nova" variant="primary" size="lg"><Plus className="size-5" /> Adicionar corrida</Button>
            <Button as={Link} to="/gta/classificacao" variant="outline" size="lg">Classificação <ArrowRight className="size-4" /></Button>
          </motion.div>
        </div>
        <motion.img
          src={gtaChar}
          alt=""
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, type: 'spring', bounce: 0.25 }}
          className="pointer-events-none absolute right-0 bottom-0 hidden h-[115%] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)] md:block"
        />
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <StatTile index={0} label="Pilotos" value={players.length} icon={Users} />
            <StatTile index={1} label="Campeonatos" value={playlists.length} icon={Flag} />
            <StatTile index={2} label="Corridas" value={races.length} icon={Timer} />
            <StatTile index={3} label="Líder" value={top[0]?.name || '—'} hint={top[0] ? `${top[0].stats.totalPoints} pts` : undefined} icon={Trophy} tone="accent" />
          </>
        )}
      </section>

      <section className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SectionTitle action={<Link to="/gta/campeonatos" className="text-sm text-muted hover:text-fg">Ver todos →</Link>}>Últimos campeonatos</SectionTitle>
          <div className="space-y-2.5">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[72px]" />)
              : playlists.slice(0, 5).map((pl) => <ChampionshipRow key={pl.id} pl={pl} />)}
          </div>
        </div>
        <div className="lg:col-span-2">
          <SectionTitle action={<Link to="/gta/classificacao" className="text-sm text-muted hover:text-fg">Completa →</Link>}>Top 5 pilotos</SectionTitle>
          <Card className="divide-y divide-line">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-3"><Skeleton className="h-9" /></div>)
              : top.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 p-3">
                  <Rank value={i + 1} />
                  <Avatar name={p.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted">{p.stats.races} corridas · {p.championships} 🏆</div>
                  </div>
                  <span className="font-display text-lg font-bold text-accent tabular">{p.stats.totalPoints}</span>
                </div>
              ))}
          </Card>
        </div>
      </section>
    </div>
  )
}

export function ChampionshipRow({ pl }) {
  return (
    <Link
      to={`/gta/campeonatos/${pl.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-line bg-surface/70 p-4 transition-all hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface-2"
    >
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/20">
        <Flag className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{pl.name}</div>
        <div className="text-xs text-muted">{formatPlaylistDate(pl.date, { day: 'numeric', month: 'short', year: 'numeric' })} · {pl.raceCount || 0} corridas</div>
      </div>
      {pl.winner && (
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <Crown className="size-4 shrink-0 text-gold" />
          <span className="max-w-[8rem] truncate font-medium">{pl.winner}</span>
        </div>
      )}
    </Link>
  )
}
