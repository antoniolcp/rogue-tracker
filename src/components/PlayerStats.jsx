import { useState, useEffect } from 'react';
import { getPlayers } from '../firebase/players';
import { subscribeToBattles } from '../firebase/battles';
import './PlayerStats.css';

const PlayerStats = ({ onClose }) => {
  const [players, setPlayers] = useState([]);
  const [battles, setBattles] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const playersData = await getPlayers();
        setPlayers(playersData);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar jogadores:', error);
        setLoading(false);
      }
    };

    loadPlayers();
  }, []);

  // Subscrever às batalhas em tempo real
  useEffect(() => {
    const unsubscribe = subscribeToBattles((battlesData) => {
      setBattles(battlesData);
    });

    return () => unsubscribe();
  }, []);

  const handlePlayerSelect = (playerName) => {
    const player = players.find(p => p.name === playerName);
    setSelectedPlayer(player);
  };

  const formatNumber = (num) => {
    if (!num || num === 0) return '0';
    return Math.round(num).toString();
  };

  const formatPercentage = (value) => {
    if (!value || value === 0) return '0%';
    return `${Math.round(value)}%`;
  };

  // Calcular MVP de um jogo
  const calculateMVP = (battle) => {
    const allPlayers = [...battle.team1, ...battle.team2];
    const weights = {
      win: 0.25,
      downs: 0.45,
      damage: 0.15,
      revives: 0.10,
      captures: 0.05
    };
    
    const maxValues = {
      downs: Math.max(...allPlayers.map(p => p.downs || 0)),
      damage: Math.max(...allPlayers.map(p => p.damage || 0)),
      revives: Math.max(...allPlayers.map(p => p.revives || 0)),
      captures: Math.max(...allPlayers.map(p => p.captures || 0))
    };
    
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

  if (loading) {
    return (
      <div className="player-stats-overlay">
        <div className="player-stats-container">
          <div className="loading">Carregando jogadores...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="player-stats-overlay">
      <div className="player-stats-container">
        <div className="player-stats-header">
          <h2>📊 Estatísticas Detalhadas</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="player-stats-content">
          {!selectedPlayer ? (
            <div className="player-selection">
              <div className="players-grid">
                {players.length === 0 ? (
                  <p className="no-players">Nenhum jogador encontrado. Adiciona uma batalha primeiro!</p>
                ) : (
                  players.map((player) => (
                    <button
                      key={player.name}
                      className="player-card"
                      onClick={() => handlePlayerSelect(player.name)}
                    >
                      <div className="player-name">{player.name}</div>
                      <div className="player-games">{player.totalGames} jogos</div>
                      <div className="player-winrate">{formatPercentage(player.winRate)} win rate</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="player-details">
              <div className="player-header">
                <h3>{selectedPlayer.name}</h3>
                <button 
                  className="back-btn"
                  onClick={() => setSelectedPlayer(null)}
                >
                  ← Voltar
                </button>
              </div>

              <div className="stats-tables">
                {/* Estatísticas Gerais */}
                <div className="stats-section">
                  <h4>📈 Estatísticas Gerais</h4>
                  <table className="stats-table">
                    <tbody>
                      <tr>
                        <td>Total de Jogos</td>
                        <td>{selectedPlayer.totalGames}</td>
                      </tr>
                      <tr>
                        <td>Vitórias</td>
                        <td className="win">{selectedPlayer.totalWins}</td>
                      </tr>
                      <tr>
                        <td>Derrotas</td>
                        <td className="loss">{selectedPlayer.totalLosses}</td>
                      </tr>
                      <tr>
                        <td>Win Rate</td>
                        <td className="winrate">{formatPercentage(selectedPlayer.winRate)}</td>
                      </tr>
                      <tr>
                        <td>MVPs</td>
                        <td className="mvp">{calculatePlayerMVPs(selectedPlayer.name)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Estatísticas de Combate */}
                <div className="stats-section">
                  <h4>⚔️ Estatísticas de Combate</h4>
                  <table className="stats-table">
                    <tbody>
                      <tr>
                        <td>Total Eliminações</td>
                        <td>{formatNumber(selectedPlayer.totalElims)}</td>
                      </tr>
                      <tr>
                        <td>Total Downs</td>
                        <td>{formatNumber(selectedPlayer.totalDowns)}</td>
                      </tr>
                      <tr>
                        <td>Total Assists</td>
                        <td>{formatNumber(selectedPlayer.totalAssists)}</td>
                      </tr>
                      <tr>
                        <td>Total Revives</td>
                        <td>{formatNumber(selectedPlayer.totalRevives)}</td>
                      </tr>
                      <tr>
                        <td>Total Damage</td>
                        <td>{formatNumber(selectedPlayer.totalDamage)}</td>
                      </tr>
                      <tr>
                        <td>Total Captures</td>
                        <td>{formatNumber(selectedPlayer.totalCaptures)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Médias por Jogo */}
                <div className="stats-section">
                  <h4>📊 Médias por Jogo</h4>
                  <table className="stats-table">
                    <tbody>
                      <tr>
                        <td>Elims/Jogo</td>
                        <td>{selectedPlayer.avgElims}</td>
                      </tr>
                      <tr>
                        <td>Downs/Jogo</td>
                        <td>{selectedPlayer.avgDowns}</td>
                      </tr>
                      <tr>
                        <td>Assists/Jogo</td>
                        <td>{selectedPlayer.avgAssists}</td>
                      </tr>
                      <tr>
                        <td>Revives/Jogo</td>
                        <td>{selectedPlayer.avgRevives}</td>
                      </tr>
                      <tr>
                        <td>Damage/Jogo</td>
                        <td>{formatNumber(selectedPlayer.avgDamage)}</td>
                      </tr>
                      <tr>
                        <td>Captures/Jogo</td>
                        <td>{selectedPlayer.avgCaptures}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Melhores Performances */}
                <div className="stats-section">
                  <h4>🏆 Melhores Performances</h4>
                  <table className="stats-table">
                    <tbody>
                      <tr>
                        <td>Melhor Eliminações</td>
                        <td className="best">{selectedPlayer.bestElims}</td>
                      </tr>
                      <tr>
                        <td>Melhor Downs</td>
                        <td className="best">{selectedPlayer.bestDowns}</td>
                      </tr>
                      <tr>
                        <td>Melhor Assists</td>
                        <td className="best">{selectedPlayer.bestAssists}</td>
                      </tr>
                      <tr>
                        <td>Melhor Revives</td>
                        <td className="best">{selectedPlayer.bestRevives}</td>
                      </tr>
                      <tr>
                        <td>Melhor Damage</td>
                        <td className="best">{formatNumber(selectedPlayer.bestDamage)}</td>
                      </tr>
                      <tr>
                        <td>Melhor Captures</td>
                        <td className="best">{selectedPlayer.bestCaptures}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerStats;
