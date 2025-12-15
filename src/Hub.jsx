import { useState } from 'react'
import './Hub.css'
import RogueTracker from './apps/rogue-tracker/RogueTracker'
import GTA from './apps/gta/GTA'

function Hub() {
  const [currentApp, setCurrentApp] = useState(null) // null, 'rogue', 'gta'

  const handleOpenRogue = () => {
    setCurrentApp('rogue')
  }

  const handleOpenGTA = () => {
    setCurrentApp('gta')
  }

  const handleBackToHub = () => {
    setCurrentApp(null)
  }

  // Se uma aplicação está aberta, mostrar ela
  if (currentApp === 'rogue') {
    return <RogueTracker onBackToHub={handleBackToHub} />
  }

  if (currentApp === 'gta') {
    return <GTA onBackToHub={handleBackToHub} />
  }

  // Mostrar o hub principal
  return (
    <div className="hub-container">
      <div className="hub-content">
        <h1 className="hub-title">Los Chinelos Hub</h1>

        <div className="apps-grid">
          <div className="app-card" onClick={handleOpenRogue}>
            <div className="app-icon">🎮</div>
            <h2 className="app-name">ROGUE Tracker</h2>
            <div className="app-badge">Ativo</div>
          </div>

          <div className="app-card" onClick={handleOpenGTA}>
            <div className="app-icon">🚗</div>
            <h2 className="app-name">GTA</h2>
            <div className="app-badge coming-soon">Ativo</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hub
