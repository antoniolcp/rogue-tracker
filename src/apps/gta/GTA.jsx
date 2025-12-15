import { useState } from 'react'
import './GTA.css'
import { TeamsManager } from './components/TeamsManager'
import { PlaylistsManager } from './components/PlaylistsManager'
import { GlobalRanking } from './components/GlobalRanking'
import { RaceInput } from './components/RaceInput'
import { GTALayout } from './components/GTALayout'
import gtaChar from '../../assets/gta_char_1.png';

function GTA({ onBackToHub }) {
  const [showTeams, setShowTeams] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  // We can add "Add Race" direct modal or just open Playlists/Race input
  const [showAddRace, setShowAddRace] = useState(false);

  // Handlers
  const handleShowTeams = () => setShowTeams(true);
  const handleCloseTeams = () => setShowTeams(false);

  const handleShowPlaylists = () => setShowPlaylists(true);
  const handleClosePlaylists = () => setShowPlaylists(false);

  const handleShowRanking = () => setShowRanking(true);
  const handleCloseRanking = () => setShowRanking(false);

  const handleAddRace = () => {
    setShowAddRace(true);
  };

  return (
    <div className="gta-app">
      {onBackToHub && (
        <button className="back-to-hub-btn" onClick={onBackToHub}>
          Los Chinelos Hub
        </button>
      )}

      {/* Hero Section */}
      <header className="gta-hero">
        <img src={gtaChar} className="gta-hero-char" alt="GTA Characters" />
        <div className="gta-hero-content">
          <h1 className="gta-hero-title">
            <span className="gta-text-main">GTA</span>
            <span className="gta-text-accent">LOS CHINELOS</span>
          </h1>
          <p className="gta-hero-subtitle">Gestor de Corridas e Campeonatos</p>

          <div className="gta-hero-buttons">
            <button className="gta-btn gta-btn-primary" onClick={handleAddRace}>
              ADICIONAR CORRIDA
            </button>
          </div>
        </div>
      </header>

      {/* Main Features Grid */}
      <main className="gta-main">
        <div className="gta-features-grid">
          {/* Ranking */}
          <div className="gta-feature-card" onClick={handleShowRanking}>
            <div className="gta-feature-icon">🏆</div>
            <h3>Classificação</h3>
            <p>Ranking global de pilotos</p>
          </div>

          {/* Playlists / Match History */}
          <div className="gta-feature-card" onClick={handleShowPlaylists}>
            <div className="gta-feature-icon">📋</div>
            <h3>Lista de Corridas</h3>
            <p>Histórico de eventos e corridas</p>
          </div>

          {/* Teams */}
          <div className="gta-feature-card" onClick={handleShowTeams}>
            <div className="gta-feature-icon">👥</div>
            <h3>Gestão de Equipa</h3>
            <p>Adicionar pilotos e equipas</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
        <p>&copy; 2024 Los Chinelos GTA - Wasted but happy</p>
        <button
          style={{ marginTop: '1rem', background: 'transparent', border: '1px solid #444', color: '#444', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.7rem' }}
          onClick={async () => {
            if (window.confirm("⚠️ PERIGO: Tens a certeza que queres APAGAR TODOS OS DADOS (Jogadores, Equipas, Corridas)? Esta ação é irreversível!")) {
              if (window.confirm("Confirmação final: Apagar tudo mesmo?")) {
                const { gtaService } = await import('./services/gtaService');
                await gtaService.resetDatabase();
                window.location.reload();
              }
            }
          }}
        >
          [DEV] RESET DATABASE
        </button>
      </footer>

      {/* Modals / Overlays */}
      {showTeams && (
        <div className="gta-overlay">
          <div className="gta-modal-container">
            <div className="gta-modal-header">
              <h2>Gestão de Equipas</h2>
              <button className="gta-close-btn" onClick={handleCloseTeams}>×</button>
            </div>
            <div className="gta-modal-content">
              <TeamsManager />
            </div>
          </div>
        </div>
      )}

      {showPlaylists && (
        <div className="gta-overlay">
          <div className="gta-modal-container">
            <div className="gta-modal-header">
              {/* Header depends on internal state of manager, maybe simplistic here */}
              <h2>Playlists & Corridas</h2>
              <button className="gta-close-btn" onClick={handleClosePlaylists}>×</button>
            </div>
            <div className="gta-modal-content">
              <PlaylistsManager />
            </div>
          </div>
        </div>
      )}

      {showRanking && (
        <div className="gta-overlay">
          <div className="gta-modal-container">
            <div className="gta-modal-header">
              <h2>Ranking Global</h2>
              <button className="gta-close-btn" onClick={handleCloseRanking}>×</button>
            </div>
            <div className="gta-modal-content">
              <GlobalRanking />
            </div>
          </div>
        </div>
      )}

      {showAddRace && (
        <div className="gta-overlay">
          <div className="gta-modal-container">
            <div className="gta-modal-header">
              <h2>Nova Corrida</h2>
              <button className="gta-close-btn" onClick={() => setShowAddRace(false)}>×</button>
            </div>
            <div className="gta-modal-content">
              {/* RaceInput with direct playlist selection and OCR */}
              <RaceInput
                onRaceAdded={() => {
                  setShowAddRace(false);
                  // Maybe open playlists to show result?
                  setShowPlaylists(true);
                }}
                onCancel={() => setShowAddRace(false)}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default GTA
