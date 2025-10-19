import { useState, useEffect } from 'react';
import { getPlayers } from '../firebase/players';
import { subscribeToBattles } from '../firebase/battles';
import './PlayerComparison.css';

const PlayerComparison = ({ onClose }) => {
  const [players, setPlayers] = useState([]);
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [minGames, setMinGames] = useState(1);

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

  // Calcular estatísticas de um jogador
  const calculatePlayerStats = (playerName) => {
    if (!playerName) return null;

    const playerBattles = battles.filter(battle => 
      battle.team1.some(p => p.name === playerName) || 
      battle.team2.some(p => p.name === playerName)
    );

    if (playerBattles.length < minGames) return null;

    const stats = {
      name: playerName,
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      totalDowns: 0,
      totalDamage: 0,
      totalRevives: 0,
      totalCaptures: 0,
      totalAssists: 0,
      operators: new Map(),
      maps: new Map()
    };

    playerBattles.forEach(battle => {
      const playerInBattle = [...battle.team1, ...battle.team2].find(p => p.name === playerName);
      if (!playerInBattle) return;

      const isTeam1Winner = battle.result === 'win';
      const playerTeam = battle.team1.some(p => p.name === playerName) ? 'team1' : 'team2';
      const isWinner = (playerTeam === 'team1' && isTeam1Winner) || (playerTeam === 'team2' && !isTeam1Winner);
      
      stats.totalGames++;
      stats.totalWins += isWinner ? 1 : 0;
      stats.totalLosses += isWinner ? 0 : 1;
      stats.totalDowns += playerInBattle.downs || 0;
      stats.totalDamage += playerInBattle.damage || 0;
      stats.totalRevives += playerInBattle.revives || 0;
      stats.totalCaptures += playerInBattle.captures || 0;
      stats.totalAssists += playerInBattle.assists || 0;

      // Contar operadores
      if (playerInBattle.operator) {
        const currentCount = stats.operators.get(playerInBattle.operator) || 0;
        stats.operators.set(playerInBattle.operator, currentCount + 1);
      }

      // Contar mapas
      if (battle.map) {
        const currentCount = stats.maps.get(battle.map) || 0;
        stats.maps.set(battle.map, currentCount + 1);
      }
    });

    // Calcular médias e percentagens
    stats.winRate = stats.totalGames > 0 ? Math.round((stats.totalWins / stats.totalGames) * 100) : 0;
    stats.avgDowns = stats.totalGames > 0 ? Math.round((stats.totalDowns / stats.totalGames) * 10) / 10 : 0;
    stats.avgDamage = stats.totalGames > 0 ? Math.round((stats.totalDamage / stats.totalGames) * 10) / 10 : 0;
    stats.avgRevives = stats.totalGames > 0 ? Math.round((stats.totalRevives / stats.totalGames) * 10) / 10 : 0;
    stats.avgCaptures = stats.totalGames > 0 ? Math.round((stats.totalCaptures / stats.totalGames) * 10) / 10 : 0;
    stats.avgAssists = stats.totalGames > 0 ? Math.round((stats.totalAssists / stats.totalGames) * 10) / 10 : 0;
    stats.totalMVPs = calculatePlayerMVPs(playerName);

    // Encontrar operador favorito
    let favoriteOperator = '';
    let maxUses = 0;
    stats.operators.forEach((count, operator) => {
      if (count > maxUses) {
        maxUses = count;
        favoriteOperator = operator;
      }
    });
    stats.favoriteOperator = favoriteOperator;

    // Encontrar mapa favorito
    let favoriteMap = '';
    let maxMapUses = 0;
    stats.maps.forEach((count, map) => {
      if (count > maxMapUses) {
        maxMapUses = count;
        favoriteMap = map;
      }
    });
    stats.favoriteMap = favoriteMap;

    return stats;
  };

  // Calcular comparação entre dois jogadores
  const calculateComparison = () => {
    if (!player1 || !player2) return null;

    const stats1 = calculatePlayerStats(player1);
    const stats2 = calculatePlayerStats(player2);

    if (!stats1 || !stats2) return null;

    const comparison = {
      player1: stats1,
      player2: stats2,
      winner: null,
      advantages: {
        player1: [],
        player2: []
      }
    };

    // Calcular score combinado para cada jogador (mesma fórmula do ranking geral)
    // Win Rate (35%) + Downs (35%) + Damage (15%) + Revives (7.5%) + Captures (7.5%)
    const calculateCombinedScore = (stats) => {
      const winRateScore = (stats.winRate / 100) * 35;
      const downsScore = Math.min(stats.avgDowns / 30, 1) * 35; // 30 downs = 100%
      const damageScore = Math.min(stats.avgDamage / 3000, 1) * 15; // 3000 damage = 100%
      const revivesScore = Math.min(stats.avgRevives / 10, 1) * 7.5; // 10 revives = 100%
      const capturesScore = Math.min(stats.avgCaptures / 5, 1) * 7.5; // 5 captures = 100%
      
      return Math.round((winRateScore + downsScore + damageScore + revivesScore + capturesScore) * 100) / 100;
    };

    const score1 = calculateCombinedScore(stats1);
    const score2 = calculateCombinedScore(stats2);

    // Determinar vencedor baseado no score combinado
    if (score1 > score2 + 2) { // Margem de 2 pontos para evitar empates por diferenças mínimas
      comparison.winner = player1;
    } else if (score2 > score1 + 2) {
      comparison.winner = player2;
    }

    // Adicionar scores à comparação para exibição
    comparison.player1Score = score1;
    comparison.player2Score = score2;

    // Calcular vantagens
    const metrics = [
      { key: 'winRate', label: 'Win Rate', player1: stats1.winRate, player2: stats2.winRate, higher: true },
      { key: 'avgDowns', label: 'Avg Downs', player1: stats1.avgDowns, player2: stats2.avgDowns, higher: true },
      { key: 'avgDamage', label: 'Avg Damage', player1: stats1.avgDamage, player2: stats2.avgDamage, higher: true },
      { key: 'avgRevives', label: 'Avg Revives', player1: stats1.avgRevives, player2: stats2.avgRevives, higher: true },
      { key: 'avgCaptures', label: 'Avg Captures', player1: stats1.avgCaptures, player2: stats2.avgCaptures, higher: true },
      { key: 'avgAssists', label: 'Avg Assists', player1: stats1.avgAssists, player2: stats2.avgAssists, higher: true },
      { key: 'totalMVPs', label: 'MVPs', player1: stats1.totalMVPs, player2: stats2.totalMVPs, higher: true }
    ];

    metrics.forEach(metric => {
      const diff = Math.abs(metric.player1 - metric.player2);
      if (diff > 0.1) { // Só considerar diferenças significativas
        if (metric.higher ? metric.player1 > metric.player2 : metric.player1 < metric.player2) {
          comparison.advantages.player1.push({
            metric: metric.label,
            value: metric.player1,
            opponentValue: metric.player2,
            difference: diff
          });
        } else {
          comparison.advantages.player2.push({
            metric: metric.label,
            value: metric.player2,
            opponentValue: metric.player1,
            difference: diff
          });
        }
      }
    });

    return comparison;
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

  // Calcular número de MVPs por jogador
  const calculatePlayerMVPs = (playerName) => {
    return battles.filter(battle => {
      const mvp = calculateMVP(battle);
      return mvp && mvp.name === playerName;
    }).length;
  };

  if (loading) {
    return (
      <div className="player-comparison-overlay">
        <div className="player-comparison-container">
          <div className="loading">Carregando dados...</div>
        </div>
      </div>
    );
  }

  const comparison = calculateComparison();

  return (
    <div className="player-comparison-overlay">
      <div className="player-comparison-container">
        <div className="player-comparison-header">
          <h2>⚔️ Comparação 1v1</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="player-comparison-content">
          {/* Seleção de Jogadores */}
          <div className="player-selection">
            <div className="selection-group">
              <label htmlFor="player1">Jogador 1:</label>
              <select 
                id="player1" 
                value={player1} 
                onChange={(e) => setPlayer1(e.target.value)}
                className="player-select"
              >
                <option value="">Escolhe um jogador</option>
                {players.map(player => (
                  <option key={player.name} value={player.name}>{player.name}</option>
                ))}
              </select>
            </div>

            <div className="vs-divider">
              <span>VS</span>
            </div>

            <div className="selection-group">
              <label htmlFor="player2">Jogador 2:</label>
              <select 
                id="player2" 
                value={player2} 
                onChange={(e) => setPlayer2(e.target.value)}
                className="player-select"
              >
                <option value="">Escolhe um jogador</option>
                {players.map(player => (
                  <option key={player.name} value={player.name}>{player.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtros */}
          <div className="comparison-filters">
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
          </div>

          {/* Comparação */}
          {comparison ? (
            <div className="comparison-results">
              {/* Vencedor e Scores */}
              <div className="winner-section">
                {comparison.winner ? (
                  <div className="winner-announcement">
                    <h3>🏆 {comparison.winner} é o vencedor!</h3>
                    <div className="scores-display">
                      <span className="score-item">
                        {comparison.player1.name}: <strong>{comparison.player1Score.toFixed(1)}</strong>
                      </span>
                      <span className="score-separator">vs</span>
                      <span className="score-item">
                        {comparison.player2.name}: <strong>{comparison.player2Score.toFixed(1)}</strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="tie-announcement">
                    <h3>🤝 Empate técnico!</h3>
                    <div className="scores-display">
                      <span className="score-item">
                        {comparison.player1.name}: <strong>{comparison.player1Score.toFixed(1)}</strong>
                      </span>
                      <span className="score-separator">vs</span>
                      <span className="score-item">
                        {comparison.player2.name}: <strong>{comparison.player2Score.toFixed(1)}</strong>
                      </span>
                    </div>
                    <p className="tie-explanation">Diferença menor que 2 pontos</p>
                  </div>
                )}
              </div>

              {/* Estatísticas Comparativas */}
              <div className="stats-comparison">
                <div className="player-stats-card">
                  <h4>{comparison.player1.name}</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Jogos</span>
                      <span className="stat-value">{comparison.player1.totalGames}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Win Rate</span>
                      <span className="stat-value winrate">{formatPercentage(comparison.player1.winRate)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Avg Downs</span>
                      <span className="stat-value">{comparison.player1.avgDowns}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Avg Damage</span>
                      <span className="stat-value">{formatNumber(comparison.player1.avgDamage)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Avg Revives</span>
                      <span className="stat-value">{comparison.player1.avgRevives}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Avg Captures</span>
                      <span className="stat-value">{comparison.player1.avgCaptures}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">MVPs</span>
                      <span className="stat-value mvp">{comparison.player1.totalMVPs}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Operador Favorito</span>
                      <span className="stat-value operator">{comparison.player1.favoriteOperator || '-'}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Mapa Favorito</span>
                      <span className="stat-value map">{comparison.player1.favoriteMap || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="vs-divider-large">
                  <span>VS</span>
                </div>

                <div className="player-stats-card">
                  <h4>{comparison.player2.name}</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Jogos</span>
                      <span className="stat-value">{comparison.player2.totalGames}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Win Rate</span>
                      <span className="stat-value winrate">{formatPercentage(comparison.player2.winRate)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Avg Downs</span>
                      <span className="stat-value">{comparison.player2.avgDowns}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Avg Damage</span>
                      <span className="stat-value">{formatNumber(comparison.player2.avgDamage)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Avg Revives</span>
                      <span className="stat-value">{comparison.player2.avgRevives}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Avg Captures</span>
                      <span className="stat-value">{comparison.player2.avgCaptures}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">MVPs</span>
                      <span className="stat-value mvp">{comparison.player2.totalMVPs}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Operador Favorito</span>
                      <span className="stat-value operator">{comparison.player2.favoriteOperator || '-'}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Mapa Favorito</span>
                      <span className="stat-value map">{comparison.player2.favoriteMap || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vantagens */}
              <div className="advantages-section">
                <div className="advantages-card">
                  <h4>🎯 Vantagens de {comparison.player1.name}</h4>
                  {comparison.advantages.player1.length > 0 ? (
                    <ul className="advantages-list">
                      {comparison.advantages.player1.map((advantage, index) => (
                        <li key={index} className="advantage-item">
                          <span className="advantage-metric">{advantage.metric}</span>
                          <span className="advantage-values">
                            {advantage.value} vs {advantage.opponentValue}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-advantages">Nenhuma vantagem significativa</p>
                  )}
                </div>

                <div className="advantages-card">
                  <h4>🎯 Vantagens de {comparison.player2.name}</h4>
                  {comparison.advantages.player2.length > 0 ? (
                    <ul className="advantages-list">
                      {comparison.advantages.player2.map((advantage, index) => (
                        <li key={index} className="advantage-item">
                          <span className="advantage-metric">{advantage.metric}</span>
                          <span className="advantage-values">
                            {advantage.value} vs {advantage.opponentValue}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-advantages">Nenhuma vantagem significativa</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="no-comparison">
              <p>Seleciona dois jogadores para comparar as estatísticas!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerComparison;
