// Cálculos de estatísticas partilhados por todas as páginas do Rogue Tracker.
// As fórmulas são as mesmas que estavam espalhadas (e duplicadas) pelos componentes.

import { hasTeamRivalries } from './rivalries';

const r1 = (n) => Math.round(n * 10) / 10;

export const battleDate = (battle) =>
  new Date(battle.createdAt?.toDate ? battle.createdAt.toDate() : battle.createdAt);

export const isPlayerWinner = (battle, player) =>
  (battle.team1.includes(player) && battle.result === 'win') ||
  (battle.team2.includes(player) && battle.result === 'loss');

// ---------------------------------------------------------------------------
// MVP
// ---------------------------------------------------------------------------

const MVP_WEIGHTS = { win: 0.25, downs: 0.45, damage: 0.15, revives: 0.10, captures: 0.05 };

export const calculateMVP = (battle) => {
  if (!battle || !battle.team1 || !battle.team2) return null;
  const allPlayers = [...battle.team1, ...battle.team2];
  if (allPlayers.length === 0) return null;

  const maxValues = {
    downs: Math.max(...allPlayers.map(p => p.downs || 0)),
    damage: Math.max(...allPlayers.map(p => p.damage || 0)),
    revives: Math.max(...allPlayers.map(p => p.revives || 0)),
    captures: Math.max(...allPlayers.map(p => p.captures || 0))
  };

  const playerScores = allPlayers.map(player => {
    const winScore = isPlayerWinner(battle, player) ? 1 : 0;
    const downsScore = maxValues.downs > 0 ? (player.downs || 0) / maxValues.downs : 0;
    const damageScore = maxValues.damage > 0 ? (player.damage || 0) / maxValues.damage : 0;
    const revivesScore = maxValues.revives > 0 ? (player.revives || 0) / maxValues.revives : 0;
    const capturesScore = maxValues.captures > 0 ? (player.captures || 0) / maxValues.captures : 0;

    const score =
      (winScore * MVP_WEIGHTS.win) +
      (downsScore * MVP_WEIGHTS.downs) +
      (damageScore * MVP_WEIGHTS.damage) +
      (revivesScore * MVP_WEIGHTS.revives) +
      (capturesScore * MVP_WEIGHTS.captures);

    return { player, score };
  });

  playerScores.sort((a, b) => b.score - a.score);
  return playerScores[0].player;
};

/** Map battleId -> MVP player (calculado uma vez por batalha). */
export const buildMvpIndex = (battles) => {
  const index = new Map();
  battles.forEach(b => index.set(b.id, calculateMVP(b)));
  return index;
};

export const countPlayerMVPs = (mvpIndex, playerName) => {
  let n = 0;
  mvpIndex.forEach(mvp => { if (mvp && mvp.name === playerName) n++; });
  return n;
};

// ---------------------------------------------------------------------------
// Helpers por jogador
// ---------------------------------------------------------------------------

export const playerBattles = (battles, playerName) =>
  battles.filter(b => b.team1.some(p => p.name === playerName) || b.team2.some(p => p.name === playerName));

export const calculateFavoriteOperator = (battles, playerName) => {
  const counts = {};
  battles.forEach(battle => {
    const player = [...(battle.team1 || []), ...(battle.team2 || [])].find(p => p.name === playerName);
    if (player && player.operator && player.operator.trim() !== '' && player.operator !== 'Unknown') {
      counts[player.operator] = (counts[player.operator] || 0) + 1;
    }
  });
  let max = 0;
  let fav = '';
  for (const [op, c] of Object.entries(counts)) {
    if (c > max) { max = c; fav = op; }
  }
  return fav;
};

/** Histórico de jogos de um jogador (mais recente primeiro). */
export const playerHistory = (battles, mvpIndex, playerName) =>
  playerBattles(battles, playerName).map(battle => {
    const player = [...battle.team1, ...battle.team2].find(p => p.name === playerName);
    const mvp = mvpIndex.get(battle.id);
    return {
      battle,
      player,
      won: isPlayerWinner(battle, player),
      isMVP: !!mvp && mvp.name === playerName,
      rounds: (battle.team1Rounds || 0) + (battle.team2Rounds || 0),
    };
  });

// ---------------------------------------------------------------------------
// Operadores
// ---------------------------------------------------------------------------

const finalizeOperator = (operator) => {
  operator.winRate = operator.totalGames > 0 ? Math.round((operator.totalWins / operator.totalGames) * 100) : 0;
  operator.avgElims = operator.totalGames > 0 ? r1(operator.totalElims / operator.totalGames) : 0;
  operator.avgDowns = operator.totalGames > 0 ? r1(operator.totalDowns / operator.totalGames) : 0;
  operator.avgAssists = operator.totalGames > 0 ? r1(operator.totalAssists / operator.totalGames) : 0;
  operator.avgDamage = operator.totalGames > 0 ? r1(operator.totalDamage / operator.totalGames) : 0;

  // Win Rate (35%) + Downs (35%) + Damage (15%) + Revives (10%) + Captures (5%)
  const winRateScore = (operator.winRate / 100) * 35;
  const downsScore = Math.min(operator.avgDowns / 30, 1) * 35;
  const damageScore = Math.min(operator.avgDamage / 3000, 1) * 15;
  const revivesScore = Math.min((operator.totalRevives / operator.totalGames) / 10, 1) * 10;
  const capturesScore = Math.min((operator.totalCaptures / operator.totalGames) / 5, 1) * 5;
  operator.weightedScore = Math.round((winRateScore + downsScore + damageScore + revivesScore + capturesScore) * 100) / 100;
};

const emptyOperator = (name) => ({
  name, totalGames: 0, totalWins: 0, totalLosses: 0, totalElims: 0, totalDowns: 0,
  totalAssists: 0, totalRevives: 0, totalDamage: 0, totalCaptures: 0, totalMVPs: 0,
});

const addToOperator = (op, player, isWinner) => {
  op.totalGames++;
  op.totalWins += isWinner ? 1 : 0;
  op.totalLosses += isWinner ? 0 : 1;
  op.totalElims += player.elims || 0;
  op.totalDowns += player.downs || 0;
  op.totalAssists += player.assists || 0;
  op.totalRevives += player.revives || 0;
  op.totalDamage += player.damage || 0;
  op.totalCaptures += player.captures || 0;
};

export const calculateGeneralOperatorStats = (battles, mvpIndex) => {
  const stats = {};
  battles.forEach(battle => {
    [...battle.team1, ...battle.team2].forEach(player => {
      if (!player.operator) return;
      if (!stats[player.operator]) stats[player.operator] = { ...emptyOperator(player.operator), players: new Set() };
      addToOperator(stats[player.operator], player, isPlayerWinner(battle, player));
      stats[player.operator].players.add(player.name);
    });
    const mvp = mvpIndex.get(battle.id);
    if (mvp && mvp.operator && stats[mvp.operator]) stats[mvp.operator].totalMVPs++;
  });
  Object.values(stats).forEach(op => {
    finalizeOperator(op);
    op.uniquePlayers = op.players.size;
  });
  return Object.values(stats).sort((a, b) => b.weightedScore - a.weightedScore);
};

export const calculateIndividualOperatorStats = (battles, mvpIndex, playerName) => {
  const stats = {};
  playerBattles(battles, playerName).forEach(battle => {
    const player = [...battle.team1, ...battle.team2].find(p => p.name === playerName);
    if (!player || !player.operator) return;
    if (!stats[player.operator]) stats[player.operator] = emptyOperator(player.operator);
    addToOperator(stats[player.operator], player, isPlayerWinner(battle, player));
    const mvp = mvpIndex.get(battle.id);
    if (mvp && mvp.name === playerName && mvp.operator === player.operator) stats[player.operator].totalMVPs++;
  });
  Object.values(stats).forEach(finalizeOperator);
  return Object.values(stats).sort((a, b) => b.weightedScore - a.weightedScore);
};

// ---------------------------------------------------------------------------
// Mapas
// ---------------------------------------------------------------------------

const favoriteFromMap = (m) => {
  let best = '';
  let max = 0;
  m.forEach((count, key) => { if (count > max) { max = count; best = key; } });
  return best;
};

export const calculateIndividualMapStats = (battles, mvpIndex, playerName) => {
  const mapStats = {};
  playerBattles(battles, playerName).forEach(battle => {
    const player = [...battle.team1, ...battle.team2].find(p => p.name === playerName);
    if (!player || !battle.map) return;
    const isWinner = isPlayerWinner(battle, player);
    if (!mapStats[battle.map]) {
      mapStats[battle.map] = {
        map: battle.map, totalGames: 0, totalWins: 0, totalLosses: 0, totalElims: 0,
        totalDowns: 0, totalAssists: 0, totalDamage: 0, totalMVPs: 0, operators: new Map()
      };
    }
    const m = mapStats[battle.map];
    m.totalGames++;
    m.totalWins += isWinner ? 1 : 0;
    m.totalLosses += isWinner ? 0 : 1;
    m.totalElims += player.elims || 0;
    m.totalDowns += player.downs || 0;
    m.totalAssists += player.assists || 0;
    m.totalDamage += player.damage || 0;
    const mvp = mvpIndex.get(battle.id);
    if (mvp && mvp.name === playerName) m.totalMVPs++;
    if (player.operator) m.operators.set(player.operator, (m.operators.get(player.operator) || 0) + 1);
  });

  Object.values(mapStats).forEach(m => {
    m.winRate = m.totalGames > 0 ? Math.round((m.totalWins / m.totalGames) * 100) : 0;
    m.avgElims = m.totalGames > 0 ? r1(m.totalElims / m.totalGames) : 0;
    m.avgDowns = m.totalGames > 0 ? r1(m.totalDowns / m.totalGames) : 0;
    m.avgAssists = m.totalGames > 0 ? r1(m.totalAssists / m.totalGames) : 0;
    m.avgDamage = m.totalGames > 0 ? r1(m.totalDamage / m.totalGames) : 0;
    m.favoriteOperator = favoriteFromMap(m.operators);
  });

  return Object.values(mapStats).sort((a, b) => b.winRate - a.winRate);
};

export const calculateGeneralMapStats = (battles) => {
  const mapStats = {};
  battles.forEach(battle => {
    if (!battle.map) return;
    if (!mapStats[battle.map]) {
      mapStats[battle.map] = {
        map: battle.map, totalGames: 0, totalRounds: 0,
        operators: new Map(), teams: new Map(), players: new Set()
      };
    }
    const m = mapStats[battle.map];
    m.totalGames++;
    m.totalRounds += (battle.team1Rounds || 0) + (battle.team2Rounds || 0);
    [...battle.team1, ...battle.team2].forEach(player => {
      m.players.add(player.name);
      if (player.operator) m.operators.set(player.operator, (m.operators.get(player.operator) || 0) + 1);
    });
    const team1Players = battle.team1.map(p => p.name).sort().join(', ');
    const team2Players = battle.team2.map(p => p.name).sort().join(', ');
    [team1Players, team2Players].forEach(team => m.teams.set(team, (m.teams.get(team) || 0) + 1));
  });

  Object.values(mapStats).forEach(m => {
    m.avgRounds = m.totalGames > 0 ? Math.round((m.totalRounds / m.totalGames) * 100) / 100 : 0;
    m.mostUsedOperator = favoriteFromMap(m.operators);
    m.mostUsedTeam = favoriteFromMap(m.teams);
    m.uniquePlayers = m.players.size;
  });

  return Object.values(mapStats).sort((a, b) => b.totalGames - a.totalGames);
};

// ---------------------------------------------------------------------------
// Duplas e equipas
// ---------------------------------------------------------------------------

export const calculateDuoStats = (battles, playerName) => {
  const duoStats = {};
  playerBattles(battles, playerName).forEach(battle => {
    const allPlayers = [...battle.team1, ...battle.team2];
    const player = allPlayers.find(p => p.name === playerName);
    if (!player) return;
    const isWinner = isPlayerWinner(battle, player);
    const myTeam = battle.team1.includes(player) ? battle.team1 : battle.team2;

    myTeam.filter(p => p.name !== playerName).forEach(teammate => {
      if (!duoStats[teammate.name]) {
        duoStats[teammate.name] = {
          name: teammate.name, totalGames: 0, totalWins: 0, totalLosses: 0,
          totalElims: 0, totalDowns: 0, totalAssists: 0, totalDamage: 0, operators: new Set()
        };
      }
      const d = duoStats[teammate.name];
      d.totalGames++;
      d.totalWins += isWinner ? 1 : 0;
      d.totalLosses += isWinner ? 0 : 1;
      d.totalElims += player.elims || 0;
      d.totalDowns += player.downs || 0;
      d.totalAssists += player.assists || 0;
      d.totalDamage += player.damage || 0;
      if (player.operator) d.operators.add(player.operator);
    });
  });

  Object.values(duoStats).forEach(d => {
    d.winRate = d.totalGames > 0 ? Math.round((d.totalWins / d.totalGames) * 100) : 0;
    d.avgElims = d.totalGames > 0 ? r1(d.totalElims / d.totalGames) : 0;
    d.avgDowns = d.totalGames > 0 ? r1(d.totalDowns / d.totalGames) : 0;
    d.avgAssists = d.totalGames > 0 ? r1(d.totalAssists / d.totalGames) : 0;
    d.avgDamage = d.totalGames > 0 ? r1(d.totalDamage / d.totalGames) : 0;
    d.kdRatio = d.avgDowns > 0 ? Math.round((d.avgElims / d.avgDowns) * 100) / 100 : d.avgElims;
    d.uniqueOperators = d.operators.size;
  });

  return Object.values(duoStats).sort((a, b) => b.winRate - a.winRate);
};

export const calculateTeamStats = (battles) => {
  const teamStats = {};
  const add = (key, team, won) => {
    if (!teamStats[key]) {
      teamStats[key] = { players: key, totalGames: 0, totalWins: 0, totalLosses: 0, totalElims: 0, totalDowns: 0, totalDamage: 0 };
    }
    const t = teamStats[key];
    t.totalGames++;
    t.totalWins += won ? 1 : 0;
    t.totalLosses += won ? 0 : 1;
    t.totalElims += team.reduce((s, p) => s + (p.elims || 0), 0);
    t.totalDowns += team.reduce((s, p) => s + (p.downs || 0), 0);
    t.totalDamage += team.reduce((s, p) => s + (p.damage || 0), 0);
  };

  battles.forEach(battle => {
    const isTeam1Winner = battle.result === 'win';
    add(battle.team1.map(p => p.name).sort().join(', '), battle.team1, isTeam1Winner);
    add(battle.team2.map(p => p.name).sort().join(', '), battle.team2, !isTeam1Winner);
  });

  Object.values(teamStats).forEach(t => {
    t.winRate = t.totalGames > 0 ? Math.round((t.totalWins / t.totalGames) * 100) : 0;
    t.avgElims = t.totalGames > 0 ? r1(t.totalElims / t.totalGames) : 0;
    t.avgDowns = t.totalGames > 0 ? r1(t.totalDowns / t.totalGames) : 0;
    t.avgDamage = t.totalGames > 0 ? r1(t.totalDamage / t.totalGames) : 0;
  });

  return Object.values(teamStats)
    .filter(t => t.totalGames >= 2)
    .sort((a, b) => b.winRate - a.winRate);
};

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

/** Converte médias por ronda em médias por jogo (modo 'game'). */
const perGameAverages = (player) => {
  const totalRounds = player.totalRounds || 0;
  const totalGames = player.totalGames || 0;
  const keys = ['avgDowns', 'avgDamage', 'avgRevives', 'avgCaptures', 'avgAssists'];
  const out = {};
  if (totalRounds > 0 && totalGames > 0) {
    const roundsPerGame = totalRounds / totalGames;
    keys.forEach(k => { out[k] = player[k] ? player[k] * roundsPerGame : 0; });
  } else {
    keys.forEach(k => { out[k] = player[k] || 0; });
  }
  return out;
};

const baseRow = (player, battles, mvpIndex, avgs) => ({
  name: player.name,
  totalGames: player.totalGames || 0,
  winRate: player.winRate || 0,
  ...avgs,
  totalMVPs: countPlayerMVPs(mvpIndex, player.name),
  favoriteOperator: player.favoriteOperator || calculateFavoriteOperator(battles, player.name),
});

const metricKey = {
  winrate: 'winRate', downs: 'avgDowns', damage: 'avgDamage',
  revives: 'avgRevives', captures: 'avgCaptures', assists: 'avgAssists'
};

export const RANKING_WEIGHTS = [
  { label: 'Win Rate', pct: 35 },
  { label: 'Downs', pct: 35 },
  { label: 'Damage', pct: 15 },
  { label: 'Revives', pct: 10 },
  { label: 'Captures', pct: 5 },
];

export const calculatePlayerRanking = ({ players, battles, mvpIndex, minGames, viewMode }) => {
  const rows = players.map(player => {
    const avgs = viewMode === 'round'
      ? {
        avgDowns: player.avgDowns || 0, avgDamage: player.avgDamage || 0, avgRevives: player.avgRevives || 0,
        avgCaptures: player.avgCaptures || 0, avgAssists: player.avgAssists || 0
      }
      : perGameAverages(player);
    return baseRow(player, battles, mvpIndex, avgs);
  });

  const valid = rows.filter(p => p.totalGames >= minGames);
  if (valid.length === 0) return [];

  const maxDowns = Math.max(...valid.map(p => p.avgDowns || 0), 1);
  const maxDamage = Math.max(...valid.map(p => p.avgDamage || 0), 1);
  const maxRevives = Math.max(...valid.map(p => p.avgRevives || 0), 1);
  const maxCaptures = Math.max(...valid.map(p => p.avgCaptures || 0), 1);

  return valid.map(p => {
    const score =
      (p.winRate / 100) * 35 +
      (p.avgDowns / maxDowns) * 35 +
      (p.avgDamage / maxDamage) * 15 +
      (p.avgRevives / maxRevives) * 10 +
      (p.avgCaptures / maxCaptures) * 5;
    return {
      ...p,
      score: Math.round(score * 100) / 100,
      avgDowns: r1(p.avgDowns),
      avgDamage: Math.round(p.avgDamage),
      avgRevives: r1(p.avgRevives),
      avgCaptures: r1(p.avgCaptures),
      avgAssists: r1(p.avgAssists || 0),
    };
  }).sort((a, b) => b.score - a.score);
};

export const calculateSpecificRanking = ({ players, battles, mvpIndex, minGames, viewMode, metric }) => {
  return players.map(player => {
    if (viewMode === 'round') {
      const row = baseRow(player, battles, mvpIndex, {
        avgDowns: player.avgDowns || 0, avgDamage: player.avgDamage || 0, avgRevives: player.avgRevives || 0,
        avgCaptures: player.avgCaptures || 0, avgAssists: player.avgAssists || 0
      });
      return { ...row, score: row[metricKey[metric]] || 0 };
    }
    const avgs = perGameAverages(player);
    Object.keys(avgs).forEach(k => { avgs[k] = r1(avgs[k]); });
    const row = baseRow(player, battles, mvpIndex, avgs);
    return { ...row, score: row[metricKey[metric]] || 0 };
  })
    .filter(p => p.totalGames >= minGames)
    .sort((a, b) => b.score - a.score);
};

// ---------------------------------------------------------------------------
// Comparação 1v1
// ---------------------------------------------------------------------------

export const calculateComparisonStats = (battles, mvpIndex, playerName, minGames) => {
  if (!playerName) return null;
  const pb = playerBattles(battles, playerName);
  if (pb.length < minGames) return null;

  const s = {
    name: playerName, totalGames: 0, totalWins: 0, totalLosses: 0, totalDowns: 0, totalDamage: 0,
    totalRevives: 0, totalCaptures: 0, totalAssists: 0, operators: new Map(), maps: new Map()
  };

  pb.forEach(battle => {
    const p = [...battle.team1, ...battle.team2].find(x => x.name === playerName);
    if (!p) return;
    const won = isPlayerWinner(battle, p);
    s.totalGames++;
    s.totalWins += won ? 1 : 0;
    s.totalLosses += won ? 0 : 1;
    s.totalDowns += p.downs || 0;
    s.totalDamage += p.damage || 0;
    s.totalRevives += p.revives || 0;
    s.totalCaptures += p.captures || 0;
    s.totalAssists += p.assists || 0;
    if (p.operator) s.operators.set(p.operator, (s.operators.get(p.operator) || 0) + 1);
    if (battle.map) s.maps.set(battle.map, (s.maps.get(battle.map) || 0) + 1);
  });

  const g = s.totalGames;
  s.winRate = g > 0 ? Math.round((s.totalWins / g) * 100) : 0;
  s.avgDowns = g > 0 ? r1(s.totalDowns / g) : 0;
  s.avgDamage = g > 0 ? r1(s.totalDamage / g) : 0;
  s.avgRevives = g > 0 ? r1(s.totalRevives / g) : 0;
  s.avgCaptures = g > 0 ? r1(s.totalCaptures / g) : 0;
  s.avgAssists = g > 0 ? r1(s.totalAssists / g) : 0;
  s.totalMVPs = countPlayerMVPs(mvpIndex, playerName);
  s.favoriteOperator = favoriteFromMap(s.operators);
  s.favoriteMap = favoriteFromMap(s.maps);

  // Win Rate (35%) + Downs (35%) + Damage (15%) + Revives (7.5%) + Captures (7.5%)
  s.score = Math.round((
    (s.winRate / 100) * 35 +
    Math.min(s.avgDowns / 30, 1) * 35 +
    Math.min(s.avgDamage / 3000, 1) * 15 +
    Math.min(s.avgRevives / 10, 1) * 7.5 +
    Math.min(s.avgCaptures / 5, 1) * 7.5
  ) * 100) / 100;

  return s;
};

export const COMPARISON_METRICS = [
  { key: 'winRate', label: 'Win Rate', suffix: '%' },
  { key: 'avgDowns', label: 'Downs / jogo' },
  { key: 'avgDamage', label: 'Damage / jogo', round: true },
  { key: 'avgRevives', label: 'Revives / jogo' },
  { key: 'avgCaptures', label: 'Captures / jogo' },
  { key: 'avgAssists', label: 'Assists / jogo' },
  { key: 'totalMVPs', label: 'MVPs' },
];

// ---------------------------------------------------------------------------
// Recordes
// ---------------------------------------------------------------------------

export const RECORD_STATS = [
  { key: 'elims', label: 'Eliminações' },
  { key: 'downs', label: 'Downs' },
  { key: 'assists', label: 'Assists' },
  { key: 'revives', label: 'Revives' },
  { key: 'damage', label: 'Damage' },
  { key: 'captures', label: 'Captures' },
];

export const calculateRecords = (battles) => {
  const records = {};
  RECORD_STATS.forEach(({ key }) => { records[key] = { player: '', value: 0, battleId: null, battle: null }; });

  battles.forEach(battle => {
    [battle.team1, battle.team2].forEach(team => {
      if (!Array.isArray(team)) return;
      team.forEach(player => {
        RECORD_STATS.forEach(({ key }) => {
          if (player[key] && player[key] > records[key].value) {
            records[key] = { player: player.name, value: player[key], battleId: battle.id, battle, operator: player.operator };
          }
        });
      });
    });
  });
  return records;
};

// ---------------------------------------------------------------------------
// Gerador de equipas equilibradas (8 jogadores)
// ---------------------------------------------------------------------------

export const TEAM_MAKER_WEIGHTS = [
  { label: 'Win Rate', pct: 10 },
  { label: 'Downs', pct: 35 },
  { label: 'Damage', pct: 30 },
  { label: 'Revives', pct: 10 },
  { label: 'Captures', pct: 10 },
  { label: 'Assists', pct: 5 },
];

export const generateBalancedTeams = (players, playerNames) => {
  const selected = players.filter(p => playerNames.includes(p.name));

  const range = (key) => {
    const vals = selected.map(p => p[key] || 0);
    const min = Math.min(...vals);
    return { min, range: (Math.max(...vals) - min) || 1 };
  };
  const downs = range('avgDowns');
  const damage = range('avgDamage');
  const revives = range('avgRevives');
  const captures = range('avgCaptures');
  const assists = range('avgAssists');
  const norm = (p, key, r) => (r.range > 0 ? ((p[key] || 0) - r.min) / r.range : 0);

  const ranked = selected.map(player => ({
    ...player,
    rank:
      ((player.winRate || 0) / 100) * 10 +
      norm(player, 'avgDowns', downs) * 35 +
      norm(player, 'avgDamage', damage) * 30 +
      norm(player, 'avgRevives', revives) * 10 +
      norm(player, 'avgCaptures', captures) * 10 +
      norm(player, 'avgAssists', assists) * 5,
  })).sort((a, b) => b.rank - a.rank);

  const targetScore = ranked.reduce((s, p) => s + p.rank, 0) / 2;

  const combos = [];
  const helper = (start, combo) => {
    if (combo.length === 4) { combos.push([...combo]); return; }
    for (let i = start; i < ranked.length; i++) {
      combo.push(ranked[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  };
  helper(0, []);

  // Prioridade: 0 conflitos de rivalidade > equilíbrio
  let bestTeam1 = [];
  let minDifference = Infinity;
  let minConflicts = Infinity;
  combos.forEach(team => {
    const ids = new Set(team.map(p => p.name));
    const other = ranked.filter(p => !ids.has(p.name));
    let conflicts = 0;
    if (hasTeamRivalries(team)) conflicts++;
    if (hasTeamRivalries(other)) conflicts++;
    const diff = Math.abs(team.reduce((s, p) => s + p.rank, 0) - targetScore);
    if (conflicts < minConflicts || (conflicts === minConflicts && diff < minDifference)) {
      minConflicts = conflicts;
      minDifference = diff;
      bestTeam1 = team;
    }
  });

  const team1Ids = new Set(bestTeam1.map(p => p.name));
  const team2 = ranked.filter(p => !team1Ids.has(p.name));
  const team1Strength = bestTeam1.reduce((s, p) => s + p.rank, 0);
  const team2Strength = team2.reduce((s, p) => s + p.rank, 0);

  return {
    team1: bestTeam1,
    team2,
    team1Strength: team1Strength.toFixed(2),
    team2Strength: team2Strength.toFixed(2),
    difference: Math.abs(team1Strength - team2Strength).toFixed(2),
    team1Rivalry: hasTeamRivalries(bestTeam1),
    team2Rivalry: hasTeamRivalries(team2),
    hasRivalryIssues: hasTeamRivalries(bestTeam1) || hasTeamRivalries(team2),
  };
};

// ---------------------------------------------------------------------------
// Formatação
// ---------------------------------------------------------------------------

export const fmtInt = (num) => (!num ? '0' : Math.round(num).toLocaleString('pt-PT'));
export const fmtPct = (num) => `${Math.round(num || 0)}%`;
