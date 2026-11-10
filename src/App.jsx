import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ConfirmProvider } from './components/ui'
import { PageSkeleton } from './components/ui/Skeleton'
import Hub from './Hub'

const RogueLayout = lazy(() => import('./apps/rogue-tracker/RogueLayout'))
const RogueHome = lazy(() => import('./apps/rogue-tracker/pages/Home'))
const AddBattle = lazy(() => import('./apps/rogue-tracker/pages/AddBattle'))
const Games = lazy(() => import('./apps/rogue-tracker/pages/Games'))
const GameDetail = lazy(() => import('./apps/rogue-tracker/pages/GameDetail'))
const Ranking = lazy(() => import('./apps/rogue-tracker/pages/Ranking'))
const Players = lazy(() => import('./apps/rogue-tracker/pages/Players'))
const PlayerDetail = lazy(() => import('./apps/rogue-tracker/pages/PlayerDetail'))
const Operators = lazy(() => import('./apps/rogue-tracker/pages/Operators'))
const Maps = lazy(() => import('./apps/rogue-tracker/pages/Maps'))
const Team = lazy(() => import('./apps/rogue-tracker/pages/Team'))
const Compare = lazy(() => import('./apps/rogue-tracker/pages/Compare'))
const Records = lazy(() => import('./apps/rogue-tracker/pages/Records'))

const GtaLayout = lazy(() => import('./apps/gta/GtaLayout'))
const GtaHome = lazy(() => import('./apps/gta/pages/Home'))
const GtaRanking = lazy(() => import('./apps/gta/pages/Ranking'))
const Championships = lazy(() => import('./apps/gta/pages/Championships'))
const ChampionshipDetail = lazy(() => import('./apps/gta/pages/ChampionshipDetail'))
const GtaTeams = lazy(() => import('./apps/gta/pages/Teams'))
const NewRace = lazy(() => import('./apps/gta/pages/NewRace'))

const ChinsOlimpics = lazy(() => import('./apps/chins-olimpics/ChinsOlimpics'))

function Fallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 md:px-6">
      <PageSkeleton />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ConfirmProvider>
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/" element={<Hub />} />

            <Route path="/rogue" element={<RogueLayout />}>
              <Route index element={<RogueHome />} />
              <Route path="nova" element={<AddBattle />} />
              <Route path="jogos" element={<Games />} />
              <Route path="jogos/:id" element={<GameDetail />} />
              <Route path="ranking" element={<Ranking />} />
              <Route path="jogadores" element={<Players />} />
              <Route path="jogadores/:name" element={<PlayerDetail />} />
              <Route path="operadores" element={<Operators />} />
              <Route path="mapas" element={<Maps />} />
              <Route path="equipa" element={<Team />} />
              <Route path="comparar" element={<Compare />} />
              <Route path="recordes" element={<Records />} />
            </Route>

            <Route path="/gta" element={<GtaLayout />}>
              <Route index element={<GtaHome />} />
              <Route path="nova" element={<NewRace />} />
              <Route path="classificacao" element={<GtaRanking />} />
              <Route path="campeonatos" element={<Championships />} />
              <Route path="campeonatos/:id" element={<ChampionshipDetail />} />
              <Route path="equipas" element={<GtaTeams />} />
            </Route>

            <Route path="/olimpics" element={<ChinsOlimpics />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Toaster theme="dark" position="bottom-right" richColors closeButton toastOptions={{ className: 'font-sans' }} />
      </ConfirmProvider>
    </BrowserRouter>
  )
}
