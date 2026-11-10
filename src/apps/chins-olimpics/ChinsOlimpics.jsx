import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Flame, Trophy } from 'lucide-react'
import { Avatar } from '../../components/ui'
import { Backdrop } from '../../components/layout/Backdrop'

// Equipas re-equilibradas manualmente para Rogue Tracker
const STATIC_TEAMS = {
  team1: [
    { name: 'Gametti' },
    { name: 'franciscomrfe' },
    { name: 'tiagofranca6' },
    { name: 'miguel_paisana' },
    { name: 'duartealmeida8' },
    { name: 'martim1087' },
    { name: 'pedro_jl76' },
  ],
  team2: [
    { name: 'antoniolamycp9' },
    { name: 'BARROSA10' },
    { name: 'fifagomesg-19' },
    { name: 'Andre_santinho' },
    { name: 'DiogoFrancxssco' },
    { name: 'Duarte_Sogalho' },
    { name: 'Benny_Fuego' },
    { name: 'TheRealSantana-' },
  ],
}

const TEAMS = [
  { key: 'team1', label: 'Equipa Vermelha', color: '#f43f5e' },
  { key: 'team2', label: 'Equipa Azul', color: '#3b82f6' },
]

export default function ChinsOlimpics() {
  return (
    <div data-app="olimpics" className="relative min-h-dvh">
      <Backdrop />
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg">
          <ArrowLeft className="size-4" /> Los Chinelos Hub
        </Link>

        <header className="mt-10 mb-12 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="mx-auto mb-6 grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-accent to-accent-2 text-accent-fg shadow-[0_0_60px_-10px_var(--accent)]"
          >
            <Trophy className="size-10" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-5xl font-black tracking-tight uppercase md:text-7xl"
          >
            Chins <span className="text-gradient">Olimpics</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-3 text-muted">
            {STATIC_TEAMS.team1.length + STATIC_TEAMS.team2.length} atletas · 2 equipas · 1 glória
          </motion.p>
        </header>

        <div className="relative grid gap-6 md:grid-cols-2 md:gap-16">
          <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:block">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', bounce: 0.5 }}
              className="grid size-16 place-items-center rounded-full border border-line-strong bg-surface font-display text-lg font-black shadow-2xl"
            >
              VS
            </motion.div>
          </div>

          {TEAMS.map((t, ti) => (
            <motion.section
              key={t.key}
              initial={{ opacity: 0, x: ti === 0 ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, type: 'spring', bounce: 0.2 }}
              className="overflow-hidden rounded-3xl border bg-surface/80 backdrop-blur"
              style={{ borderColor: `color-mix(in oklab, ${t.color} 40%, transparent)` }}
            >
              <div
                className="flex items-center justify-between px-6 py-5"
                style={{ background: `linear-gradient(110deg, color-mix(in oklab, ${t.color} 25%, transparent), transparent)` }}
              >
                <div className="flex items-center gap-3">
                  <Flame className="size-5" style={{ color: t.color }} />
                  <h2 className="font-display text-xl font-bold" style={{ color: t.color }}>{t.label}</h2>
                </div>
                <span className="text-sm text-muted tabular">{STATIC_TEAMS[t.key].length} atletas</span>
              </div>
              <ul className="divide-y divide-line">
                {STATIC_TEAMS[t.key].map((p, i) => (
                  <motion.li
                    key={p.name}
                    initial={{ opacity: 0, x: ti === 0 ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-center gap-3 px-6 py-3.5"
                  >
                    <span className="w-5 text-xs text-subtle tabular">{i + 1}</span>
                    <Avatar name={p.name} size="sm" color={t.color} />
                    <span className="font-medium">{p.name}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  )
}
