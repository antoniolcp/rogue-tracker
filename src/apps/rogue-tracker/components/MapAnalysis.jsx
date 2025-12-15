import { useState, useEffect } from 'react';
import { getPlayers } from '../firebase/players';
import { subscribeToBattles } from '../firebase/battles';
import './MapAnalysis.css';

const MapAnalysis = ({ onClose }) => {
  const [players, setPlayers] = useState([]);
  const [battles, setBattles] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('individual'); // 'individual' ou 'general'

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

  // Calcular estatísticas individuais por mapa
  const calculateIndividualMapStats = (playerName) => {
    const playerBattles = battles.filter(battle => 
      battle.team1.some(p => p.name === playerName) || 
      battle.team2.some(p => p.name === playerName)
    );

    const mapStats = {};
    
    playerBattles.forEach(battle => {
      const allPlayers = [...battle.team1, ...battle.team2];
      const player = allPlayers.find(p => p.name === playerName);
      const isTeam1Winner = battle.result === 'win';
      const isWinner = (battle.team1.includes(player) && isTeam1Winner) || 
                      (battle.team2.includes(player) && !isTeam1Winner);
      
      if (player && battle.map) {
        if (!mapStats[battle.map]) {
          mapStats[battle.map] = {
            map: battle.map,
            totalGames: 0,
            totalWins: 0,
            totalLosses: 0,
            totalElims: 0,
            totalDowns: 0,
            totalAssists: 0,
            totalDamage: 0,
            totalMVPs: 0,
            operators: new Map()
          };
        }
        
        mapStats[battle.map].totalGames++;
        mapStats[battle.map].totalWins += isWinner ? 1 : 0;
        mapStats[battle.map].totalLosses += isWinner ? 0 : 1;
        mapStats[battle.map].totalElims += player.elims || 0;
        mapStats[battle.map].totalDowns += player.downs || 0;
        mapStats[battle.map].totalAssists += player.assists || 0;
        mapStats[battle.map].totalDamage += player.damage || 0;
        
        // Verificar se este jogador foi MVP neste jogo
        const mvp = calculateMVP(battle);
        if (mvp && mvp.name === playerName) {
          mapStats[battle.map].totalMVPs++;
        }
        
        // Contar operadores usados
        if (player.operator) {
          const currentCount = mapStats[battle.map].operators.get(player.operator) || 0;
          mapStats[battle.map].operators.set(player.operator, currentCount + 1);
        }
      }
    });

    // Calcular médias e percentagens
    Object.values(mapStats).forEach(map => {
      map.winRate = map.totalGames > 0 ? 
        Math.round((map.totalWins / map.totalGames) * 100) : 0;
      map.avgElims = map.totalGames > 0 ? 
        Math.round((map.totalElims / map.totalGames) * 10) / 10 : 0;
        map.avgDowns = map.totalGames > 0 ? 
        Math.round((map.totalDowns / map.totalGames) * 10) / 10 : 0;
        map.avgAssists = map.totalGames > 0 ? 
        Math.round((map.totalAssists / map.totalGames) * 10) / 10 : 0;
        map.avgDamage = map.totalGames > 0 ? 
        Math.round((map.totalDamage / map.totalGames) * 10) / 10 : 0;
      
      // Encontrar operador favorito
      let favoriteOperator = '';
      let maxUses = 0;
      map.operators.forEach((count, operator) => {
        if (count > maxUses) {
          maxUses = count;
          favoriteOperator = operator;
        }
      });
      map.favoriteOperator = favoriteOperator;
    });

    return Object.values(mapStats).sort((a, b) => b.winRate - a.winRate);
  };

  // Calcular estatísticas gerais por mapa
  const calculateGeneralMapStats = () => {
    const mapStats = {};
    
    battles.forEach(battle => {
      if (!battle.map) return;
      
      if (!mapStats[battle.map]) {
        mapStats[battle.map] = {
          map: battle.map,
          totalGames: 0,
          totalRounds: 0,
          operators: new Map(),
          teams: new Map()
        };
      }
      
      const allPlayers = [...battle.team1, ...battle.team2];
      
      mapStats[battle.map].totalGames++;
      
      // Contar rondas totais (team1Rounds + team2Rounds)
      const totalRounds = (battle.team1Rounds || 0) + (battle.team2Rounds || 0);
      mapStats[battle.map].totalRounds += totalRounds;
      
      // Contar operadores
      allPlayers.forEach(player => {
        if (player.operator) {
          const currentCount = mapStats[battle.map].operators.get(player.operator) || 0;
          mapStats[battle.map].operators.set(player.operator, currentCount + 1);
        }
      });
      
      // Contar equipas (formações)
      const team1Players = battle.team1.map(p => p.name).sort().join(', ');
      const team2Players = battle.team2.map(p => p.name).sort().join(', ');
      
      [team1Players, team2Players].forEach(team => {
        const currentCount = mapStats[battle.map].teams.get(team) || 0;
        mapStats[battle.map].teams.set(team, currentCount + 1);
      });
    });

    // Calcular estatísticas
    Object.values(mapStats).forEach(map => {
      // Calcular média de rondas
      map.avgRounds = map.totalGames > 0 ? 
        Math.round((map.totalRounds / map.totalGames) * 100) / 100 : 0;
      
      // Encontrar operador mais usado
      let mostUsedOperator = '';
      let maxUses = 0;
      map.operators.forEach((count, operator) => {
        if (count > maxUses) {
          maxUses = count;
          mostUsedOperator = operator;
        }
      });
      map.mostUsedOperator = mostUsedOperator;
      
      // Encontrar equipa mais usada
      let mostUsedTeam = '';
      let maxTeamUses = 0;
      map.teams.forEach((count, team) => {
        if (count > maxTeamUses) {
          maxTeamUses = count;
          mostUsedTeam = team;
        }
      });
      map.mostUsedTeam = mostUsedTeam;
    });

    return Object.values(mapStats).sort((a, b) => b.totalGames - a.totalGames);
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

  // Calcular número de MVPs por jogador (função utilitária para uso futuro)
  // const calculatePlayerMVPs = (playerName) => {
  //   return battles.filter(battle => {
  //     const mvp = calculateMVP(battle);
  //     return mvp && mvp.name === playerName;
  //   }).length;
  // };

  if (loading) {
    return (
      <div className="map-analysis-overlay">
        <div className="map-analysis-container">
          <div className="loading">Carregando dados...</div>
        </div>
      </div>
    );
  }

  const individualStats = selectedPlayer ? calculateIndividualMapStats(selectedPlayer) : [];
  const generalStats = calculateGeneralMapStats();

  return (
    <div className="map-analysis-overlay">
      <div className="map-analysis-container">
        <div className="map-analysis-header">
          <h2>🗺️ Análise por Mapa</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="map-analysis-content">
          {/* Tabs */}
          <div className="map-tabs">
            <button 
              className={`tab ${activeTab === 'individual' ? 'active' : ''}`}
              onClick={() => setActiveTab('individual')}
            >
              👤 Individual
            </button>
            <button 
              className={`tab ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              🏆 Geral
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'individual' ? (
            <div className="individual-stats">
              <h3>Análise Individual por Mapa</h3>
              
              {!selectedPlayer ? (
                <div className="player-selection">
                  <div className="players-grid">
                    {players.length === 0 ? (
                      <p className="no-players">Nenhum jogador encontrado.</p>
                    ) : (
                      players.map((player) => (
                        <button
                          key={player.name}
                          className="player-card"
                          onClick={() => setSelectedPlayer(player.name)}
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
                    <h4>Performance de {selectedPlayer} por Mapa</h4>
                    <button 
                      className="back-btn"
                      onClick={() => setSelectedPlayer(null)}
                    >
                      ← Voltar
                    </button>
                  </div>

                  {individualStats.length === 0 ? (
                    <p className="no-data">Este jogador ainda não jogou em nenhum mapa.</p>
                  ) : (
                    <>
                      {/* Top 3 Melhores/Piores Mapas */}
                      <div className="map-performance">
                        <div className="top-maps">
                          <h5>🏆 Top 3 Melhores Mapas</h5>
                          <div className="map-cards">
                            {individualStats.slice(0, 3).map((map, index) => (
                              <div key={map.map} className={`map-card ${index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'}`}>
                                <div className="rank">#{index + 1}</div>
                                <div className="map-name">{map.map}</div>
                                <div className="map-stats">
                                  <span className="winrate">{formatPercentage(map.winRate)}</span>
                                  <span className="games">{map.totalGames} jogos</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="worst-maps">
                          <h5>⚠️ Top 3 Piores Mapas</h5>
                          <div className="map-cards">
                            {individualStats.slice(-3).reverse().map((map, index) => (
                              <div key={map.map} className={`map-card worst ${index === 0 ? 'worst-1' : index === 1 ? 'worst-2' : 'worst-3'}`}>
                                <div className="rank">#{index + 1}</div>
                                <div className="map-name">{map.map}</div>
                                <div className="map-stats">
                                  <span className="winrate">{formatPercentage(map.winRate)}</span>
                                  <span className="games">{map.totalGames} jogos</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Tabela Completa */}
                      <div className="stats-table-container">
                        <table className="map-stats-table">
                          <thead>
                            <tr>
                              <th>Mapa</th>
                              <th>Jogos</th>
                              <th>Vitórias</th>
                              <th>Derrotas</th>
                              <th>Win Rate</th>
                              <th>Avg Downs</th>
                              <th>Avg Damage</th>
                              <th>MVPs</th>
                              <th>Operador Favorito</th>
                            </tr>
                          </thead>
                          <tbody>
                            {individualStats.map((map) => (
                              <tr key={map.map}>
                                <td className="map-name">{map.map}</td>
                                <td>{map.totalGames}</td>
                                <td className="win">{map.totalWins}</td>
                                <td className="loss">{map.totalLosses}</td>
                                <td className="winrate">{formatPercentage(map.winRate)}</td>
                                <td>{map.avgDowns}</td>
                                <td>{formatNumber(map.avgDamage)}</td>
                                <td className="mvp">{map.totalMVPs}</td>
                                <td className="operator">{map.favoriteOperator || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="general-stats">
              <h3>Análise Geral por Mapa</h3>
              
              {generalStats.length === 0 ? (
                <p className="no-data">Nenhum mapa com dados encontrado.</p>
              ) : (
                <>
                  {/* Top 3 Mapas Mais Jogados */}
                  <div className="top-maps-general">
                    <h5>🎮 Top 3 Mapas Mais Jogados</h5>
                    <div className="map-cards">
                      {generalStats.slice(0, 3).map((map, index) => (
                        <div key={map.map} className={`map-card ${index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'}`}>
                          <div className="rank">#{index + 1}</div>
                          <div className="map-name">{map.map}</div>
                          <div className="map-stats">
                            <span className="games">{map.totalGames} jogos</span>
                            <span className="players">{map.uniquePlayers} jogadores</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tabela Completa */}
                  <div className="stats-table-container">
                    <table className="map-stats-table">
                      <thead>
                        <tr>
                          <th>Mapa</th>
                          <th>Jogos</th>
                          <th>Avg Rondas</th>
                          <th>Operador Mais Usado</th>
                          <th>Equipa Mais Usada</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generalStats.map((map) => (
                          <tr key={map.map}>
                            <td className="map-name">{map.map}</td>
                            <td>{map.totalGames}</td>
                            <td className="rounds">{map.avgRounds}</td>
                            <td className="operator">{map.mostUsedOperator || '-'}</td>
                            <td className="team">{map.mostUsedTeam || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapAnalysis;
