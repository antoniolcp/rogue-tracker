import { useState, useEffect } from 'react';
import { subscribeToBattles } from '../firebase/battles';
import './BestPerformance.css';

const BestPerformance = ({ onClose, onNavigateToGame }) => {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState({
    elims: { player: '', value: 0, battleId: null },
    downs: { player: '', value: 0, battleId: null },
    assists: { player: '', value: 0, battleId: null },
    revives: { player: '', value: 0, battleId: null },
    damage: { player: '', value: 0, battleId: null },
    captures: { player: '', value: 0, battleId: null }
  });

  // Subscrever às batalhas em tempo real
  useEffect(() => {
    const unsubscribe = subscribeToBattles((battlesData) => {
      setBattles(battlesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Calcular os recordes
  useEffect(() => {
    if (battles.length === 0) return;

    const newRecords = {
      elims: { player: '', value: 0, battleId: null },
      downs: { player: '', value: 0, battleId: null },
      assists: { player: '', value: 0, battleId: null },
      revives: { player: '', value: 0, battleId: null },
      damage: { player: '', value: 0, battleId: null },
      captures: { player: '', value: 0, battleId: null }
    };

    // Iterar por todas as batalhas
    battles.forEach((battle) => {
      // Verificar team1
      if (battle.team1 && Array.isArray(battle.team1)) {
        battle.team1.forEach((player) => {
          if (player.elims && player.elims > newRecords.elims.value) {
            newRecords.elims = { player: player.name, value: player.elims, battleId: battle.id };
          }
          if (player.downs && player.downs > newRecords.downs.value) {
            newRecords.downs = { player: player.name, value: player.downs, battleId: battle.id };
          }
          if (player.assists && player.assists > newRecords.assists.value) {
            newRecords.assists = { player: player.name, value: player.assists, battleId: battle.id };
          }
          if (player.revives && player.revives > newRecords.revives.value) {
            newRecords.revives = { player: player.name, value: player.revives, battleId: battle.id };
          }
          if (player.damage && player.damage > newRecords.damage.value) {
            newRecords.damage = { player: player.name, value: player.damage, battleId: battle.id };
          }
          if (player.captures && player.captures > newRecords.captures.value) {
            newRecords.captures = { player: player.name, value: player.captures, battleId: battle.id };
          }
        });
      }

      // Verificar team2
      if (battle.team2 && Array.isArray(battle.team2)) {
        battle.team2.forEach((player) => {
          if (player.elims && player.elims > newRecords.elims.value) {
            newRecords.elims = { player: player.name, value: player.elims, battleId: battle.id };
          }
          if (player.downs && player.downs > newRecords.downs.value) {
            newRecords.downs = { player: player.name, value: player.downs, battleId: battle.id };
          }
          if (player.assists && player.assists > newRecords.assists.value) {
            newRecords.assists = { player: player.name, value: player.assists, battleId: battle.id };
          }
          if (player.revives && player.revives > newRecords.revives.value) {
            newRecords.revives = { player: player.name, value: player.revives, battleId: battle.id };
          }
          if (player.damage && player.damage > newRecords.damage.value) {
            newRecords.damage = { player: player.name, value: player.damage, battleId: battle.id };
          }
          if (player.captures && player.captures > newRecords.captures.value) {
            newRecords.captures = { player: player.name, value: player.captures, battleId: battle.id };
          }
        });
      }
    });

    setRecords(newRecords);
  }, [battles]);

  if (loading) {
    return (
      <div className="best-performance-overlay">
        <div className="best-performance-container">
          <div className="loading">Carregando recordes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="best-performance-overlay">
      <div className="best-performance-container">
        <div className="best-performance-header">
          <h2>🏆 Melhor Performance</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="best-performance-content">
          <div className="records-table">
            <table>
              <thead>
                <tr>
                  <th>Estatística</th>
                  <th>Jogador</th>
                  <th>Recorde</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  className={records.elims.battleId ? 'clickable-row' : ''}
                  onClick={() => records.elims.battleId && onNavigateToGame && onNavigateToGame(records.elims.battleId)}
                  style={{ cursor: records.elims.battleId ? 'pointer' : 'default' }}
                >
                  <td><strong>Eliminações</strong></td>
                  <td>{records.elims.player || '-'}</td>
                  <td>{records.elims.value || 0}</td>
                </tr>
                <tr 
                  className={records.downs.battleId ? 'clickable-row' : ''}
                  onClick={() => records.downs.battleId && onNavigateToGame && onNavigateToGame(records.downs.battleId)}
                  style={{ cursor: records.downs.battleId ? 'pointer' : 'default' }}
                >
                  <td><strong>Downs</strong></td>
                  <td>{records.downs.player || '-'}</td>
                  <td>{records.downs.value || 0}</td>
                </tr>
                <tr 
                  className={records.assists.battleId ? 'clickable-row' : ''}
                  onClick={() => records.assists.battleId && onNavigateToGame && onNavigateToGame(records.assists.battleId)}
                  style={{ cursor: records.assists.battleId ? 'pointer' : 'default' }}
                >
                  <td><strong>Assists</strong></td>
                  <td>{records.assists.player || '-'}</td>
                  <td>{records.assists.value || 0}</td>
                </tr>
                <tr 
                  className={records.revives.battleId ? 'clickable-row' : ''}
                  onClick={() => records.revives.battleId && onNavigateToGame && onNavigateToGame(records.revives.battleId)}
                  style={{ cursor: records.revives.battleId ? 'pointer' : 'default' }}
                >
                  <td><strong>Revives</strong></td>
                  <td>{records.revives.player || '-'}</td>
                  <td>{records.revives.value || 0}</td>
                </tr>
                <tr 
                  className={records.damage.battleId ? 'clickable-row' : ''}
                  onClick={() => records.damage.battleId && onNavigateToGame && onNavigateToGame(records.damage.battleId)}
                  style={{ cursor: records.damage.battleId ? 'pointer' : 'default' }}
                >
                  <td><strong>Damage</strong></td>
                  <td>{records.damage.player || '-'}</td>
                  <td>{records.damage.value || 0}</td>
                </tr>
                <tr 
                  className={records.captures.battleId ? 'clickable-row' : ''}
                  onClick={() => records.captures.battleId && onNavigateToGame && onNavigateToGame(records.captures.battleId)}
                  style={{ cursor: records.captures.battleId ? 'pointer' : 'default' }}
                >
                  <td><strong>Captures</strong></td>
                  <td>{records.captures.player || '-'}</td>
                  <td>{records.captures.value || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestPerformance;

