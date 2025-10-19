import { useState, useEffect } from 'react';
import { getPlayers } from '../firebase/players';
import { subscribeToBattles } from '../firebase/battles';
import './OperatorStats.css';

const OperatorStats = ({ onClose }) => {
  const [players, setPlayers] = useState([]);
  const [battles, setBattles] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general'); // 'general' ou 'individual'

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

  // Calcular estatísticas gerais dos operadores
  const calculateGeneralOperatorStats = () => {
    const operatorStats = {};
    
    battles.forEach(battle => {
      const allPlayers = [...battle.team1, ...battle.team2];
      const isTeam1Winner = battle.result === 'win';
      
      allPlayers.forEach(player => {
        if (player.operator) {
          if (!operatorStats[player.operator]) {
            operatorStats[player.operator] = {
              name: player.operator,
              totalGames: 0,
              totalWins: 0,
              totalLosses: 0,
              totalElims: 0,
              totalDowns: 0,
              totalAssists: 0,
              totalRevives: 0,
              totalDamage: 0,
              totalCaptures: 0,
              players: new Set()
            };
          }
          
          const isWinner = (battle.team1.includes(player) && isTeam1Winner) || 
                          (battle.team2.includes(player) && !isTeam1Winner);
          
          operatorStats[player.operator].totalGames++;
          operatorStats[player.operator].totalWins += isWinner ? 1 : 0;
          operatorStats[player.operator].totalLosses += isWinner ? 0 : 1;
          operatorStats[player.operator].totalElims += player.elims || 0;
          operatorStats[player.operator].totalDowns += player.downs || 0;
          operatorStats[player.operator].totalAssists += player.assists || 0;
          operatorStats[player.operator].totalRevives += player.revives || 0;
          operatorStats[player.operator].totalDamage += player.damage || 0;
          operatorStats[player.operator].totalCaptures += player.captures || 0;
          operatorStats[player.operator].players.add(player.name);
        }
      });
    });

    // Calcular percentagens e médias
    Object.values(operatorStats).forEach(operator => {
      operator.winRate = operator.totalGames > 0 ? 
        Math.round((operator.totalWins / operator.totalGames) * 100) : 0;
      operator.avgElims = operator.totalGames > 0 ? 
        Math.round((operator.totalElims / operator.totalGames) * 10) / 10 : 0;
        operator.avgDowns = operator.totalGames > 0 ? 
        Math.round((operator.totalDowns / operator.totalGames) * 10) / 10 : 0;
        operator.avgAssists = operator.totalGames > 0 ? 
        Math.round((operator.totalAssists / operator.totalGames) * 10) / 10 : 0;
        operator.avgDamage = operator.totalGames > 0 ? 
        Math.round((operator.totalDamage / operator.totalGames) * 10) / 10 : 0;
      operator.uniquePlayers = operator.players.size;
      
      // Calcular score usando a mesma fórmula do ranking geral
      // Win Rate (35%) + Downs (35%) + Damage (15%) + Revives (10%) + Captures (5%)
      const winRateScore = (operator.winRate / 100) * 35;
      const downsScore = Math.min(operator.avgDowns / 30, 1) * 35; // 30 downs = 100%
      const damageScore = Math.min(operator.avgDamage / 3000, 1) * 15; // 3000 damage = 100%
      const revivesScore = Math.min((operator.totalRevives / operator.totalGames) / 10, 1) * 10; // 10 revives = 100%
      const capturesScore = Math.min((operator.totalCaptures / operator.totalGames) / 5, 1) * 5; // 5 captures = 100%
      
      operator.weightedScore = Math.round((winRateScore + downsScore + damageScore + revivesScore + capturesScore) * 100) / 100;
    });

    return Object.values(operatorStats).sort((a, b) => b.weightedScore - a.weightedScore);
  };

  // Calcular estatísticas individuais de operadores por jogador
  const calculateIndividualOperatorStats = (playerName) => {
    const playerBattles = battles.filter(battle => 
      battle.team1.some(p => p.name === playerName) || 
      battle.team2.some(p => p.name === playerName)
    );

    const operatorStats = {};
    
    playerBattles.forEach(battle => {
      const allPlayers = [...battle.team1, ...battle.team2];
      const player = allPlayers.find(p => p.name === playerName);
      const isTeam1Winner = battle.result === 'win';
      const isWinner = (battle.team1.includes(player) && isTeam1Winner) || 
                      (battle.team2.includes(player) && !isTeam1Winner);
      
      if (player && player.operator) {
        if (!operatorStats[player.operator]) {
          operatorStats[player.operator] = {
            name: player.operator,
            totalGames: 0,
            totalWins: 0,
            totalLosses: 0,
            totalElims: 0,
            totalDowns: 0,
            totalAssists: 0,
            totalRevives: 0,
            totalDamage: 0,
            totalCaptures: 0
          };
        }
        
        operatorStats[player.operator].totalGames++;
        operatorStats[player.operator].totalWins += isWinner ? 1 : 0;
        operatorStats[player.operator].totalLosses += isWinner ? 0 : 1;
        operatorStats[player.operator].totalElims += player.elims || 0;
        operatorStats[player.operator].totalDowns += player.downs || 0;
        operatorStats[player.operator].totalAssists += player.assists || 0;
        operatorStats[player.operator].totalRevives += player.revives || 0;
        operatorStats[player.operator].totalDamage += player.damage || 0;
        operatorStats[player.operator].totalCaptures += player.captures || 0;
      }
    });

    // Calcular percentagens e médias
    Object.values(operatorStats).forEach(operator => {
      operator.winRate = operator.totalGames > 0 ? 
        Math.round((operator.totalWins / operator.totalGames) * 100) : 0;
      operator.avgElims = operator.totalGames > 0 ? 
        Math.round((operator.totalElims / operator.totalGames) * 10) / 10 : 0;
        operator.avgDowns = operator.totalGames > 0 ? 
        Math.round((operator.totalDowns / operator.totalGames) * 10) / 10 : 0;
        operator.avgAssists = operator.totalGames > 0 ? 
        Math.round((operator.totalAssists / operator.totalGames) * 10) / 10 : 0;
        operator.avgDamage = operator.totalGames > 0 ? 
        Math.round((operator.totalDamage / operator.totalGames) * 10) / 10 : 0;
      
      // Calcular score usando a mesma fórmula do ranking geral
      // Win Rate (35%) + Downs (35%) + Damage (15%) + Revives (10%) + Captures (5%)
      const winRateScore = (operator.winRate / 100) * 35;
      const downsScore = Math.min(operator.avgDowns / 30, 1) * 35; // 30 downs = 100%
      const damageScore = Math.min(operator.avgDamage / 3000, 1) * 15; // 3000 damage = 100%
      const revivesScore = Math.min((operator.totalRevives / operator.totalGames) / 10, 1) * 10; // 10 revives = 100%
      const capturesScore = Math.min((operator.totalCaptures / operator.totalGames) / 5, 1) * 5; // 5 captures = 100%
      
      operator.weightedScore = Math.round((winRateScore + downsScore + damageScore + revivesScore + capturesScore) * 100) / 100;
    });

    return Object.values(operatorStats).sort((a, b) => b.weightedScore - a.weightedScore);
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

  // Calcular número de MVPs por operador
  const calculateOperatorMVPs = (operatorName) => {
    return battles.filter(battle => {
      const mvp = calculateMVP(battle);
      return mvp && mvp.operator === operatorName;
    }).length;
  };

  if (loading) {
    return (
      <div className="operator-stats-overlay">
        <div className="operator-stats-container">
          <div className="loading">Carregando dados...</div>
        </div>
      </div>
    );
  }

  const generalStats = calculateGeneralOperatorStats();

  return (
    <div className="operator-stats-overlay">
      <div className="operator-stats-container">
        <div className="operator-stats-header">
          <h2>🎮 Estatísticas de Operadores</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="operator-stats-content">
          {/* Tabs */}
          <div className="operator-tabs">
            <button 
              className={`tab ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              📊 Geral
            </button>
            <button 
              className={`tab ${activeTab === 'individual' ? 'active' : ''}`}
              onClick={() => setActiveTab('individual')}
            >
              👤 Individual
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'general' ? (
            <div className="general-stats">
              <h3>Estatísticas Gerais dos Operadores</h3>
              <div className="stats-table-container">
                <table className="operator-stats-table">
                  <thead>
                    <tr>
                      <th>Operador</th>
                      <th>Jogos</th>
                      <th>Vitórias</th>
                      <th>Derrotas</th>
                      <th>Win Rate</th>
                      <th>Score</th>
                      <th>Jogadores</th>
                      <th>Avg Downs</th>
                      <th>Avg Damage</th>
                      <th>MVPs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generalStats.map((operator) => (
                      <tr key={operator.name}>
                        <td className="operator-name">{operator.name}</td>
                        <td>{operator.totalGames}</td>
                        <td className="win">{operator.totalWins}</td>
                        <td className="loss">{operator.totalLosses}</td>
                        <td className="winrate">{formatPercentage(operator.winRate)}</td>
                        <td className="score">{operator.weightedScore.toFixed(1)}</td>
                        <td>{operator.uniquePlayers}</td>
                        <td>{operator.avgDowns}</td>
                        <td>{formatNumber(operator.avgDamage)}</td>
                        <td className="mvp">{calculateOperatorMVPs(operator.name)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="individual-stats">
              <h3>Estatísticas Individuais por Jogador</h3>
              
              {!selectedPlayer ? (
                <div className="player-selection">
                  <h4>Escolhe um jogador:</h4>
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
                    <h4>{selectedPlayer}</h4>
                    <button 
                      className="back-btn"
                      onClick={() => setSelectedPlayer(null)}
                    >
                      ← Voltar
                    </button>
                  </div>

                  <div className="stats-table-container">
                    <table className="operator-stats-table">
                      <thead>
                        <tr>
                          <th>Operador</th>
                          <th>Jogos</th>
                          <th>Vitórias</th>
                          <th>Derrotas</th>
                          <th>Win Rate</th>
                          <th>Score</th>
                          <th>Avg Downs</th>
                          <th>Avg Damage</th>
                          <th>MVPs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculateIndividualOperatorStats(selectedPlayer).map((operator) => (
                          <tr key={operator.name}>
                            <td className="operator-name">{operator.name}</td>
                            <td>{operator.totalGames}</td>
                            <td className="win">{operator.totalWins}</td>
                            <td className="loss">{operator.totalLosses}</td>
                            <td className="winrate">{formatPercentage(operator.winRate)}</td>
                            <td className="score">{operator.weightedScore.toFixed(1)}</td>
                            <td>{operator.avgDowns}</td>
                            <td>{formatNumber(operator.avgDamage)}</td>
                            <td className="mvp">{calculateOperatorMVPs(operator.name)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

export default OperatorStats;
