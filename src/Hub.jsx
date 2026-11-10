import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, Car, Crosshair, Trophy } from 'lucide-react'
import { Backdrop } from './components/layout/Backdrop'

const apps = [
  {
    to: '/rogue',
    app: 'rogue',
    name: 'Rogue Tracker',
    desc: 'Batalhas Strikeout 4v4, rankings, MVPs, operadores e mapas.',
    icon: Crosshair,
    badge: 'Ativo',
    image: '/ChatGPT_Image_Oct_20__2025__01_07_23_PM-removebg-preview.png',
  },
  {
    to: '/gta',
    app: 'gta',
    name: 'GTA Racing',
    desc: 'Campeonatos, classificação por pontos e equipas equilibradas.',
    icon: Car,
    badge: 'Ativo',
  },
  {
    to: '/olimpics',
    app: 'olimpics',
    name: 'Chins Olimpics',
    desc: 'As equipas oficiais para as Olimpíadas dos Chinelos.',
    icon: Trophy,
    badge: 'Novo',
  },
]

export default function Hub() {
  return (
    <div className="relative min-h-dvh">
      <Backdrop />
      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 py-16 md:px-6 md:py-24">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-muted uppercase">
          <span className="size-1.5 animate-pulse rounded-full bg-win" /> Hub
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.5 }}
          className="font-display text-6xl leading-[0.9] font-bold tracking-tighter md:text-8xl lg:text-9xl"
        >
          Los
          <br />
          <span className="bg-gradient-to-r from-[#f2161d] via-[#facc15] to-[#5cb531] bg-clip-text text-transparent">Chinelos</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6 max-w-md text-lg text-muted">
          Estatísticas, rivalidades e glória eterna. Escolhe o jogo.
        </motion.p>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {apps.map((a, i) => (
            <motion.div
              key={a.to}
              data-app={a.app}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.08, type: 'spring', bounce: 0.25 }}
            >
              <Link
                to={a.to}
                className="group relative flex h-full min-h-72 flex-col overflow-hidden rounded-3xl border border-line bg-surface/70 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/50 hover:shadow-[0_30px_80px_-30px_var(--accent)]"
              >
                <div className="absolute -top-24 -right-24 size-64 rounded-full bg-accent opacity-[0.07] blur-3xl transition-opacity duration-500 group-hover:opacity-25" />
                <div className="relative flex items-start justify-between">
                  <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-accent-fg shadow-[0_10px_30px_-10px_var(--accent)] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                    <a.icon className="size-6" />
                  </div>
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">{a.badge}</span>
                </div>
                <div className="relative mt-auto pt-16">
                  <h2 className="font-display text-2xl font-bold tracking-tight">{a.name}</h2>
                  <p className="mt-2 text-sm text-muted">{a.desc}</p>
                  <div className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-accent">
                    Abrir <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
                {a.image && (
                  <img
                    src={a.image}
                    alt=""
                    className="pointer-events-none absolute right-2 bottom-2 w-24 rotate-6 opacity-0 transition-all duration-300 group-hover:rotate-0 group-hover:opacity-100"
                  />
                )}
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mt-auto pt-16 text-sm text-subtle">© Los Chinelos · Wasted but happy.</p>
      </div>
    </div>
  )
}
