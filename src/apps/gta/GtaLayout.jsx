import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Flag, Home, Plus, Trash2, Trophy, Users } from 'lucide-react'
import { AppShell } from '../../components/layout/AppShell'
import { Button, useConfirm } from '../../components/ui'
import { GtaDataProvider } from './data'

const nav = [
  { to: '/gta', label: 'Início', icon: Home, end: true },
  { to: '/gta/classificacao', label: 'Classificação', icon: Trophy },
  { to: '/gta/campeonatos', label: 'Campeonatos', icon: Flag },
  { to: '/gta/equipas', label: 'Equipas', icon: Users },
]

export default function GtaLayout() {
  return (
    <GtaDataProvider>
      <AppShell
        app="gta"
        nav={nav}
        brand={
          <>
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-2 font-display text-[11px] font-black text-accent-fg shadow-[0_0_24px_-6px_var(--accent)]">
              GTA
            </span>
            <span className="hidden font-display text-[15px] leading-tight font-bold tracking-tight sm:block">
              Los Chinelos <span className="text-gradient">Racing</span>
            </span>
          </>
        }
        cta={
          <Button as={Link} to="/gta/nova" variant="primary">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nova corrida</span>
          </Button>
        }
        footer={<GtaFooter />}
      />
    </GtaDataProvider>
  )
}

function GtaFooter() {
  const confirm = useConfirm()

  const reset = async () => {
    const ok = await confirm({
      title: 'Apagar todos os dados do GTA?',
      description: 'Jogadores, equipas, campeonatos e corridas serão apagados. Esta ação é irreversível!',
      confirmText: 'Apagar tudo',
      danger: true,
      typeToConfirm: 'APAGAR',
    })
    if (!ok) return
    const id = toast.loading('A apagar base de dados…')
    const { gtaService } = await import('./services/gtaService')
    await gtaService.resetDatabase()
    toast.success('Base de dados apagada.', { id })
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p>Los Chinelos GTA — Wasted but happy.</p>
      <Button variant="ghost" size="sm" onClick={reset} className="text-subtle hover:text-loss">
        <Trash2 className="size-3.5" /> [DEV] Reset database
      </Button>
    </div>
  )
}
