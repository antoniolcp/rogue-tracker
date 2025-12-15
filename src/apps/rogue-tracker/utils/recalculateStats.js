import { getBattles } from '../firebase/battles';
import { getPlayers } from '../firebase/players';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const PLAYERS_COLLECTION = 'players';

// Recalcular todas as estatísticas baseado nas rondas
export const recalculateAllPlayerStats = async () => {
  try {
    console.log('🔄 Iniciando recálculo de estatísticas...');
    
    // Obter todas as batalhas
    const battles = await getBattles();
    console.log(`📊 Encontradas ${battles.length} batalhas`);
    
    // Obter todos os jogadores
    const players = await getPlayers();
    console.log(`👥 Encontrados ${players.length} jogadores`);
    
    // Criar um mapa para acumular estatísticas
    const playerStats = {};
    
    // Criar um mapa para contar uso de operadores por jogador
    const playerOperators = {};
    
    // Inicializar todos os jogadores
    players.forEach(player => {
      playerStats[player.name] = {
        totalGames: 0,
        totalRounds: 0,
        totalWins: 0,
        totalLosses: 0,
        totalElims: 0,
        totalDowns: 0,
        totalAssists: 0,
        totalRevives: 0,
        totalDamage: 0,
        totalCaptures: 0,
        bestElims: 0,
        bestDowns: 0,
        bestAssists: 0,
        bestRevives: 0,
        bestDamage: 0,
        bestCaptures: 0,
        lastOperator: player.lastOperator || ''
      };
      playerOperators[player.name] = {};
    });
    
    // Processar cada batalha
    battles.forEach(battle => {
      const { team1, team2, result, team1Rounds, team2Rounds } = battle;
      const roundsPlayed = (team1Rounds || 0) + (team2Rounds || 0);
      const isTeam1Winner = result === 'win';
      
      // Processar Team 1
      if (team1 && Array.isArray(team1)) {
        team1.forEach(player => {
          // Inicializar jogador se não existir
          if (!playerStats[player.name]) {
            playerStats[player.name] = {
              totalGames: 0,
              totalRounds: 0,
              totalWins: 0,
              totalLosses: 0,
              totalElims: 0,
              totalDowns: 0,
              totalAssists: 0,
              totalRevives: 0,
              totalDamage: 0,
              totalCaptures: 0,
              bestElims: 0,
              bestDowns: 0,
              bestAssists: 0,
              bestRevives: 0,
              bestDamage: 0,
              bestCaptures: 0,
              lastOperator: ''
            };
            playerOperators[player.name] = {};
          }
          
          if (playerStats[player.name]) {
            playerStats[player.name].totalGames++;
            playerStats[player.name].totalRounds += roundsPlayed;
            playerStats[player.name].totalWins += isTeam1Winner ? 1 : 0;
            playerStats[player.name].totalLosses += isTeam1Winner ? 0 : 1;
            playerStats[player.name].totalElims += player.elims || 0;
            playerStats[player.name].totalDowns += player.downs || 0;
            playerStats[player.name].totalAssists += player.assists || 0;
            playerStats[player.name].totalRevives += player.revives || 0;
            playerStats[player.name].totalDamage += player.damage || 0;
            playerStats[player.name].totalCaptures += player.captures || 0;
            
            // Atualizar melhores performances
            playerStats[player.name].bestElims = Math.max(playerStats[player.name].bestElims, player.elims || 0);
            playerStats[player.name].bestDowns = Math.max(playerStats[player.name].bestDowns, player.downs || 0);
            playerStats[player.name].bestAssists = Math.max(playerStats[player.name].bestAssists, player.assists || 0);
            playerStats[player.name].bestRevives = Math.max(playerStats[player.name].bestRevives, player.revives || 0);
            playerStats[player.name].bestDamage = Math.max(playerStats[player.name].bestDamage, player.damage || 0);
            playerStats[player.name].bestCaptures = Math.max(playerStats[player.name].bestCaptures, player.captures || 0);
            
            // Contar uso de operador
            if (player.operator && player.operator.trim() !== '' && player.operator !== 'Unknown') {
              if (!playerOperators[player.name][player.operator]) {
                playerOperators[player.name][player.operator] = 0;
              }
              playerOperators[player.name][player.operator]++;
            }
          }
        });
      }
      
      // Processar Team 2
      if (team2 && Array.isArray(team2)) {
        team2.forEach(player => {
          // Inicializar jogador se não existir
          if (!playerStats[player.name]) {
            playerStats[player.name] = {
              totalGames: 0,
              totalRounds: 0,
              totalWins: 0,
              totalLosses: 0,
              totalElims: 0,
              totalDowns: 0,
              totalAssists: 0,
              totalRevives: 0,
              totalDamage: 0,
              totalCaptures: 0,
              bestElims: 0,
              bestDowns: 0,
              bestAssists: 0,
              bestRevives: 0,
              bestDamage: 0,
              bestCaptures: 0,
              lastOperator: ''
            };
            playerOperators[player.name] = {};
          }
          
          if (playerStats[player.name]) {
            playerStats[player.name].totalGames++;
            playerStats[player.name].totalRounds += roundsPlayed;
            playerStats[player.name].totalWins += !isTeam1Winner ? 1 : 0;
            playerStats[player.name].totalLosses += !isTeam1Winner ? 0 : 1;
            playerStats[player.name].totalElims += player.elims || 0;
            playerStats[player.name].totalDowns += player.downs || 0;
            playerStats[player.name].totalAssists += player.assists || 0;
            playerStats[player.name].totalRevives += player.revives || 0;
            playerStats[player.name].totalDamage += player.damage || 0;
            playerStats[player.name].totalCaptures += player.captures || 0;
            
            // Atualizar melhores performances
            playerStats[player.name].bestElims = Math.max(playerStats[player.name].bestElims, player.elims || 0);
            playerStats[player.name].bestDowns = Math.max(playerStats[player.name].bestDowns, player.downs || 0);
            playerStats[player.name].bestAssists = Math.max(playerStats[player.name].bestAssists, player.assists || 0);
            playerStats[player.name].bestRevives = Math.max(playerStats[player.name].bestRevives, player.revives || 0);
            playerStats[player.name].bestDamage = Math.max(playerStats[player.name].bestDamage, player.damage || 0);
            playerStats[player.name].bestCaptures = Math.max(playerStats[player.name].bestCaptures, player.captures || 0);
            
            // Contar uso de operador
            if (player.operator && player.operator.trim() !== '' && player.operator !== 'Unknown') {
              if (!playerOperators[player.name][player.operator]) {
                playerOperators[player.name][player.operator] = 0;
              }
              playerOperators[player.name][player.operator]++;
            }
          }
        });
      }
    });
    
    // Calcular operador favorito para cada jogador
    const favoriteOperators = {};
    for (const [playerName, operators] of Object.entries(playerOperators)) {
      let maxUses = 0;
      let favoriteOperator = '';
      
      for (const [operator, count] of Object.entries(operators)) {
        if (count > maxUses) {
          maxUses = count;
          favoriteOperator = operator;
        }
      }
      
      favoriteOperators[playerName] = favoriteOperator;
    }
    
    // Atualizar todos os jogadores com as estatísticas recalculadas
    for (const [playerName, stats] of Object.entries(playerStats)) {
      if (stats.totalGames > 0) {
        const winRate = stats.totalGames > 0 ? (stats.totalWins / stats.totalGames) * 100 : 0;
        
        const updateData = {
          totalGames: stats.totalGames,
          totalRounds: stats.totalRounds,
          totalWins: stats.totalWins,
          totalLosses: stats.totalLosses,
          winRate: Math.round(winRate * 100) / 100,
          totalElims: stats.totalElims,
          totalDowns: stats.totalDowns,
          totalAssists: stats.totalAssists,
          totalRevives: stats.totalRevives,
          totalDamage: stats.totalDamage,
          totalCaptures: stats.totalCaptures,
          // Calcular médias por ronda
          avgElims: stats.totalRounds > 0 ? Math.round((stats.totalElims / stats.totalRounds) * 10) / 10 : 0,
          avgDowns: stats.totalRounds > 0 ? Math.round((stats.totalDowns / stats.totalRounds) * 10) / 10 : 0,
          avgAssists: stats.totalRounds > 0 ? Math.round((stats.totalAssists / stats.totalRounds) * 10) / 10 : 0,
          avgRevives: stats.totalRounds > 0 ? Math.round((stats.totalRevives / stats.totalRounds) * 10) / 10 : 0,
          avgDamage: stats.totalRounds > 0 ? Math.round((stats.totalDamage / stats.totalRounds) * 10) / 10 : 0,
          avgCaptures: stats.totalRounds > 0 ? Math.round((stats.totalCaptures / stats.totalRounds) * 10) / 10 : 0,
          bestElims: stats.bestElims,
          bestDowns: stats.bestDowns,
          bestAssists: stats.bestAssists,
          bestRevives: stats.bestRevives,
          bestDamage: stats.bestDamage,
          bestCaptures: stats.bestCaptures,
          lastOperator: stats.lastOperator,
          favoriteOperator: favoriteOperators[playerName] || '',
          updatedAt: new Date()
        };
        
        const playerRef = doc(db, PLAYERS_COLLECTION, playerName);
        await updateDoc(playerRef, updateData);
        console.log(`✅ Atualizado: ${playerName} (Operador Favorito: ${favoriteOperators[playerName] || 'N/A'})`);
      }
    }
    
    console.log('✅ Recálculo completo!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao recalcular estatísticas:', error);
    throw error;
  }
};

