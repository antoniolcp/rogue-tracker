import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { playersRef, playlistsRef, racesRef } from './services/firebase'

const GtaDataContext = createContext(null)

const toList = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))

/** Subscrição em tempo real a pilotos, campeonatos e corridas. */
export function GtaDataProvider({ children }) {
  const [players, setPlayers] = useState(null)
  const [playlists, setPlaylists] = useState(null)
  const [races, setRaces] = useState(null)

  useEffect(() => {
    const unsubs = [
      onSnapshot(playersRef, (s) => setPlayers(toList(s))),
      onSnapshot(playlistsRef, (s) => setPlaylists(toList(s).sort((a, b) => b.date?.seconds - a.date?.seconds))),
      onSnapshot(racesRef, (s) => setRaces(toList(s))),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  const value = useMemo(
    () => ({
      players: players || [],
      playlists: playlists || [],
      races: races || [],
      loading: players === null || playlists === null || races === null,
    }),
    [players, playlists, races],
  )

  return <GtaDataContext.Provider value={value}>{children}</GtaDataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGtaData() {
  const ctx = useContext(GtaDataContext)
  if (!ctx) throw new Error('useGtaData must be used inside <GtaDataProvider>')
  return ctx
}
