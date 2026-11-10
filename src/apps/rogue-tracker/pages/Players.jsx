import { useNavigate } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { PageHeader, PageSkeleton, PlayerPicker } from '../../../components/ui'
import { useRogueData } from '../data'

export default function Players() {
  const { players, loading } = useRogueData()
  const navigate = useNavigate()
  if (loading) return <PageSkeleton />
  return (
    <>
      <PageHeader
        eyebrow="Estatísticas detalhadas"
        icon={BarChart3}
        title="Jogadores"
        description="Escolhe um jogador para ver o perfil completo, evolução e melhores performances."
      />
      <PlayerPicker
        players={players}
        onSelect={(name) => navigate(`/rogue/jogadores/${encodeURIComponent(name)}`)}
        emptyText="Nenhum jogador encontrado. Adiciona uma batalha primeiro!"
      />
    </>
  )
}
