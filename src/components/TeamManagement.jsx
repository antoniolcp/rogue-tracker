import { useState, useEffect } from 'react';
import { getPlayers } from '../firebase/players';
import { subscribeToBattles } from '../firebase/battles';
import './TeamManagement.css';

const TeamManagement = ({ onClose }) => {
  const [players, setPlayers] = useState([]);
  const [battles, setBattles] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('duplas'); // 'duplas', 'equipas' ou 'fazer-equipas'
  
  // Estados para o criador de equipas
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [generatedTeams, setGeneratedTeams] = useState(null);

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

  // Calcular estatísticas de duplas
  const calculateDuoStats = (playerName) => {
    const playerBattles = battles.filter(battle => 
      battle.team1.some(p => p.name === playerName) || 
      battle.team2.some(p => p.name === playerName)
    );

    const duoStats = {};
    
    playerBattles.forEach(battle => {
      const allPlayers = [...battle.team1, ...battle.team2];
      const player = allPlayers.find(p => p.name === playerName);
      const isTeam1Winner = battle.result === 'win';
      const isWinner = (battle.team1.includes(player) && isTeam1Winner) || 
                      (battle.team2.includes(player) && !isTeam1Winner);
      
      if (player) {
        // Encontrar parceiros na mesma equipa
        const teammates = allPlayers.filter(p => 
          p.name !== playerName && 
          ((battle.team1.includes(player) && battle.team1.includes(p)) ||
           (battle.team2.includes(player) && battle.team2.includes(p)))
        );
        
        teammates.forEach(teammate => {
          if (!duoStats[teammate.name]) {
            duoStats[teammate.name] = {
              name: teammate.name,
              totalGames: 0,
              totalWins: 0,
              totalLosses: 0,
              totalElims: 0,
              totalDowns: 0,
              totalAssists: 0,
              totalDamage: 0,
              operators: new Set()
            };
          }
          
          duoStats[teammate.name].totalGames++;
          duoStats[teammate.name].totalWins += isWinner ? 1 : 0;
          duoStats[teammate.name].totalLosses += isWinner ? 0 : 1;
          duoStats[teammate.name].totalElims += player.elims || 0;
          duoStats[teammate.name].totalDowns += player.downs || 0;
          duoStats[teammate.name].totalAssists += player.assists || 0;
          duoStats[teammate.name].totalDamage += player.damage || 0;
          if (player.operator) {
            duoStats[teammate.name].operators.add(player.operator);
          }
        });
      }
    });

    // Calcular médias e percentagens
    Object.values(duoStats).forEach(duo => {
      duo.winRate = duo.totalGames > 0 ? 
        Math.round((duo.totalWins / duo.totalGames) * 100) : 0;
      duo.avgElims = duo.totalGames > 0 ? 
        Math.round((duo.totalElims / duo.totalGames) * 10) / 10 : 0;
        duo.avgDowns = duo.totalGames > 0 ? 
        Math.round((duo.totalDowns / duo.totalGames) * 10) / 10 : 0;
        duo.avgAssists = duo.totalGames > 0 ? 
        Math.round((duo.totalAssists / duo.totalGames) * 10) / 10 : 0;
        duo.avgDamage = duo.totalGames > 0 ? 
        Math.round((duo.totalDamage / duo.totalGames) * 10) / 10 : 0;
      duo.kdRatio = duo.avgDowns > 0 ? 
        Math.round((duo.avgElims / duo.avgDowns) * 100) / 100 : duo.avgElims;
      duo.uniqueOperators = duo.operators.size;
    });

    return Object.values(duoStats).sort((a, b) => b.winRate - a.winRate);
  };

  // Calcular estatísticas de equipas
  const calculateTeamStats = () => {
    const teamStats = {};
    
    battles.forEach(battle => {
      const team1Players = battle.team1.map(p => p.name).sort().join(', ');
      const team2Players = battle.team2.map(p => p.name).sort().join(', ');
      const isTeam1Winner = battle.result === 'win';
      
      // Team 1
      if (!teamStats[team1Players]) {
        teamStats[team1Players] = {
          players: team1Players,
          totalGames: 0,
          totalWins: 0,
          totalLosses: 0,
          totalElims: 0,
          totalDamage: 0
        };
      }
      
      teamStats[team1Players].totalGames++;
      teamStats[team1Players].totalWins += isTeam1Winner ? 1 : 0;
      teamStats[team1Players].totalLosses += isTeam1Winner ? 0 : 1;
      teamStats[team1Players].totalElims += battle.team1.reduce((sum, p) => sum + (p.elims || 0), 0);
      teamStats[team1Players].totalDamage += battle.team1.reduce((sum, p) => sum + (p.damage || 0), 0);
      
      // Team 2
      if (!teamStats[team2Players]) {
        teamStats[team2Players] = {
          players: team2Players,
          totalGames: 0,
          totalWins: 0,
          totalLosses: 0,
          totalElims: 0,
          totalDamage: 0
        };
      }
      
      teamStats[team2Players].totalGames++;
      teamStats[team2Players].totalWins += !isTeam1Winner ? 1 : 0;
      teamStats[team2Players].totalLosses += !isTeam1Winner ? 0 : 1;
      teamStats[team2Players].totalElims += battle.team2.reduce((sum, p) => sum + (p.elims || 0), 0);
      teamStats[team2Players].totalDamage += battle.team2.reduce((sum, p) => sum + (p.damage || 0), 0);
    });

    // Calcular médias e percentagens
    Object.values(teamStats).forEach(team => {
      team.winRate = team.totalGames > 0 ? 
        Math.round((team.totalWins / team.totalGames) * 100) : 0;
      team.avgElims = team.totalGames > 0 ? 
        Math.round((team.totalElims / team.totalGames) * 10) / 10 : 0;
        team.avgDamage = team.totalGames > 0 ? 
        Math.round((team.totalDamage / team.totalGames) * 10) / 10 : 0;
    });

    return Object.values(teamStats)
      .filter(team => team.totalGames >= 2) // Pelo menos 2 jogos
      .sort((a, b) => b.winRate - a.winRate);
  };

  const formatNumber = (num) => {
    if (!num || num === 0) return '0';
    return Math.round(num).toString();
  };

  const formatPercentage = (num) => {
    return num ? `${num}%` : '0%';
  };

  // Função para criar equipas balanceadas automaticamente
  const generateBalancedTeams = (playerNames) => {
    if (playerNames.length !== 8) {
      alert('Por favor, seleciona exatamente 8 jogadores!');
      return;
    }

    // Obter dados dos jogadores selecionados
    const selectedPlayersData = players.filter(p => playerNames.includes(p.name));
    
    // Calcular max e min para os jogadores selecionados
    const maxDowns = Math.max(...selectedPlayersData.map(p => p.avgDowns || 0));
    const minDowns = Math.min(...selectedPlayersData.map(p => p.avgDowns || 0));
    const maxDamage = Math.max(...selectedPlayersData.map(p => p.avgDamage || 0));
    const minDamage = Math.min(...selectedPlayersData.map(p => p.avgDamage || 0));
    const maxRevives = Math.max(...selectedPlayersData.map(p => p.avgRevives || 0));
    const minRevives = Math.min(...selectedPlayersData.map(p => p.avgRevives || 0));
    const maxCaptures = Math.max(...selectedPlayersData.map(p => p.avgCaptures || 0));
    const minCaptures = Math.min(...selectedPlayersData.map(p => p.avgCaptures || 0));
    
    // Calcular range (diferença entre max e min)
    const rangeDowns = maxDowns - minDowns || 1;
    const rangeDamage = maxDamage - minDamage || 1;
    const rangeRevives = maxRevives - minRevives || 1;
    const rangeCaptures = maxCaptures - minCaptures || 1;
    
    // Calcular max e min para assists também
    const maxAssists = Math.max(...selectedPlayersData.map(p => p.avgAssists || 0));
    const minAssists = Math.min(...selectedPlayersData.map(p => p.avgAssists || 0));
    const rangeAssists = maxAssists - minAssists || 1;
    
    // Calcular ranking de cada jogador com as percentagens especificadas
    const playersWithRank = selectedPlayersData.map(player => {
      // Todos os valores são normalizados para 0-1 baseado no range dos jogadores selecionados
      // e depois multiplicados pelo seu peso percentual
      
      // Win Rate (10%) - normalizar de 0-100 para 0-1, depois aplicar 10%
      const winRateNorm = (player.winRate || 0) / 100;
      const winRateScore = winRateNorm * 10;
      
      // Downs (35%) - normalizar para o range dos jogadores selecionados
      const downsNorm = rangeDowns > 0 ? ((player.avgDowns || 0) - minDowns) / rangeDowns : 0;
      const normDowns = downsNorm * 35;
      
      // Damage (30%) - normalizar para o range dos jogadores selecionados
      const damageNorm = rangeDamage > 0 ? ((player.avgDamage || 0) - minDamage) / rangeDamage : 0;
      const normDamage = damageNorm * 30;
      
      // Revives (10%) - normalizar para o range dos jogadores selecionados
      const revivesNorm = rangeRevives > 0 ? ((player.avgRevives || 0) - minRevives) / rangeRevives : 0;
      const normRevives = revivesNorm * 10;
      
      // Captures (10%) - normalizar para o range dos jogadores selecionados
      const capturesNorm = rangeCaptures > 0 ? ((player.avgCaptures || 0) - minCaptures) / rangeCaptures : 0;
      const normCaptures = capturesNorm * 10;
      
      // Assists (5%) - normalizar para o range dos jogadores selecionados
      const assistsNorm = rangeAssists > 0 ? ((player.avgAssists || 0) - minAssists) / rangeAssists : 0;
      const normAssists = assistsNorm * 5;
      
      const totalScore = winRateScore + normDowns + normDamage + normRevives + normCaptures + normAssists;
      
      return {
        ...player,
        rank: totalScore
      };
    });

    // Ordenar por ranking (do mais forte ao mais fraco)
    const sortedPlayers = [...playersWithRank].sort((a, b) => b.rank - a.rank);

    // Algoritmo melhorado: distribuir para equilibrar a força total
    // A estratégia: 1º vai Team 1, 2º vai Team 2, 3º vai Team 2, 4º vai Team 1
    // Depois distribuir os restantes para equilibrar
    const team1 = [];
    const team2 = [];

    // Distribuir os 4 primeiros de forma balanceada
    // Posição 1 → Team 1 (mais forte)
    // Posição 2 → Team 2
    // Posição 3 → Team 2
    // Posição 4 → Team 1
    team1.push(sortedPlayers[0]); // Mais forte
    team2.push(sortedPlayers[1]);
    team2.push(sortedPlayers[2]);
    team1.push(sortedPlayers[3]);

    // Agora distribuir os 4 restantes
    // Posição 5 → Team 1
    // Posição 6 → Team 2
    // Posição 7 → Team 2
    // Posição 8 → Team 1
    team1.push(sortedPlayers[4]);
    team2.push(sortedPlayers[5]);
    team2.push(sortedPlayers[6]);
    team1.push(sortedPlayers[7]);

    // Calcular força total de cada equipa
    const team1Strength = team1.reduce((sum, p) => sum + p.rank, 0);
    const team2Strength = team2.reduce((sum, p) => sum + p.rank, 0);

    return {
      team1,
      team2,
      team1Strength: team1Strength.toFixed(2),
      team2Strength: team2Strength.toFixed(2),
      difference: Math.abs(team1Strength - team2Strength).toFixed(2)
    };
  };

  // Função para selecionar/desselecionar jogador
  const togglePlayerSelection = (playerName) => {
    if (selectedPlayers.includes(playerName)) {
      setSelectedPlayers(selectedPlayers.filter(name => name !== playerName));
      setGeneratedTeams(null); // Reset teams when selection changes
    } else {
      if (selectedPlayers.length < 8) {
        setSelectedPlayers([...selectedPlayers, playerName]);
        setGeneratedTeams(null); // Reset teams when selection changes
      } else {
        alert('Só podes selecionar 8 jogadores!');
      }
    }
  };

  // Função para gerar as equipas
  const handleGenerateTeams = () => {
    if (selectedPlayers.length !== 8) {
      alert('Por favor, seleciona exatamente 8 jogadores!');
      return;
    }

    const teams = generateBalancedTeams(selectedPlayers);
    setGeneratedTeams(teams);
  };

  // Função para resetar seleção
  const handleResetSelection = () => {
    setSelectedPlayers([]);
    setGeneratedTeams(null);
  };


  if (loading) {
    return (
      <div className="team-management-overlay">
        <div className="team-management-container">
          <div className="loading">Carregando dados...</div>
        </div>
      </div>
    );
  }

  const duoStats = selectedPlayer ? calculateDuoStats(selectedPlayer) : [];
  const teamStats = calculateTeamStats();

  return (
    <div className="team-management-overlay">
      <div className="team-management-container">
        <div className="team-management-header">
          <h2>👥 Gestão de Equipa</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="team-management-content">
          {/* Tabs */}
          <div className="team-tabs">
            <button 
              className={`tab ${activeTab === 'duplas' ? 'active' : ''}`}
              onClick={() => setActiveTab('duplas')}
            >
              👥 Duplas
            </button>
            <button 
              className={`tab ${activeTab === 'equipas' ? 'active' : ''}`}
              onClick={() => setActiveTab('equipas')}
            >
              🏆 Equipas
            </button>
            <button 
              className={`tab ${activeTab === 'fazer-equipas' ? 'active' : ''}`}
              onClick={() => setActiveTab('fazer-equipas')}
            >
              ⚖️ Fazer Equipas
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'duplas' && (
            <div className="duos-stats">
              <h3>Análise de Duplas</h3>
              
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
                    <h4>Parcerias de {selectedPlayer}</h4>
                    <button 
                      className="back-btn"
                      onClick={() => setSelectedPlayer(null)}
                    >
                      ← Voltar
                    </button>
                  </div>

                  {duoStats.length === 0 ? (
                    <p className="no-data">Este jogador ainda não jogou com outros jogadores.</p>
                  ) : (
                    <>
                      {/* Top 3 Melhores Parcerias */}
                      <div className="top-partnerships">
                        <h5>🏆 Top 3 Melhores Parcerias</h5>
                        <div className="partnership-cards">
                          {duoStats.slice(0, 3).map((duo, index) => (
                            <div key={duo.name} className={`partnership-card ${index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'}`}>
                              <div className="rank">#{index + 1}</div>
                              <div className="partner-name">{duo.name}</div>
                              <div className="partner-stats">
                                <span className="winrate">{formatPercentage(duo.winRate)}</span>
                                <span className="games">{duo.totalGames} jogos</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tabela Completa */}
                      <div className="stats-table-container">
                        <table className="team-stats-table">
                          <thead>
                            <tr>
                              <th>Parceiro</th>
                              <th>Jogos</th>
                              <th>Vitórias</th>
                              <th>Derrotas</th>
                              <th>Win Rate</th>
                              <th>K/D</th>
                              <th>Avg Downs</th>
                              <th>Avg Damage</th>
                              <th>Operadores</th>
                            </tr>
                          </thead>
                          <tbody>
                            {duoStats.map((duo) => (
                              <tr key={duo.name}>
                                <td className="partner-name">{duo.name}</td>
                                <td>{duo.totalGames}</td>
                                <td className="win">{duo.totalWins}</td>
                                <td className="loss">{duo.totalLosses}</td>
                                <td className="winrate">{formatPercentage(duo.winRate)}</td>
                                <td className="kd">{duo.kdRatio}</td>
                                <td>{duo.avgDowns}</td>
                                <td>{formatNumber(duo.avgDamage)}</td>
                                <td className="operators">{duo.uniqueOperators}</td>
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
          )}

          {activeTab === 'equipas' && (
            <div className="teams-stats">
              <h3>Análise de Equipas</h3>
              
              {teamStats.length === 0 ? (
                <p className="no-data">Nenhuma equipa com dados suficientes encontrada.</p>
              ) : (
                <>
                  {/* Top 3 Melhores Equipas */}
                  <div className="top-teams">
                    <h5>🏆 Top 3 Melhores Equipas</h5>
                    <div className="team-cards">
                      {teamStats.slice(0, 3).map((team, index) => (
                        <div key={team.players} className={`team-card ${index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'}`}>
                          <div className="rank">#{index + 1}</div>
                          <div className="team-players">{team.players}</div>
                          <div className="team-stats">
                            <span className="winrate">{formatPercentage(team.winRate)}</span>
                            <span className="games">{team.totalGames} jogos</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tabela Completa */}
                  <div className="stats-table-container">
                    <table className="team-stats-table">
                      <thead>
                        <tr>
                          <th>Equipa</th>
                          <th>Jogos</th>
                          <th>Vitórias</th>
                          <th>Derrotas</th>
                          <th>Win Rate</th>
                          <th>Avg Downs</th>
                          <th>Avg Damage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamStats.map((team) => (
                          <tr key={team.players}>
                            <td className="team-players">{team.players}</td>
                            <td>{team.totalGames}</td>
                            <td className="win">{team.totalWins}</td>
                            <td className="loss">{team.totalLosses}</td>
                            <td className="winrate">{formatPercentage(team.winRate)}</td>
                            <td>{team.avgDowns}</td>
                            <td>{formatNumber(team.avgDamage)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'fazer-equipas' && (
            <div className="team-maker">
              <h3>⚖️ Criar Equipas</h3>
              
              <div className="score-explanation">
                <h3>📊 Como é Calculado o Ranking</h3>
                <div className="score-breakdown">
                  <div className="score-item">
                    <span className="score-label">Win Rate:</span>
                    <span className="score-percentage">10%</span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Avg Downs:</span>
                    <span className="score-percentage">35%</span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Avg Damage:</span>
                    <span className="score-percentage">30%</span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Avg Revives:</span>
                    <span className="score-percentage">10%</span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Avg Captures:</span>
                    <span className="score-percentage">10%</span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Avg Assists:</span>
                    <span className="score-percentage">5%</span>
                  </div>
                </div>
              </div>
              
              <div className="maker-instructions">
                <p>Seleciona 8 jogadores que vão jogar!</p>
                <div className="selection-counter">
                  <span className={`counter ${selectedPlayers.length === 8 ? 'complete' : ''}`}>
                    {selectedPlayers.length}/8 Jogadores selecionados
                  </span>
                </div>
              </div>

              {/* Lista de jogadores para selecionar */}
              <div className="player-selection-grid">
                {players.length === 0 ? (
                  <p className="no-players">Nenhum jogador encontrado.</p>
                ) : (
                  players.map((player) => {
                    const isSelected = selectedPlayers.includes(player.name);
                    return (
                      <button
                        key={player.name}
                        className={`player-select-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => togglePlayerSelection(player.name)}
                      >
                        <div className="select-indicator">{isSelected ? '✓' : ''}</div>
                        <div className="player-name">{player.name}</div>
                        <div className="player-stats-mini">
                          <span className="winrate">{formatPercentage(player.winRate)}</span>
                          <span className="games">{player.totalGames} jogos</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Botões de ação */}
              <div className="maker-actions">
                <button 
                  className="generate-btn"
                  onClick={handleGenerateTeams}
                  disabled={selectedPlayers.length !== 8}
                >
                  ⚖️ Criar Equipa
                </button>
                {selectedPlayers.length > 0 && (
                  <button 
                    className="reset-btn"
                    onClick={handleResetSelection}
                  >
                    🔄 Reset Seleção
                  </button>
                )}
              </div>

              {/* Mostrar equipas geradas */}
              {generatedTeams && (
                <div className="generated-teams">
                  <h4>✨ Equipas</h4>
                  
                  <div className="balance-info">
                    <span>Diferença de Força: {generatedTeams.difference}</span>
                    <span className={`balance-status ${parseFloat(generatedTeams.difference) < 5 ? 'balanced' : 'unbalanced'}`}>
                      {parseFloat(generatedTeams.difference) < 5 ? '✓ Equilibrado' : '⚠ Desequilibrado'}
                    </span>
                  </div>

                  <div className="teams-display">
                    {/* Team 1 */}
                    <div className="generated-team team-1">
                      <div className="team-header">
                        <h5>🟥 Equipa 1</h5>
                        <span className="team-strength">Força: {generatedTeams.team1Strength}</span>
                      </div>
                      <div className="team-players-list">
                        {generatedTeams.team1.map((player, index) => (
                          <div key={player.name} className="team-player">
                            <span className="player-position">#{index + 1}</span>
                            <span className="player-name">{player.name}</span>
                            <div className="player-mini-stats">
                              <span>WR: {formatPercentage(player.winRate)}</span>
                              <span>Avg Downs: {player.avgDowns}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Team 2 */}
                    <div className="generated-team team-2">
                      <div className="team-header">
                        <h5>🟦 Equipa 2</h5>
                        <span className="team-strength">Força: {generatedTeams.team2Strength}</span>
                      </div>
                      <div className="team-players-list">
                        {generatedTeams.team2.map((player, index) => (
                          <div key={player.name} className="team-player">
                            <span className="player-position">#{index + 1}</span>
                            <span className="player-name">{player.name}</span>
                            <div className="player-mini-stats">
                              <span>WR: {formatPercentage(player.winRate)}</span>
                              <span>Avg Downs: {player.avgDowns}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;
