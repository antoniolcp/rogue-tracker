import { Link } from 'react-router-dom'
import { BarChart3, Crosshair, Home, ListOrdered, Map, Medal, Plus, Swords, Trophy, Users } from 'lucide-react'
import { AppShell } from '../../components/layout/AppShell'
import { Button } from '../../components/ui'
import { RogueDataProvider } from './data'

const nav = [
  { to: '/rogue', label: 'Início', icon: Home, end: true },
  { to: '/rogue/jogos', label: 'Jogos', icon: ListOrdered },
  { to: '/rogue/ranking', label: 'Ranking', icon: Trophy },
  { to: '/rogue/jogadores', label: 'Jogadores', icon: BarChart3 },
  { to: '/rogue/operadores', label: 'Operadores', icon: Crosshair },
  { to: '/rogue/mapas', label: 'Mapas', icon: Map },
  { to: '/rogue/equipa', label: 'Equipa', icon: Users },
  { to: '/rogue/comparar', label: '1v1', icon: Swords },
  { to: '/rogue/recordes', label: 'Recordes', icon: Medal },
]

export default function RogueLayout() {
  return (
    <RogueDataProvider>
      <AppShell
        app="rogue"
        nav={nav}
        brand={
          <>
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-2 font-display text-sm font-black text-accent-fg shadow-[0_0_24px_-6px_var(--accent)]">
              R
            </span>
            <span className="hidden font-display text-[15px] leading-tight font-bold tracking-tight sm:block">
              Rogue <span className="text-gradient">Tracker</span>
            </span>
          </>
        }
        cta={
          <Button as={Link} to="/rogue/nova" variant="primary" size="md">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nova batalha</span>
          </Button>
        }
        footer={<p>Rogue Tracker · Los Chinelos — feito para jogadores, por jogadores.</p>}
      />
    </RogueDataProvider>
  )
}
