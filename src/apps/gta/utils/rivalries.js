// Utilitários para gerenciar rivalidades entre jogadores no GTA
// Adaptado do Rogue Tracker

const RIVALRIES_STORAGE_KEY = 'gta_hub_rivalries'; // Use distinct key for GTA

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

// Adicionar uma rivalidade (bidirecional)
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

// Verificar se uma equipe tem rivalidades internas
export const hasTeamRivalries = (team) => {
    // Extract names whether team is array of strings or objects {name: '...'}
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
