// Utilitários para gerenciar rivalidades entre jogadores

const RIVALRIES_STORAGE_KEY = 'rogue_tracker_rivalries';

// Obter todas as rivalidades
export const getRivalries = () => {
  try {
    const stored = localStorage.getItem(RIVALRIES_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Erro ao carregar rivalidades:', error);
    return [];
  }
};

// Adicionar uma rivalidade (bidirecional: se X não quer jogar contra Y, Y também não quer jogar contra X)
export const addRivalry = (player1, player2) => {
  if (!player1 || !player2 || player1 === player2) {
    return false;
  }

  const rivalries = getRivalries();
  
  // Normalizar nomes (ordenar para evitar duplicatas)
  const normalizedPair = [player1.trim(), player2.trim()].sort();
  
  // Verificar se já existe
  const exists = rivalries.some(
    r => r[0] === normalizedPair[0] && r[1] === normalizedPair[1]
  );

  if (exists) {
    return false; // Já existe
  }

  // Adicionar
  rivalries.push(normalizedPair);
  localStorage.setItem(RIVALRIES_STORAGE_KEY, JSON.stringify(rivalries));
  return true;
};

// Remover uma rivalidade
export const removeRivalry = (player1, player2) => {
  const rivalries = getRivalries();
  const normalizedPair = [player1.trim(), player2.trim()].sort();
  
  const filtered = rivalries.filter(
    r => !(r[0] === normalizedPair[0] && r[1] === normalizedPair[1])
  );
  
  localStorage.setItem(RIVALRIES_STORAGE_KEY, JSON.stringify(filtered));
  return filtered.length < rivalries.length;
};

// Verificar se dois jogadores têm rivalidade
export const hasRivalry = (player1, player2) => {
  if (!player1 || !player2 || player1 === player2) {
    return false;
  }

  const rivalries = getRivalries();
  const normalizedPair = [player1.trim(), player2.trim()].sort();
  
  return rivalries.some(
    r => r[0] === normalizedPair[0] && r[1] === normalizedPair[1]
  );
};

// Obter todos os rivais de um jogador
export const getRivalsOf = (playerName) => {
  const rivalries = getRivalries();
  const rivals = [];
  
  rivalries.forEach(rivalry => {
    if (rivalry[0] === playerName.trim()) {
      rivals.push(rivalry[1]);
    } else if (rivalry[1] === playerName.trim()) {
      rivals.push(rivalry[0]);
    }
  });
  
  return rivals;
};

// Verificar se uma equipe tem rivalidades internas
export const hasTeamRivalries = (team) => {
  const playerNames = team.map(p => typeof p === 'string' ? p : p.name);
  
  for (let i = 0; i < playerNames.length; i++) {
    for (let j = i + 1; j < playerNames.length; j++) {
      if (hasRivalry(playerNames[i], playerNames[j])) {
        return true;
      }
    }
  }
  
  return false;
};

// Verificar se duas equipes podem jogar juntas (sem rivalidades entre elas)
// Retorna true se não há rivalidades entre as equipes
export const canTeamsPlayTogether = (team1, team2) => {
  const team1Names = team1.map(p => typeof p === 'string' ? p : p.name);
  const team2Names = team2.map(p => typeof p === 'string' ? p : p.name);
  
  // Verificar se algum jogador da team1 tem rivalidade com algum da team2
  for (const player1 of team1Names) {
    for (const player2 of team2Names) {
      if (hasRivalry(player1, player2)) {
        return false;
      }
    }
  }
  
  return true;
};
