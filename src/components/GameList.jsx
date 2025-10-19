import { useState, useEffect } from 'react';
import { subscribeToBattles } from '../firebase/battles';
import './GameList.css';

const GameList = ({ onClose }) => {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);

  // Subscrever às batalhas em tempo real
  useEffect(() => {
    const unsubscribe = subscribeToBattles((battlesData) => {
      setBattles(battlesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Agrupar batalhas por data
  const groupBattlesByDate = () => {
    const groupedBattles = {};
    
    battles.forEach(battle => {
      const date = new Date(battle.createdAt?.toDate ? battle.createdAt.toDate() : battle.createdAt);
      const dateKey = date.toLocaleDateString('pt-PT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
      
      if (!groupedBattles[dateKey]) {
        groupedBattles[dateKey] = [];
      }
      groupedBattles[dateKey].push(battle);
    });

    // Ordenar por data (mais recente primeiro)
    return Object.entries(groupedBattles)
      .sort(([a], [b]) => {
        const dateA = new Date(a.split(', ')[1] + ' ' + a.split(', ')[0]);
        const dateB = new Date(b.split(', ')[1] + ' ' + b.split(', ')[0]);
        return dateB - dateA;
      });
  };



  if (loading) {
    return (
      <div className="game-list-overlay">
        <div className="game-list-container">
          <div className="loading">Carregando jogos...</div>
        </div>
      </div>
    );
  }

  const groupedBattles = groupBattlesByDate();

  // Criar lista de todos os jogos com data
  const allGamesWithDate = [];
  groupedBattles.forEach(([dateKey, dayBattles]) => {
    dayBattles.forEach((battle, index) => {
      allGamesWithDate.push({
        ...battle,
        dateKey,
        gameNumber: index + 1
      });
    });
  });

  // Formatar número
  const formatNumber = (num) => {
    if (!num || num === 0) return '0';
    return Math.round(num).toString();
  };

  // Formatar data e hora
  const formatDateTime = (date) => {
    const d = new Date(date?.toDate ? date.toDate() : date);
    return d.toLocaleString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular MVP do jogo
  const calculateMVP = (battle) => {
    const allPlayers = [...battle.team1, ...battle.team2];
    
    // Pesos para cada estatística
    const weights = {
      win: 0.25,
      downs: 0.45,
      damage: 0.15,
      revives: 0.10,
      captures: 0.05
    };

    // Encontrar valores máximos para normalização
    const maxValues = {
      downs: Math.max(...allPlayers.map(p => p.downs || 0)),
      damage: Math.max(...allPlayers.map(p => p.damage || 0)),
      revives: Math.max(...allPlayers.map(p => p.revives || 0)),
      captures: Math.max(...allPlayers.map(p => p.captures || 0))
    };

    // Calcular score para cada jogador
    const playerScores = allPlayers.map(player => {
      const isWinner = (battle.team1.includes(player) && battle.result === 'win') || 
                      (battle.team2.includes(player) && battle.result === 'loss');
      
      const winScore = isWinner ? 1 : 0;
      const downsScore = maxValues.downs > 0 ? (player.downs || 0) / maxValues.downs : 0;
      const damageScore = maxValues.damage > 0 ? (player.damage || 0) / maxValues.damage : 0;
      const revivesScore = maxValues.revives > 0 ? (player.revives || 0) / maxValues.revives : 0;
      const capturesScore = maxValues.captures > 0 ? (player.captures || 0) / maxValues.captures : 0;

      const totalScore = 
        (winScore * weights.win) +
        (downsScore * weights.downs) +
        (damageScore * weights.damage) +
        (revivesScore * weights.revives) +
        (capturesScore * weights.captures);

      return {
        player,
        score: totalScore
      };
    });

    // Ordenar por score e retornar o MVP
    playerScores.sort((a, b) => b.score - a.score);
    return playerScores[0].player;
  };

  // Calcular número de MVPs por jogador
  const calculatePlayerMVPs = (playerName) => {
    return battles.filter(battle => {
      const mvp = calculateMVP(battle);
      return mvp && mvp.name === playerName;
    }).length;
  };

  return (
    <div className="game-list-overlay">
      <div className="game-list-container">
        <div className="game-list-header">
          <h2>🎮 Lista de Jogos</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="game-list-content">
          {!selectedGame ? (
            // Vista de seleção de jogos
            <div className="games-selection">
              {allGamesWithDate.length === 0 ? (
                <div className="no-games">
                  <p>Nenhum jogo encontrado.</p>
                </div>
              ) : (
                <div className="games-grid">
                  {allGamesWithDate.map((battle, index) => {
                    return (
                      <button
                        key={battle.id || index}
                        className="game-card"
                        onClick={() => setSelectedGame(battle)}
                      >
                        <div className="game-title">
                          <div className="game-date">{battle.dateKey}</div>
                          <div className="game-number">Jogo {battle.gameNumber}</div>
                        </div>
                        <div className="game-summary">
                          <div className="game-info">
                            <div className="game-map">{battle.map || 'Mapa não definido'}</div>
                            <div className="game-rounds">
                              {battle.team1Rounds || 0} - {battle.team2Rounds || 0}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            // Vista detalhada do jogo selecionado
            <div className="game-detail">
              <div className="detail-header">
                <button 
                  className="back-btn"
                  onClick={() => setSelectedGame(null)}
                >
                  ← Voltar
                </button>
                <h3>{selectedGame.dateKey} - Jogo {selectedGame.gameNumber}</h3>
                <div className="game-info-header">
                  <span className="game-time">{formatDateTime(selectedGame.createdAt)}</span>
                  <span className="game-map">{selectedGame.map || 'Mapa não definido'}</span>
                  <span className="game-rounds">
                    {selectedGame.team1Rounds || 0} - {selectedGame.team2Rounds || 0}
                  </span>
                </div>
              </div>

              {/* MVP Section */}
              <div className="mvp-section">
                <div className="mvp-header">
                  <span className="mvp-icon">🏆</span>
                  <span className="mvp-label">MVP DO JOGO</span>
                </div>
                <div className="mvp-player">
                  {(() => {
                    const mvp = calculateMVP(selectedGame);
                    return (
                      <div className="mvp-info">
                        <div className="mvp-avatar">
                          <div className="avatar-circle mvp-avatar-circle">
                            {mvp.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="mvp-details">
                          <div className="mvp-name">{mvp.name}</div>
                          <div className="mvp-operator">{mvp.operator || 'Sem operador'}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="game-details">
                {/* Team 1 */}
                <div className="team-section team1">
                  <div className="team-header">
                    <div className="team-number">1</div>
                    <div className="team-label">TEAM 1</div>
                    <div className={`team-result ${selectedGame.result === 'win' ? 'win' : 'loss'}`}>
                      {selectedGame.result === 'win' ? '🏆 GANHOU' : '❌ PERDEU'}
                    </div>
                  </div>
                  <div className="team-players">
                    {selectedGame.team1.map((player, i) => {
                      const mvp = calculateMVP(selectedGame);
                      const isMVP = mvp.name === player.name;
                      return (
                        <div key={i} className={`player-row ${isMVP ? 'mvp-player' : ''}`}>
                          <div className="player-avatar">
                            <div className={`avatar-circle ${isMVP ? 'mvp-avatar-circle' : ''}`}>
                              {player.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="player-info">
                            <div className={`player-name ${isMVP ? 'mvp-name' : ''}`}>{player.name}</div>
                            <div className="player-operator">{player.operator || 'Sem operador'}</div>
                          </div>
                          <div className="player-stats">
                            <div className="stat-item">
                              <span className="stat-label">ELIMS</span>
                              <span className="stat-value">{player.elims || 0}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">DOWNS</span>
                              <span className="stat-value">{player.downs || 0}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">ASSISTS</span>
                              <span className="stat-value">{player.assists || 0}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">CAPTURES</span>
                              <span className="stat-value">{player.captures || 0}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">DAMAGE</span>
                              <span className="stat-value">{formatNumber(player.damage || 0)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Team 2 */}
                <div className="team-section team2">
                  <div className="team-header">
                    <div className="team-number">2</div>
                    <div className="team-label">TEAM 2</div>
                    <div className={`team-result ${selectedGame.result === 'loss' ? 'win' : 'loss'}`}>
                      {selectedGame.result === 'loss' ? '🏆 GANHOU' : '❌ PERDEU'}
                    </div>
                  </div>
                  <div className="team-players">
                    {selectedGame.team2.map((player, i) => {
                      const mvp = calculateMVP(selectedGame);
                      const isMVP = mvp.name === player.name;
                      return (
                        <div key={i} className={`player-row ${isMVP ? 'mvp-player' : ''}`}>
                          <div className="player-avatar">
                            <div className={`avatar-circle ${isMVP ? 'mvp-avatar-circle' : ''}`}>
                              {player.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="player-info">
                            <div className={`player-name ${isMVP ? 'mvp-name' : ''}`}>{player.name}</div>
                            <div className="player-operator">{player.operator || 'Sem operador'}</div>
                          </div>
                          <div className="player-stats">
                            <div className="stat-item">
                              <span className="stat-label">ELIMS</span>
                              <span className="stat-value">{player.elims || 0}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">DOWNS</span>
                              <span className="stat-value">{player.downs || 0}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">ASSISTS</span>
                              <span className="stat-value">{player.assists || 0}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">CAPTURES</span>
                              <span className="stat-value">{player.captures || 0}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">DAMAGE</span>
                              <span className="stat-value">{formatNumber(player.damage || 0)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameList;
