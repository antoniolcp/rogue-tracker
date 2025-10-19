import { useState, useEffect } from 'react';
import { getPlayers } from '../firebase/players';
import { subscribeToBattles } from '../firebase/battles';
import './PlayerRanking.css';

const PlayerRanking = ({ onClose }) => {
  const [players, setPlayers] = useState([]);
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minGames, setMinGames] = useState(1);
  const [activeTab, setActiveTab] = useState('overall'); // 'overall', 'winrate', 'downs', 'damage', 'revives', 'captures'

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
    const playerStats = {};
    
    // Inicializar estatísticas de cada jogador
    players.forEach(player => {
      playerStats[player.name] = {
        name: player.name,
        totalGames: 0,
        totalWins: 0,
        totalDowns: 0,
        totalDamage: 0,
        totalRevives: 0,
        totalCaptures: 0,
        operators: new Map()
      };
    });

    // Processar todas as batalhas
    battles.forEach(battle => {
      const allPlayers = [...battle.team1, ...battle.team2];
      const isTeam1Winner = battle.result === 'win';
      
      allPlayers.forEach(player => {
        if (playerStats[player.name]) {
          const isWinner = (battle.team1.includes(player) && isTeam1Winner) || 
                          (battle.team2.includes(player) && !isTeam1Winner);
          
          playerStats[player.name].totalGames++;
          playerStats[player.name].totalWins += isWinner ? 1 : 0;
          playerStats[player.name].totalDowns += player.downs || 0;
          playerStats[player.name].totalDamage += player.damage || 0;
          playerStats[player.name].totalRevives += player.revives || 0;
          playerStats[player.name].totalCaptures += player.captures || 0;
          
          // Contar operadores
          if (player.operator) {
            const currentCount = playerStats[player.name].operators.get(player.operator) || 0;
            playerStats[player.name].operators.set(player.operator, currentCount + 1);
          }
        }
      });
    });

    // Calcular médias e score específico
    Object.values(playerStats).forEach(player => {
      if (player.totalGames > 0) {
        player.winRate = Math.round((player.totalWins / player.totalGames) * 100);
        player.avgDowns = Math.round((player.totalDowns / player.totalGames) * 10) / 10;
        player.avgDamage = Math.round((player.totalDamage / player.totalGames) * 10) / 10;
        player.avgRevives = Math.round((player.totalRevives / player.totalGames) * 10) / 10;
        player.avgCaptures = Math.round((player.totalCaptures / player.totalGames) * 10) / 10;
        player.totalMVPs = calculatePlayerMVPs(player.name);
        
        // Encontrar operador favorito
        let favoriteOperator = '';
        let maxUses = 0;
        player.operators.forEach((count, operator) => {
          if (count > maxUses) {
            maxUses = count;
            favoriteOperator = operator;
          }
        });
        player.favoriteOperator = favoriteOperator;
        
        // Calcular score baseado na métrica específica
        switch(metric) {
          case 'winrate':
            player.score = player.winRate;
            break;
          case 'downs':
            player.score = player.avgDowns;
            break;
          case 'damage':
            player.score = player.avgDamage;
            break;
          case 'revives':
            player.score = player.avgRevives;
            break;
          case 'captures':
            player.score = player.avgCaptures;
            break;
          default:
            player.score = 0;
        }
      } else {
        player.winRate = 0;
        player.avgDowns = 0;
        player.avgDamage = 0;
        player.avgRevives = 0;
        player.avgCaptures = 0;
        player.totalMVPs = 0;
        player.favoriteOperator = '';
        player.score = 0;
      }
    });

    // Filtrar por número mínimo de jogos e ordenar por score
    return Object.values(playerStats)
      .filter(player => player.totalGames >= minGames)
      .sort((a, b) => b.score - a.score);
  };

  // Calcular ranking geral dos jogadores
  const calculatePlayerRanking = () => {
    const playerStats = {};
    
    // Inicializar estatísticas de cada jogador
    players.forEach(player => {
      playerStats[player.name] = {
        name: player.name,
        totalGames: 0,
        totalWins: 0,
        totalLosses: 0,
        totalDowns: 0,
        totalDamage: 0,
        totalRevives: 0,
        totalCaptures: 0,
        operators: new Map()
      };
    });

    // Processar todas as batalhas
    battles.forEach(battle => {
      const allPlayers = [...battle.team1, ...battle.team2];
      const isTeam1Winner = battle.result === 'win';
      
      allPlayers.forEach(player => {
        if (playerStats[player.name]) {
          const isWinner = (battle.team1.includes(player) && isTeam1Winner) || 
                          (battle.team2.includes(player) && !isTeam1Winner);
          
          playerStats[player.name].totalGames++;
          playerStats[player.name].totalWins += isWinner ? 1 : 0;
          playerStats[player.name].totalLosses += isWinner ? 0 : 1;
          playerStats[player.name].totalDowns += player.downs || 0;
          playerStats[player.name].totalDamage += player.damage || 0;
          playerStats[player.name].totalRevives += player.revives || 0;
          playerStats[player.name].totalCaptures += player.captures || 0;
          
          // Contar operadores
          if (player.operator) {
            const currentCount = playerStats[player.name].operators.get(player.operator) || 0;
            playerStats[player.name].operators.set(player.operator, currentCount + 1);
          }
        }
      });
    });

    // Calcular médias e score
    Object.values(playerStats).forEach(player => {
      if (player.totalGames > 0) {
        player.winRate = Math.round((player.totalWins / player.totalGames) * 100);
        player.avgDowns = Math.round((player.totalDowns / player.totalGames) * 10) / 10;
        player.avgDamage = Math.round((player.totalDamage / player.totalGames) * 10) / 10;
        player.avgRevives = Math.round((player.totalRevives / player.totalGames) * 10) / 10;
        player.avgCaptures = Math.round((player.totalCaptures / player.totalGames) * 10) / 10;
        player.totalMVPs = calculatePlayerMVPs(player.name);
        
        // Encontrar operador favorito
        let favoriteOperator = '';
        let maxUses = 0;
        player.operators.forEach((count, operator) => {
          if (count > maxUses) {
            maxUses = count;
            favoriteOperator = operator;
          }
        });
        player.favoriteOperator = favoriteOperator;
        
        // Calcular score com os pesos definidos
        // Win Rate (35%) + Downs (35%) + Damage (15%) + Revives (10%) + Captures (5%)
        const winRateScore = (player.winRate / 100) * 35;
        const downsScore = Math.min(player.avgDowns / 30, 1) * 35; // 30 downs = 100%
        const damageScore = Math.min(player.avgDamage / 3000, 1) * 15; // 3000 damage = 100%
        const revivesScore = Math.min(player.avgRevives / 10, 1) * 10; // 10 revives = 100%
        const capturesScore = Math.min(player.avgCaptures / 5, 1) * 5; // 5 captures = 100%
        
        player.score = Math.round((winRateScore + downsScore + damageScore + revivesScore + capturesScore) * 100) / 100;
      } else {
        player.winRate = 0;
        player.avgDowns = 0;
        player.avgDamage = 0;
        player.avgRevives = 0;
        player.avgCaptures = 0;
        player.totalMVPs = 0;
        player.favoriteOperator = '';
        player.score = 0;
      }
    });

    // Filtrar por número mínimo de jogos e ordenar por score
    return Object.values(playerStats)
      .filter(player => player.totalGames >= minGames)
      .sort((a, b) => b.score - a.score);
  };

  const formatNumber = (num) => {
    if (!num || num === 0) return '0';
    return Math.round(num).toString();
  };

  const formatPercentage = (num) => {
    return num ? `${num}%` : '0%';
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
                        {player.favoriteOperator || 'N/A'}
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
                      <th>{activeTab === 'overall' ? 'Score' : activeTab === 'winrate' ? 'Win Rate' : activeTab === 'downs' ? 'Avg Downs' : activeTab === 'damage' ? 'Avg Damage' : activeTab === 'revives' ? 'Avg Revives' : 'Avg Captures'}</th>
                      <th>Win Rate</th>
                      <th>Jogos</th>
                      <th>Avg Downs</th>
                      <th>Avg Damage</th>
                      <th>Avg Revives</th>
                      <th>Avg Captures</th>
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
