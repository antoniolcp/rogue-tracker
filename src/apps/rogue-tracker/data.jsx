import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { subscribeToBattles } from './firebase/battles'
import { subscribeToPlayers } from './firebase/players'
import { buildMvpIndex } from './utils/stats'

const RogueDataContext = createContext(null)

/** Subscreve batalhas e jogadores uma única vez para todas as páginas do Rogue Tracker. */
export function RogueDataProvider({ children }) {
  const [battles, setBattles] = useState(null)
  const [players, setPlayers] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubB = subscribeToBattles(setBattles)
    let unsubP = () => {}
    try {
      unsubP = subscribeToPlayers(setPlayers)
    } catch (e) {
      setError(e)
    }
    return () => {
      unsubB()
      unsubP()
    }
  }, [])

  const value = useMemo(() => {
    const b = battles || []
    return {
      battles: b,
      players: players || [],
      mvpIndex: buildMvpIndex(b),
      loading: battles === null || players === null,
      error,
    }
  }, [battles, players, error])

  return <RogueDataContext.Provider value={value}>{children}</RogueDataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRogueData() {
  const ctx = useContext(RogueDataContext)
  if (!ctx) throw new Error('useRogueData must be used inside <RogueDataProvider>')
  return ctx
}
