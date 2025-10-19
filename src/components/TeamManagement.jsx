import { useState, useEffect } from 'react';
import { getPlayers } from '../firebase/players';
import { subscribeToBattles } from '../firebase/battles';
import './TeamManagement.css';

const TeamManagement = ({ onClose }) => {
  const [players, setPlayers] = useState([]);
  const [battles, setBattles] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('duplas'); // 'duplas' ou 'equipas'

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
          </div>

          {/* Tab Content */}
          {activeTab === 'duplas' ? (
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
          ) : (
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
                        {teamStats.map((team, index) => (
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
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;
