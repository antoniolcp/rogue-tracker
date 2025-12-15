    import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  setDoc,
  updateDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from './config';

// Coleção de jogadores no Firestore
const PLAYERS_COLLECTION = 'players';

// Estrutura de estatísticas de um jogador
const createPlayerStats = (name) => ({
  name: name,
  isActive: true,
  // Estatísticas gerais
  totalGames: 0,
  totalRounds: 0,  // Total de rondas jogadas
  totalWins: 0,
  totalLosses: 0,
  winRate: 0,
  // Estatísticas de combate
  totalElims: 0,
  totalDowns: 0,
  totalAssists: 0,
  totalRevives: 0,
  totalDamage: 0,
  totalCaptures: 0,
  // Médias por jogo
  avgElims: 0,
  avgDowns: 0,
  avgAssists: 0,
  avgRevives: 0,
  avgDamage: 0,
  avgCaptures: 0,
  // Melhores performances
  bestElims: 0,
  bestDowns: 0,
  bestAssists: 0,
  bestRevives: 0,
  bestDamage: 0,
  bestCaptures: 0,
  // Histórico de partidas
  recentGames: [],
  createdAt: new Date(),
  updatedAt: new Date()
});

// Adicionar um jogador (usando nome como ID)
export const addPlayer = async (playerName) => {
  try {
    const playerData = createPlayerStats(playerName);
    // Usar o nome como ID do documento
    const docRef = doc(db, PLAYERS_COLLECTION, playerName);
    await setDoc(docRef, playerData);
    console.log(`🆕 Jogador adicionado: ${playerName}`);
    return playerName; // Retornar o nome como ID
  } catch (error) {
    console.error('Erro ao adicionar jogador: ', error);
    throw error;
  }
};

// Procurar jogador por nome (usando nome como ID)
export const findPlayerByName = async (playerName) => {
  try {
    console.log(`🔍 Procurando jogador com nome: "${playerName}"`);
    
    // Usar o nome como ID do documento
    const docRef = doc(db, PLAYERS_COLLECTION, playerName);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log(`✅ Jogador encontrado: "${playerName}"`);
      return { id: playerName, ...docSnap.data() };
    } else {
      console.log(`❌ Jogador "${playerName}" não encontrado na base de dados`);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao procurar jogador: ', error);
    throw error;
  }
};

// Obter todos os jogadores
export const getPlayers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, PLAYERS_COLLECTION));
    const players = [];
    querySnapshot.forEach((doc) => {
      players.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return players;
  } catch (error) {
    console.error('Erro ao obter jogadores: ', error);
    throw error;
  }
};

// Escutar mudanças nos jogadores em tempo real
export const subscribeToPlayers = (callback) => {
  return onSnapshot(collection(db, PLAYERS_COLLECTION), (querySnapshot) => {
    const players = [];
    querySnapshot.forEach((doc) => {
      players.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(players);
  });
};

// Atualizar estatísticas de um jogador após uma partida
export const updatePlayerStats = async (playerName, gameStats, isWinner, operator = '', roundsPlayed = 0) => {
  try {
    const playerRef = doc(db, PLAYERS_COLLECTION, playerName);
    
    // Obter dados atuais do jogador
    const currentPlayer = await getDoc(playerRef);
    const currentData = currentPlayer.data();
    
    // Calcular novos totais
    const newTotalGames = currentData.totalGames + 1;
    const newTotalRounds = (currentData.totalRounds || 0) + roundsPlayed;
    const newTotalWins = currentData.totalWins + (isWinner ? 1 : 0);
    const newTotalLosses = currentData.totalLosses + (isWinner ? 0 : 1);
    const newWinRate = newTotalGames > 0 ? (newTotalWins / newTotalGames) * 100 : 0;
    
    // Atualizar estatísticas de combate
    const updateData = {
      totalGames: newTotalGames,
      totalRounds: newTotalRounds,  // Guardar total de rondas
      totalWins: newTotalWins,
      totalLosses: newTotalLosses,
      winRate: Math.round(newWinRate * 100) / 100,
      
      // Somar estatísticas da partida
      totalElims: currentData.totalElims + (gameStats.elims || 0),
      totalDowns: currentData.totalDowns + (gameStats.downs || 0),
      totalAssists: currentData.totalAssists + (gameStats.assists || 0),
      totalRevives: currentData.totalRevives + (gameStats.revives || 0),
      totalDamage: currentData.totalDamage + (gameStats.damage || 0),
      totalCaptures: currentData.totalCaptures + (gameStats.captures || 0),
      
      // Calcular médias POR RONDA em vez de por jogo
      avgElims: Math.round(((currentData.totalElims + (gameStats.elims || 0)) / newTotalRounds) * 10) / 10,
      avgDowns: Math.round(((currentData.totalDowns + (gameStats.downs || 0)) / newTotalRounds) * 10) / 10,
      avgAssists: Math.round(((currentData.totalAssists + (gameStats.assists || 0)) / newTotalRounds) * 10) / 10,
      avgRevives: Math.round(((currentData.totalRevives + (gameStats.revives || 0)) / newTotalRounds) * 10) / 10,
      avgDamage: Math.round(((currentData.totalDamage + (gameStats.damage || 0)) / newTotalRounds) * 10) / 10,
      avgCaptures: Math.round(((currentData.totalCaptures + (gameStats.captures || 0)) / newTotalRounds) * 10) / 10,
      
        // Atualizar melhores performances
        bestElims: Math.max(currentData.bestElims, gameStats.elims || 0),
        bestDowns: Math.max(currentData.bestDowns, gameStats.downs || 0),
        bestAssists: Math.max(currentData.bestAssists, gameStats.assists || 0),
        bestRevives: Math.max(currentData.bestRevives, gameStats.revives || 0),
        bestDamage: Math.max(currentData.bestDamage, gameStats.damage || 0),
        bestCaptures: Math.max(currentData.bestCaptures, gameStats.captures || 0),
        
        // Adicionar operador usado nesta partida
        lastOperator: operator,
        
        updatedAt: new Date()
    };
    
    await updateDoc(playerRef, updateData);
    console.log('Estatísticas do jogador atualizadas');
  } catch (error) {
    console.error('Erro ao atualizar estatísticas: ', error);
    throw error;
  }
};

// Processar uma batalha completa e atualizar todos os jogadores
export const processBattleResults = async (battleData) => {
  try {
    const { team1, team2, result, team1Rounds, team2Rounds } = battleData;
    const isTeam1Winner = result === 'win';
    const roundsPlayed = (team1Rounds || 0) + (team2Rounds || 0);
    
    console.log('🔍 Processando batalha:', { team1: team1.map(p => p.name), team2: team2.map(p => p.name), result, roundsPlayed });
    
    // Processar Team 1
    for (const player of team1) {
      console.log(`🔍 Procurando jogador: "${player.name}"`);
      const existingPlayer = await findPlayerByName(player.name);
      
      if (existingPlayer) {
        console.log(`✅ Jogador encontrado: ${existingPlayer.name}`);
            // Atualizar jogador existente
            await updatePlayerStats(player.name, {
              elims: player.elims || 0,
              downs: player.downs || 0,
              assists: player.assists || 0,
              revives: player.revives || 0,
              damage: player.damage || 0,
              captures: player.captures || 0
            }, isTeam1Winner, player.operator || '', roundsPlayed);
        console.log(`📊 Estatísticas atualizadas para ${player.name}`);
      } else {
        console.log(`❌ Jogador não encontrado, criando novo: ${player.name}`);
        // Criar novo jogador
        await addPlayer(player.name);
        await updatePlayerStats(player.name, {
          elims: player.elims || 0,
          downs: player.downs || 0,
          assists: player.assists || 0,
          revives: player.revives || 0,
          damage: player.damage || 0,
          captures: player.captures || 0
        }, isTeam1Winner, player.operator || '', roundsPlayed);
        console.log(`🆕 Novo jogador criado: ${player.name}`);
      }
    }
    
    // Processar Team 2
    for (const player of team2) {
      console.log(`🔍 Procurando jogador: "${player.name}"`);
      const existingPlayer = await findPlayerByName(player.name);
      
      if (existingPlayer) {
        console.log(`✅ Jogador encontrado: ${existingPlayer.name}`);
        // Atualizar jogador existente
        await updatePlayerStats(player.name, {
          elims: player.elims || 0,
          downs: player.downs || 0,
          assists: player.assists || 0,
          revives: player.revives || 0,
          damage: player.damage || 0,
          captures: player.captures || 0
        }, !isTeam1Winner, player.operator || '', roundsPlayed);
        console.log(`📊 Estatísticas atualizadas para ${player.name}`);
      } else {
        console.log(`❌ Jogador não encontrado, criando novo: ${player.name}`);
        // Criar novo jogador
        await addPlayer(player.name);
        await updatePlayerStats(player.name, {
          elims: player.elims || 0,
          downs: player.downs || 0,
          assists: player.assists || 0,
          revives: player.revives || 0,
          damage: player.damage || 0,
          captures: player.captures || 0
        }, !isTeam1Winner, player.operator || '', roundsPlayed);
        console.log(`🆕 Novo jogador criado: ${player.name}`);
      }
    }
    
    console.log('✅ Batalha processada e jogadores atualizados com sucesso');
  } catch (error) {
    console.error('❌ Erro ao processar resultados da batalha: ', error);
    throw error;
  }
};

