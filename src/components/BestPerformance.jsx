import { useState, useEffect } from 'react';
import { subscribeToBattles } from '../firebase/battles';
import './BestPerformance.css';

const BestPerformance = ({ onClose }) => {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState({
    elims: { player: '', value: 0 },
    downs: { player: '', value: 0 },
    assists: { player: '', value: 0 },
    revives: { player: '', value: 0 },
    damage: { player: '', value: 0 },
    captures: { player: '', value: 0 }
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
      elims: { player: '', value: 0 },
      downs: { player: '', value: 0 },
      assists: { player: '', value: 0 },
      revives: { player: '', value: 0 },
      damage: { player: '', value: 0 },
      captures: { player: '', value: 0 }
    };

    // Iterar por todas as batalhas
    battles.forEach((battle) => {
      // Verificar team1
      if (battle.team1 && Array.isArray(battle.team1)) {
        battle.team1.forEach((player) => {
          if (player.elims && player.elims > newRecords.elims.value) {
            newRecords.elims = { player: player.name, value: player.elims };
          }
          if (player.downs && player.downs > newRecords.downs.value) {
            newRecords.downs = { player: player.name, value: player.downs };
          }
          if (player.assists && player.assists > newRecords.assists.value) {
            newRecords.assists = { player: player.name, value: player.assists };
          }
          if (player.revives && player.revives > newRecords.revives.value) {
            newRecords.revives = { player: player.name, value: player.revives };
          }
          if (player.damage && player.damage > newRecords.damage.value) {
            newRecords.damage = { player: player.name, value: player.damage };
          }
          if (player.captures && player.captures > newRecords.captures.value) {
            newRecords.captures = { player: player.name, value: player.captures };
          }
        });
      }

      // Verificar team2
      if (battle.team2 && Array.isArray(battle.team2)) {
        battle.team2.forEach((player) => {
          if (player.elims && player.elims > newRecords.elims.value) {
            newRecords.elims = { player: player.name, value: player.elims };
          }
          if (player.downs && player.downs > newRecords.downs.value) {
            newRecords.downs = { player: player.name, value: player.downs };
          }
          if (player.assists && player.assists > newRecords.assists.value) {
            newRecords.assists = { player: player.name, value: player.assists };
          }
          if (player.revives && player.revives > newRecords.revives.value) {
            newRecords.revives = { player: player.name, value: player.revives };
          }
          if (player.damage && player.damage > newRecords.damage.value) {
            newRecords.damage = { player: player.name, value: player.damage };
          }
          if (player.captures && player.captures > newRecords.captures.value) {
            newRecords.captures = { player: player.name, value: player.captures };
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
                <tr>
                  <td><strong>Eliminações</strong></td>
                  <td>{records.elims.player || '-'}</td>
                  <td>{records.elims.value || 0}</td>
                </tr>
                <tr>
                  <td><strong>Downs</strong></td>
                  <td>{records.downs.player || '-'}</td>
                  <td>{records.downs.value || 0}</td>
                </tr>
                <tr>
                  <td><strong>Assists</strong></td>
                  <td>{records.assists.player || '-'}</td>
                  <td>{records.assists.value || 0}</td>
                </tr>
                <tr>
                  <td><strong>Revives</strong></td>
                  <td>{records.revives.player || '-'}</td>
                  <td>{records.revives.value || 0}</td>
                </tr>
                <tr>
                  <td><strong>Damage</strong></td>
                  <td>{records.damage.player || '-'}</td>
                  <td>{records.damage.value || 0}</td>
                </tr>
                <tr>
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

