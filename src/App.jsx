import { useState } from 'react'
import './App.css'
import BattleForm from './components/BattleForm'
import PlayerStats from './components/PlayerStats'
import OperatorStats from './components/OperatorStats'
import TeamManagement from './components/TeamManagement'
import MapAnalysis from './components/MapAnalysis'
import PlayerRanking from './components/PlayerRanking'
import PlayerComparison from './components/PlayerComparison'
import GameList from './components/GameList'

function App() {
  const [showBattleForm, setShowBattleForm] = useState(false)
  const [showPlayerStats, setShowPlayerStats] = useState(false)
  const [showOperatorStats, setShowOperatorStats] = useState(false)
  const [showTeamManagement, setShowTeamManagement] = useState(false)
  const [showMapAnalysis, setShowMapAnalysis] = useState(false)
  const [showPlayerRanking, setShowPlayerRanking] = useState(false)
  const [showPlayerComparison, setShowPlayerComparison] = useState(false)
  const [showGameList, setShowGameList] = useState(false)


  const handleAddBattle = () => {
    setShowBattleForm(true)
  }

  const handleCloseForm = () => {
    setShowBattleForm(false)
  }


  const handleShowPlayerStats = () => {
    setShowPlayerStats(true)
  }

  const handleClosePlayerStats = () => {
    setShowPlayerStats(false)
  }

  const handleShowOperatorStats = () => {
    setShowOperatorStats(true)
  }

  const handleCloseOperatorStats = () => {
    setShowOperatorStats(false)
  }

  const handleShowTeamManagement = () => {
    setShowTeamManagement(true)
  }

  const handleCloseTeamManagement = () => {
    setShowTeamManagement(false)
  }

  const handleShowMapAnalysis = () => {
    setShowMapAnalysis(true)
  }

  const handleCloseMapAnalysis = () => {
    setShowMapAnalysis(false)
  }

  const handleShowPlayerRanking = () => {
    setShowPlayerRanking(true)
  }

  const handleClosePlayerRanking = () => {
    setShowPlayerRanking(false)
  }

  const handleShowPlayerComparison = () => {
    setShowPlayerComparison(true)
  }

  const handleClosePlayerComparison = () => {
    setShowPlayerComparison(false)
  }

  const handleShowGameList = () => {
    setShowGameList(true)
  }

  const handleCloseGameList = () => {
    setShowGameList(false)
  }


  return (
    <div className="App">
      <header className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="los-text">Rogue </span>
            <span className="chinelos-text">Tracker</span>
          </h1>
          <p className="hero-subtitle">
            Los Chinelos
          </p>
          <div className="hero-buttons">
            <button className="btn-primary btn-large" onClick={handleAddBattle}>
              Adicionar Batalha
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="features-section">
          <h2 className="section-title">Funcionalidades</h2>
          <div className="features-grid">
            <div className="feature-card clickable" onClick={handleShowPlayerStats}>
              <div className="feature-icon">📊</div>
              <h3>Estatísticas Detalhadas</h3>
            </div>
            <div className="feature-card clickable" onClick={handleShowOperatorStats}>
              <div className="feature-icon">🎮</div>
              <h3>Estatísticas de Operadores</h3>
            </div>
            <div className="feature-card clickable" onClick={handleShowTeamManagement}>
              <div className="feature-icon">👥</div>
              <h3>Gestão de Equipa</h3>
            </div>
            <div className="feature-card clickable" onClick={handleShowMapAnalysis}>
              <div className="feature-icon">🎯</div>
              <h3>Análise por Mapa</h3>
            </div>
            <div className="feature-card clickable" onClick={handleShowPlayerRanking}>
              <div className="feature-icon">🏆</div>
              <h3>Rankings</h3>
            </div>
            <div className="feature-card clickable" onClick={handleShowPlayerComparison}>
              <div className="feature-icon">⚔️</div>
              <h3>Comparação 1v1</h3>
            </div>
            <div className="feature-card clickable" onClick={handleShowGameList}>
              <div className="feature-icon">📋</div>
              <h3>Lista de Jogos</h3>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; 2024 Rogue Tracker - Feito para jogadores, por jogadores</p>
      </footer>

      {/* Battle Form Modal */}
          {showBattleForm && (
            <BattleForm 
              onClose={handleCloseForm}
            />
          )}

      {showPlayerStats && (
        <PlayerStats 
          onClose={handleClosePlayerStats}
        />
      )}

      {showOperatorStats && (
        <OperatorStats 
          onClose={handleCloseOperatorStats}
        />
      )}

      {showTeamManagement && (
        <TeamManagement 
          onClose={handleCloseTeamManagement}
        />
      )}

      {showMapAnalysis && (
        <MapAnalysis 
          onClose={handleCloseMapAnalysis}
        />
      )}

      {showPlayerRanking && (
        <PlayerRanking 
          onClose={handleClosePlayerRanking}
        />
      )}

      {showPlayerComparison && (
        <PlayerComparison 
          onClose={handleClosePlayerComparison}
        />
      )}

      {showGameList && (
        <GameList 
          onClose={handleCloseGameList}
        />
      )}
    </div>
  )
}

export default App