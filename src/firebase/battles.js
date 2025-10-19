import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { db } from './config';

// Coleção de batalhas no Firestore
const BATTLES_COLLECTION = 'battles';

// Adicionar uma nova batalha
export const addBattle = async (battleData) => {
  try {
    const docRef = await addDoc(collection(db, BATTLES_COLLECTION), {
      ...battleData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Batalha adicionada com ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar batalha: ', error);
    throw error;
  }
};

// Obter todas as batalhas
export const getBattles = async () => {
  try {
    const q = query(collection(db, BATTLES_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const battles = [];
    querySnapshot.forEach((doc) => {
      battles.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return battles;
  } catch (error) {
    console.error('Erro ao obter batalhas: ', error);
    throw error;
  }
};

// Escutar mudanças em tempo real
export const subscribeToBattles = (callback) => {
  const q = query(collection(db, BATTLES_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (querySnapshot) => {
    const battles = [];
    querySnapshot.forEach((doc) => {
      battles.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(battles);
  });
};

// Atualizar uma batalha
export const updateBattle = async (battleId, updateData) => {
  try {
    const battleRef = doc(db, BATTLES_COLLECTION, battleId);
    await updateDoc(battleRef, {
      ...updateData,
      updatedAt: new Date()
    });
    console.log('Batalha atualizada com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar batalha: ', error);
    throw error;
  }
};


// Calcular estatísticas
export const calculateStats = (battles) => {
  if (!battles || battles.length === 0) {
    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      winRate: 0
    };
  }

  const wins = battles.filter(battle => battle.result === 'win').length;
  const losses = battles.filter(battle => battle.result === 'loss').length;
  const totalGames = battles.length;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  return {
    totalGames,
    wins,
    losses,
    winRate
  };
};

