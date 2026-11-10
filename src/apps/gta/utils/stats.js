// Cálculos do GTA (mesmas regras do ranking global e do detalhe de campeonato).

export const DEFAULT_TEAM = '#default';

export const TEAM_COLORS = [
  { label: 'Roxo', value: '#a855f7' },
  { label: 'Preto', value: '#000000' },
  { label: 'Branco', value: '#ffffff' },
  { label: 'Amarelo', value: '#ffb800' },
  { label: 'Vermelho', value: '#ef4444' },
  { label: 'Laranja', value: '#ff6b00' },
  { label: 'Castanho', value: '#78350f' },
  { label: 'Azul', value: '#3b82f6' }
];

/** Cor visível sobre fundo escuro (preto vira cinzento). */
export const displayColor = (c) => (!c ? undefined : c === '#000000' ? '#9ca3af' : c);
export const textOn = (c) => (['#ffffff', '#ffb800'].includes(c) ? '#000' : '#fff');

const byPlaylist = (races) => {
  const map = {};
  races.forEach(r => {
    if (!map[r.playlistId]) map[r.playlistId] = [];
    map[r.playlistId].push(r);
  });
  return map;
};

export const formatPlaylistDate = (timestamp, opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) =>
  timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString('pt-PT', opts) : '';

/** Ranking individual: pontos totais, PPR e campeonatos ganhos. */
export const computeIndividualRanking = (players, races) => {
  const playlistWins = {};
  Object.values(byPlaylist(races)).forEach(pRaces => {
    const scores = {};
    pRaces.forEach(race => race.results.forEach(res => {
      scores[res.playerId] = (scores[res.playerId] || 0) + (Number(res.points) || 0);
    }));
    let winnerId = null;
    let max = -1;
    Object.entries(scores).forEach(([pid, s]) => { if (s > max) { max = s; winnerId = pid; } });
    if (winnerId) playlistWins[winnerId] = (playlistWins[winnerId] || 0) + 1;
  });

  return players.map(p => {
    const stats = p.stats || { totalPoints: 0, races: 0, wins: 0 };
    return { ...p, stats, ppr: stats.races > 0 ? stats.totalPoints / stats.races : 0, championships: playlistWins[p.id] || 0 };
  });
};

export const sortIndividual = (list, mode) => {
  const copy = [...list];
  if (mode === 'total') {
    return copy.sort((a, b) => (b.stats.totalPoints !== a.stats.totalPoints ? b.stats.totalPoints - a.stats.totalPoints : b.championships - a.championships));
  }
  return copy.sort((a, b) => b.ppr - a.ppr);
};

/** Ranking por equipas: campeonatos/vitórias/pontos da equipa (por cor) atribuídos a cada piloto. */
export const computeTeamRanking = (players, races) => {
  const stats = {};
  players.forEach(p => {
    stats[p.id] = { id: p.id, name: p.name, teamChampionships: 0, teamWins: 0, teamPoints: 0, teamRaces: 0 };
  });
  const get = (pid) => {
    if (!stats[pid]) stats[pid] = { id: pid, name: 'Unknown', teamChampionships: 0, teamWins: 0, teamPoints: 0, teamRaces: 0 };
    return stats[pid];
  };

  races.forEach(race => {
    const teamScores = {};
    race.results.forEach(res => {
      const color = res.teamColor || DEFAULT_TEAM;
      if (!teamScores[color]) teamScores[color] = { points: 0, playerIds: [] };
      teamScores[color].points += Number(res.points) || 0;
      if (res.playerId) teamScores[color].playerIds.push(res.playerId);
    });
    let winner = null;
    let max = -1;
    Object.entries(teamScores).forEach(([c, d]) => { if (d.points > max) { max = d.points; winner = c; } });
    Object.entries(teamScores).forEach(([c, d]) => {
      d.playerIds.forEach(pid => {
        const s = get(pid);
        s.teamPoints += d.points;
        s.teamRaces += 1;
        if (winner && c === winner) s.teamWins += 1;
      });
    });
  });

  Object.values(byPlaylist(races)).forEach(pRaces => {
    const teamScores = {};
    pRaces.forEach(race => race.results.forEach(res => {
      const color = res.teamColor || DEFAULT_TEAM;
      if (!teamScores[color]) teamScores[color] = { points: 0, playerIds: new Set() };
      teamScores[color].points += Number(res.points) || 0;
      if (res.playerId) teamScores[color].playerIds.add(res.playerId);
    }));
    let winner = null;
    let max = -1;
    Object.entries(teamScores).forEach(([c, d]) => { if (d.points > max) { max = d.points; winner = c; } });
    if (winner && teamScores[winner]) teamScores[winner].playerIds.forEach(pid => { get(pid).teamChampionships += 1; });
  });

  return Object.values(stats)
    .filter(p => p.teamRaces > 0)
    .map(p => ({ ...p, ppr: p.teamRaces > 0 ? p.teamPoints / p.teamRaces : 0 }))
    .sort((a, b) => {
      if (b.teamChampionships !== a.teamChampionships) return b.teamChampionships - a.teamChampionships;
      if (b.teamWins !== a.teamWins) return b.teamWins - a.teamWins;
      return b.ppr - a.ppr;
    });
};

/** Classificação de um campeonato (individual + equipas). */
export const computePlaylistStandings = (playlistRaces) => {
  const races = [...playlistRaces].sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);
  const map = {};
  races.forEach((race, rIdx) => {
    race.results.forEach(res => {
      if (!map[res.playerId]) {
        map[res.playerId] = { id: res.playerId, name: res.playerName || 'Unknown', teamColor: res.teamColor, races: {}, total: 0 };
      }
      if (!map[res.playerId].teamColor && res.teamColor) map[res.playerId].teamColor = res.teamColor;
      const pts = Number(res.points) || 0;
      map[res.playerId].races[rIdx] = pts;
      map[res.playerId].total += pts;
    });
  });
  const individual = Object.values(map).sort((a, b) => b.total - a.total);

  const teamMap = {};
  individual.forEach(p => {
    const color = p.teamColor || DEFAULT_TEAM;
    if (!teamMap[color]) teamMap[color] = { color: p.teamColor, players: [], races: {}, total: 0 };
    teamMap[color].players.push(p.name);
    teamMap[color].total += p.total;
    races.forEach((_, rIdx) => {
      teamMap[color].races[rIdx] = (teamMap[color].races[rIdx] || 0) + (p.races[rIdx] || 0);
    });
  });
  const teams = Object.values(teamMap).sort((a, b) => b.total - a.total);

  return { races, individual, teams };
};
