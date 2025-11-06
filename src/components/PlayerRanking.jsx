import { useState, useEffect } from 'react';
import { getPlayers } from '../firebase/players';
import { subscribeToBattles } from '../firebase/battles';
import './PlayerRanking.css';

const PlayerRanking = ({ onClose }) => {
  const [players, setPlayers] = useState([]);
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minGames, setMinGames] = useState(1);
  const [activeTab, setActiveTab] = useState('overall'); // 'overall', 'winrate', 'downs', 'damage', 'revives', 'captures', 'assists'
  const [viewMode, setViewMode] = useState('round'); // 'round' (por ronda) ou 'game' (por jogo)

  useEffect(() => {
    const loadData = async () => {
      try {
        const playersData = await getPlayers();
        setPlayers(playersData);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Subscrever às batalhas em tempo real
  useEffect(() => {
    const unsubscribe = subscribeToBattles((battlesData) => {
      setBattles(battlesData);
    });

    return () => unsubscribe();
  }, []);

  // Calcular ranking específico por métrica
  const calculateSpecificRanking = (metric) => {
    // Se estiver em modo "por ronda", usar os dados do Firebase
    if (viewMode === 'round') {
      const playerStats = players.map(player => {
        let avgValue = 0;
        
        switch(metric) {
          case 'winrate':
            avgValue = player.winRate || 0;
            break;
          case 'downs':
            avgValue = player.avgDowns || 0;
            break;
          case 'damage':
            avgValue = player.avgDamage || 0;
            break;
          case 'revives':
            avgValue = player.avgRevives || 0;
            break;
          case 'captures':
            avgValue = player.avgCaptures || 0;
            break;
          case 'assists':
            avgValue = player.avgAssists || 0;
            break;
        }
        
        return {
          name: player.name,
          totalGames: player.totalGames || 0,
          winRate: player.winRate || 0,
          avgDowns: player.avgDowns || 0,
          avgDamage: player.avgDamage || 0,
          avgRevives: player.avgRevives || 0,
          avgCaptures: player.avgCaptures || 0,
          avgAssists: player.avgAssists || 0,
          totalMVPs: calculatePlayerMVPs(player.name),
          favoriteOperator: player.favoriteOperator || calculateFavoriteOperator(player.name),
          score: avgValue
        };
      });
      
      return playerStats
        .filter(player => player.totalGames >= minGames)
        .sort((a, b) => b.score - a.score);
    }
    
    // Se estiver em modo "por jogo", calcular médias por jogo convertendo de por ronda
    const playerStats = players.map(player => {
      const totalRounds = player.totalRounds || 0;
      const totalGames = player.totalGames || 0;
      
      // Converter de média por ronda para média por jogo
      let avgDowns, avgDamage, avgRevives, avgCaptures, avgAssists;
      
      if (totalRounds > 0 && totalGames > 0) {
        const roundsPerGame = totalRounds / totalGames;
        avgDowns = player.avgDowns ? (player.avgDowns * roundsPerGame) : 0;
        avgDamage = player.avgDamage ? (player.avgDamage * roundsPerGame) : 0;
        avgRevives = player.avgRevives ? (player.avgRevives * roundsPerGame) : 0;
        avgCaptures = player.avgCaptures ? (player.avgCaptures * roundsPerGame) : 0;
        avgAssists = player.avgAssists ? (player.avgAssists * roundsPerGame) : 0;
      } else {
        // Fallback
        avgDowns = player.avgDowns || 0;
        avgDamage = player.avgDamage || 0;
        avgRevives = player.avgRevives || 0;
        avgCaptures = player.avgCaptures || 0;
        avgAssists = player.avgAssists || 0;
      }
      
      let score = 0;
      switch(metric) {
        case 'winrate':
          score = player.winRate || 0;
          break;
        case 'downs':
          score = Math.round(avgDowns * 10) / 10;
          break;
        case 'damage':
          score = Math.round(avgDamage * 10) / 10;
          break;
        case 'revives':
          score = Math.round(avgRevives * 10) / 10;
          break;
        case 'captures':
          score = Math.round(avgCaptures * 10) / 10;
          break;
        case 'assists':
          score = Math.round(avgAssists * 10) / 10;
          break;
      }
      
      return {
        name: player.name,
        totalGames: player.totalGames || 0,
        winRate: player.winRate || 0,
        avgDowns: Math.round(avgDowns * 10) / 10,
        avgDamage: Math.round(avgDamage * 10) / 10,
        avgRevives: Math.round(avgRevives * 10) / 10,
        avgCaptures: Math.round(avgCaptures * 10) / 10,
        avgAssists: Math.round(avgAssists * 10) / 10,
        totalMVPs: calculatePlayerMVPs(player.name),
        favoriteOperator: player.favoriteOperator || calculateFavoriteOperator(player.name),
        score: score
      };
    });
    
    return playerStats
      .filter(player => player.totalGames >= minGames)
      .sort((a, b) => b.score - a.score);
  };

  // Calcular ranking geral dos jogadores
  const calculatePlayerRanking = () => {
    // Se estiver em modo "por ronda", usar os dados do Firebase diretamente
    if (viewMode === 'round') {
      // Filtrar jogadores com jogos suficientes
      const validPlayers = players.filter(player => (player.totalGames || 0) >= minGames);
      
      if (validPlayers.length === 0) return [];
      
      // Calcular os valores MÁXIMOS reais de CADA métrica (podem ser de jogadores diferentes)
      const maxDowns = Math.max(...validPlayers.map(p => p.avgDowns || 0), 1);
      const maxDamage = Math.max(...validPlayers.map(p => p.avgDamage || 0), 1);
      const maxRevives = Math.max(...validPlayers.map(p => p.avgRevives || 0), 1);
      const maxCaptures = Math.max(...validPlayers.map(p => p.avgCaptures || 0), 1);
      
      const playerStats = validPlayers.map(player => {
        const playerData = {
          name: player.name,
          totalGames: player.totalGames || 0,
          winRate: player.winRate || 0,
          avgDowns: player.avgDowns || 0,
          avgDamage: player.avgDamage || 0,
          avgRevives: player.avgRevives || 0,
          avgCaptures: player.avgCaptures || 0,
          avgAssists: player.avgAssists || 0,
          totalMVPs: calculatePlayerMVPs(player.name),
          favoriteOperator: player.favoriteOperator || calculateFavoriteOperator(player.name)
        };
        
        // Calcular score: Win Rate usa 100% como referência, outras métricas usam o máximo real
        const winRateScore = (playerData.winRate / 100) * 35; // 100% é sempre o ideal
        const downsScore = (playerData.avgDowns / maxDowns) * 35;
        const damageScore = (playerData.avgDamage / maxDamage) * 15;
        const revivesScore = (playerData.avgRevives / maxRevives) * 10;
        const capturesScore = (playerData.avgCaptures / maxCaptures) * 5;
        
        playerData.score = Math.round((winRateScore + downsScore + damageScore + revivesScore + capturesScore) * 100) / 100;
        
        // Arredondar para exibição apenas
        playerData.avgDowns = Math.round(playerData.avgDowns * 10) / 10;
        playerData.avgDamage = Math.round(playerData.avgDamage);
        playerData.avgRevives = Math.round(playerData.avgRevives * 10) / 10;
        playerData.avgCaptures = Math.round(playerData.avgCaptures * 10) / 10;
        playerData.avgAssists = Math.round((playerData.avgAssists || 0) * 10) / 10;
        
        return playerData;
      });
      
      return playerStats.sort((a, b) => b.score - a.score);
    }
    
    // Se estiver em modo "por jogo", calcular médias por jogo usando totalGames
    // Primeiro, calcular médias por jogo de todos os jogadores para encontrar os máximos
    const playersWithGameStats = players.map(player => {
      const totalRounds = player.totalRounds || 0;
      const totalGames = player.totalGames || 0;
      
      let avgDowns, avgDamage, avgRevives, avgCaptures, avgAssists;
      
      if (totalRounds > 0 && totalGames > 0) {
        const roundsPerGame = totalRounds / totalGames;
        avgDowns = player.avgDowns ? (player.avgDowns * roundsPerGame) : 0;
        avgDamage = player.avgDamage ? (player.avgDamage * roundsPerGame) : 0;
        avgRevives = player.avgRevives ? (player.avgRevives * roundsPerGame) : 0;
        avgCaptures = player.avgCaptures ? (player.avgCaptures * roundsPerGame) : 0;
        avgAssists = player.avgAssists ? (player.avgAssists * roundsPerGame) : 0;
      } else {
        avgDowns = player.avgDowns || 0;
        avgDamage = player.avgDamage || 0;
        avgRevives = player.avgRevives || 0;
        avgCaptures = player.avgCaptures || 0;
        avgAssists = player.avgAssists || 0;
      }
      
      return {
        name: player.name,
        totalGames: player.totalGames || 0,
        winRate: player.winRate || 0,
        avgDowns,
        avgDamage,
        avgRevives,
        avgCaptures,
        avgAssists,
        totalMVPs: calculatePlayerMVPs(player.name),
        favoriteOperator: player.favoriteOperator || calculateFavoriteOperator(player.name)
      };
    });
    
    // Filtrar jogadores com jogos suficientes
    const validPlayers = playersWithGameStats.filter(p => p.totalGames >= minGames);
    
    if (validPlayers.length === 0) return [];
    
    // Calcular os valores MÁXIMOS reais de CADA métrica (podem ser de jogadores diferentes)
    const maxDowns = Math.max(...validPlayers.map(p => p.avgDowns || 0), 1);
    const maxDamage = Math.max(...validPlayers.map(p => p.avgDamage || 0), 1);
    const maxRevives = Math.max(...validPlayers.map(p => p.avgRevives || 0), 1);
    const maxCaptures = Math.max(...validPlayers.map(p => p.avgCaptures || 0), 1);
    
    // Calcular score: Win Rate usa 100% como referência, outras métricas usam o máximo real
    const playerStats = validPlayers.map(playerData => {
      const winRateScore = (playerData.winRate / 100) * 35; // 100% é sempre o ideal
      const downsScore = (playerData.avgDowns / maxDowns) * 35;
      const damageScore = (playerData.avgDamage / maxDamage) * 15;
      const revivesScore = (playerData.avgRevives / maxRevives) * 10;
      const capturesScore = (playerData.avgCaptures / maxCaptures) * 5;
      
      playerData.score = Math.round((winRateScore + downsScore + damageScore + revivesScore + capturesScore) * 100) / 100;
      
      // Arredondar para exibição apenas
      playerData.avgDowns = Math.round(playerData.avgDowns * 10) / 10;
      playerData.avgDamage = Math.round(playerData.avgDamage);
      playerData.avgRevives = Math.round(playerData.avgRevives * 10) / 10;
      playerData.avgCaptures = Math.round(playerData.avgCaptures * 10) / 10;
      playerData.avgAssists = Math.round((playerData.avgAssists || 0) * 10) / 10;
      
      return playerData;
    });
    
    return playerStats.sort((a, b) => b.score - a.score);
  };

  const formatNumber = (num) => {
    if (!num || num === 0) return '0';
    return Math.round(num).toString();
  };

  const formatPercentage = (num) => {
    if (!num) return '0%';
    return `${Math.round(num)}%`;
  };

  // Calcular MVP de um jogo
  const calculateMVP = (battle) => {
    if (!battle || !battle.team1 || !battle.team2) return null;
    
    const allPlayers = [...battle.team1, ...battle.team2];
    if (allPlayers.length === 0) return null;
    
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
    if (!battles || battles.length === 0) {
      return 0;
    }
    
    return battles.filter(battle => {
      const mvp = calculateMVP(battle);
      return mvp && mvp.name === playerName;
    }).length;
  };

  // Calcular operador favorito de um jogador baseado nas batalhas
  const calculateFavoriteOperator = (playerName) => {
    if (!battles || battles.length === 0) {
      return '';
    }
    
    const operatorCounts = {};
    
    battles.forEach(battle => {
      const allPlayers = [...(battle.team1 || []), ...(battle.team2 || [])];
      const player = allPlayers.find(p => p.name === playerName);
      
      if (player && player.operator && player.operator.trim() !== '' && player.operator !== 'Unknown') {
        operatorCounts[player.operator] = (operatorCounts[player.operator] || 0) + 1;
      }
    });
    
    // Encontrar o operador mais usado
    let maxUses = 0;
    let favoriteOperator = '';
    
    for (const [operator, count] of Object.entries(operatorCounts)) {
      if (count > maxUses) {
        maxUses = count;
        favoriteOperator = operator;
      }
    }
    
    return favoriteOperator;
  };

  if (loading) {
    return (
      <div className="player-ranking-overlay">
        <div className="player-ranking-container">
          <div className="loading">Carregando dados...</div>
        </div>
      </div>
    );
  }


  const ranking = activeTab === 'overall' 
    ? calculatePlayerRanking() 
    : calculateSpecificRanking(activeTab);

  return (
    <div className="player-ranking-overlay">
      <div className="player-ranking-container">
        <div className="player-ranking-header">
          <h2>🏆 Ranking de Jogadores</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="player-ranking-content">
          {/* Tabs */}
          <div className="ranking-tabs">
            <button 
              className={`tab ${activeTab === 'overall' ? 'active' : ''}`}
              onClick={() => setActiveTab('overall')}
            >
              🏆 Geral
            </button>
            <button 
              className={`tab ${activeTab === 'winrate' ? 'active' : ''}`}
              onClick={() => setActiveTab('winrate')}
            >
              🎯 Win Rate
            </button>
            <button 
              className={`tab ${activeTab === 'downs' ? 'active' : ''}`}
              onClick={() => setActiveTab('downs')}
            >
              ⚔️ Downs
            </button>
            <button 
              className={`tab ${activeTab === 'damage' ? 'active' : ''}`}
              onClick={() => setActiveTab('damage')}
            >
              💥 Damage
            </button>
            <button 
              className={`tab ${activeTab === 'revives' ? 'active' : ''}`}
              onClick={() => setActiveTab('revives')}
            >
              💚 Revives
            </button>
            <button 
              className={`tab ${activeTab === 'captures' ? 'active' : ''}`}
              onClick={() => setActiveTab('captures')}
            >
              🎯 Captures
            </button>
            <button 
              className={`tab ${activeTab === 'assists' ? 'active' : ''}`}
              onClick={() => setActiveTab('assists')}
            >
              🤝 Assists
            </button>
          </div>

          <div className="ranking-filters">
            <div className="filter-group">
              <label htmlFor="minGames">Jogos mínimos:</label>
              <select 
                id="minGames" 
                value={minGames} 
                onChange={(e) => setMinGames(parseInt(e.target.value))}
                className="filter-select"
              >
                <option value={1}>1+ jogos</option>
                <option value={5}>5+ jogos</option>
                <option value={10}>10+ jogos</option>
                <option value={20}>20+ jogos</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Modo de visualização:</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  className={`filter-select ${viewMode === 'round' ? 'active' : ''}`}
                  onClick={() => setViewMode('round')}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    background: viewMode === 'round' ? '#4ade80' : '#fff',
                    color: viewMode === 'round' ? '#fff' : '#333',
                    cursor: 'pointer',
                    fontWeight: viewMode === 'round' ? 600 : 400
                  }}
                >
                  📊 Por Ronda
                </button>
                <button
                  className={`filter-select ${viewMode === 'game' ? 'active' : ''}`}
                  onClick={() => setViewMode('game')}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    background: viewMode === 'game' ? '#4ade80' : '#fff',
                    color: viewMode === 'game' ? '#fff' : '#333',
                    cursor: 'pointer',
                    fontWeight: viewMode === 'game' ? 600 : 400
                  }}
                >
                  🎮 Por Jogo
                </button>
              </div>
            </div>
            <div className="ranking-info">
              <p>Mostrando {ranking.length} jogadores</p>
            </div>
          </div>

          {ranking.length === 0 ? (
            <p className="no-data">Nenhum jogador encontrado com os critérios selecionados.</p>
          ) : (
            <>
              {/* Explicação do Score */}
              {activeTab === 'overall' && (
                <div className="score-explanation">
                  <h3>📊 Como é Calculado o Score</h3>
                  <div className="score-breakdown">
                    <div className="score-item">
                      <span className="score-label">Win Rate:</span>
                      <span className="score-percentage">35%</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">Avg Downs:</span>
                      <span className="score-percentage">35%</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">Avg Damage:</span>
                      <span className="score-percentage">15%</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">Avg Revives:</span>
                      <span className="score-percentage">10%</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">Avg Captures:</span>
                      <span className="score-percentage">5%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Top 3 Jogadores */}
              <div className="top-players">
                <h3>🥇 Top 3 Jogadores</h3>
                <div className="top-players-grid">
                  {ranking.slice(0, 3).map((player, index) => (
                    <div key={player.name} className={`player-card ${index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'}`}>
                      <div className="rank-badge">#{index + 1}</div>
                      <div className="player-name">{player.name}</div>
                      <div className="player-score">{player.score.toFixed(1)}</div>
                      <div className="player-stats">
                        <span className="winrate">{formatPercentage(player.winRate)}</span>
                        <span className="games">{player.totalGames} jogos</span>
                      </div>
                      <div className="player-operator">
                        {player.favoriteOperator || calculateFavoriteOperator(player.name) || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabela Completa */}
              <div className="ranking-table-container">
                <table className="ranking-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Jogador</th>
                      <th>{activeTab === 'overall' ? 'Score' : activeTab === 'winrate' ? 'Win Rate' : activeTab === 'downs' ? 'Avg Downs' : activeTab === 'damage' ? 'Avg Damage' : activeTab === 'revives' ? 'Avg Revives' : activeTab === 'captures' ? 'Avg Captures' : 'Avg Assists'}</th>
                      <th>Win Rate</th>
                      <th>Jogos</th>
                      <th>Avg Downs{viewMode === 'round' ? '/Ronda' : '/Jogo'}</th>
                      <th>Avg Damage{viewMode === 'round' ? '/Ronda' : '/Jogo'}</th>
                      <th>Avg Revives{viewMode === 'round' ? '/Ronda' : '/Jogo'}</th>
                      <th>Avg Captures{viewMode === 'round' ? '/Ronda' : '/Jogo'}</th>
                      <th>Avg Assists{viewMode === 'round' ? '/Ronda' : '/Jogo'}</th>
                      <th>MVPs</th>
                      <th>Operador Favorito</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((player, index) => (
                      <tr key={player.name} className={index < 3 ? 'top-player-row' : ''}>
                        <td className="rank">#{index + 1}</td>
                        <td className="player-name">{player.name}</td>
                        <td className="score">
                          {activeTab === 'overall' 
                            ? player.score.toFixed(1) 
                            : activeTab === 'winrate' 
                              ? formatPercentage(player.winRate)
                              : activeTab === 'damage'
                                ? formatNumber(player.avgDamage)
                                : player.score.toFixed(1)
                          }
                        </td>
                        <td className="winrate">{formatPercentage(player.winRate)}</td>
                        <td>{player.totalGames}</td>
                        <td>{player.avgDowns}</td>
                        <td>{formatNumber(player.avgDamage)}</td>
                        <td>{player.avgRevives}</td>
                        <td>{player.avgCaptures}</td>
                        <td>{player.avgAssists || 0}</td>
                        <td className="mvp">{player.totalMVPs}</td>
                        <td className="operator">{player.favoriteOperator || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerRanking;
