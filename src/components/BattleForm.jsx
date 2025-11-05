import { useState, useEffect } from 'react';
import { addBattle } from '../firebase/battles';
import { processBattleResults } from '../firebase/players';
import './BattleForm.css';

const BattleForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    map: '',
    team1: [],
    team2: [],
    team1Rounds: 0,
    team2Rounds: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImportMode, setShowImportMode] = useState(false);

  // Debug: Monitorar mudanças no formData
  useEffect(() => {
    console.log('🔄 FormData atualizado:', formData);
  }, [formData]);

  const maps = [
    'High Castle', 'Skyfell', 'Vice', 'Wanted', 'Windward',
    'Lockdown', 'Canals', 'Icarus', 'The Arena', 'Breach', 'Favela', 'Factory','Glacier','Palace','Hollows'
  ];

  const operators = [
    'Anvil', 'Chaac', 'Dallas', 'Dima', 'Gl1tch', 'Kestrel', 
    'Lancer', 'Mack', 'Phantom', 'Rogue', 'Ronin', 'Saint', 
    'Scorch', 'Seeker', 'Switchblade', 'Talon', 'Trench', 
    'Vy', 'Wraith', 'Cannon', 'Dahlia', 'Fixer', 'Juke',
    'Sigrid', 'Umbra', 'Runway', 'Glimpse','Vivi'
  ];

  // Carregar jogadores disponíveis

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addPlayerToTeam = (team, playerName) => {
    if (!playerName.trim()) return;

    // Verificar se o jogador já está numa equipa
    const isInTeam1 = formData.team1.some(p => p.name === playerName);
    const isInTeam2 = formData.team2.some(p => p.name === playerName);
    
    if (isInTeam1 || isInTeam2) {
      alert('Este jogador já está numa equipa!');
      return;
    }

    // Verificar se a equipa já tem 4 jogadores
    if (formData[team].length >= 4) {
      alert('Esta equipa já tem 4 jogadores!');
      return;
    }

    const newPlayer = {
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ID único para cada jogador individual
      name: playerName.trim(),
      operator: '',
      elims: 0,
      downs: 0,
      assists: 0,
      revives: 0,
      damage: 0,
      captures: 0
    };
    
    console.log(`🆕 Novo jogador criado:`, { id: newPlayer.id, name: newPlayer.name, team });

    setFormData(prev => ({
      ...prev,
      [team]: [...prev[team], newPlayer]
    }));
  };

  const removePlayerFromTeam = (team, playerId) => {
    setFormData(prev => ({
      ...prev,
      [team]: prev[team].filter(p => p.id !== playerId)
    }));
  };

  const updatePlayerOperator = (team, playerId, operator) => {
    console.log(`🔄 Atualizando operador para jogador ID: ${playerId} na ${team} para: ${operator}`);
    console.log(`🔍 IDs atuais na ${team}:`, formData[team].map(p => ({ id: p.id, name: p.name })));
    
    setFormData(prev => {
      console.log(`🔍 IDs antes da atualização:`, prev[team].map(p => ({ id: p.id, name: p.name })));
      
      const updatedTeam = prev[team].map(p => {
        const isMatch = p.id === playerId;
        console.log(`🔍 Comparando ${p.id} === ${playerId}? ${isMatch}`);
        return isMatch 
          ? { ...p, operator }
          : p;
      });
      
      console.log(`✅ ${team} atualizada:`, updatedTeam.map((p, i) => `Jogador ${i+1}: ${p.name} (${p.operator || 'Sem operador'})`));
      return {
        ...prev,
        [team]: updatedTeam
      };
    });
  };


  const updatePlayerScoreboardStats = (team, playerId, field, value) => {
    setFormData(prev => ({
      ...prev,
      [team]: prev[team].map(p => 
        p.id === playerId 
          ? { ...p, [field]: parseInt(value) || 0 }
          : p
      )
    }));
  };

  const updateRounds = (team, value) => {
    const newValue = Math.max(0, Math.min(3, parseInt(value) || 0));
    setFormData(prev => ({
      ...prev,
      [team]: newValue
    }));
  };

  const getWinner = () => {
    if (formData.team1Rounds >= 3) return 'team1';
    if (formData.team2Rounds >= 3) return 'team2';
    return null;
  };

  const processImportData = () => {
    console.log('🚀 Botão clicado! A processar dados da partida real...');
    // Dados reais do POST MATCH REPORT - Team 3 vs Team 0 (VICTORY para Team 3)
    const baseTime = Date.now();
    const sampleData = {
      map: 'Unknown', // Mapa não especificado no relatório
      team1: [
        { id: `player_${baseTime}_1`, name: 'antoniolamycp9', operator: 'Unknown', elims: 27, downs: 22, assists: 5, revives: 1, damage: 4745, captures: 3 },
        { id: `player_${baseTime + 1}_2`, name: 'wrrqvy', operator: 'Unknown', elims: 20, downs: 13, assists: 7, revives: 0, damage: 2588, captures: 2 },
        { id: `player_${baseTime + 2}_3`, name: 'franciscomrfe', operator: 'Unknown', elims: 19, downs: 11, assists: 8, revives: 2, damage: 3098, captures: 3 },
        { id: `player_${baseTime + 3}_4`, name: 'Benny_Fuego', operator: 'Unknown', elims: 13, downs: 6, assists: 8, revives: 2, damage: 1590, captures: 2 }
      ],
      team2: [
        { id: `player_${baseTime + 4}_5`, name: 'fifagomesg-19', operator: 'Unknown', elims: 21, downs: 19, assists: 5, revives: 0, damage: 3820, captures: 1 },
        { id: `player_${baseTime + 5}_6`, name: 'BARROSA10', operator: 'Unknown', elims: 20, downs: 15, assists: 3, revives: 2, damage: 3361, captures: 8 },
        { id: `player_${baseTime + 6}_7`, name: 'pedro_jl76', operator: 'Unknown', elims: 11, downs: 3, assists: 4, revives: 0, damage: 1694, captures: 1 },
        { id: `player_${baseTime + 7}_8`, name: 'Duarte_Sogalho', operator: 'Unknown', elims: 7, downs: 6, assists: 3, revives: 1, damage: 1312, captures: 2 }
      ],
      team1Rounds: 3, // Team 3 (vencedora) - VICTORY
      team2Rounds: 0  // Team 0 (perdedora)
    };

    console.log('📥 Carregando dados de exemplo com IDs únicos:');
    console.log('Team1:', sampleData.team1.map(p => ({ id: p.id, name: p.name, operator: p.operator })));
    console.log('Team2:', sampleData.team2.map(p => ({ id: p.id, name: p.name, operator: p.operator })));

    console.log('📝 A atualizar formData...');
    setFormData(prev => {
      const newData = {
        ...prev,
        map: sampleData.map,
        team1: sampleData.team1,
        team2: sampleData.team2,
        team1Rounds: sampleData.team1Rounds,
        team2Rounds: sampleData.team2Rounds
      };
      console.log('✅ FormData atualizado:', newData);
      return newData;
    });

    console.log('🔄 A mudar para modo manual...');
    setShowImportMode(false);
    alert('Dados de exemplo carregados! Podes editar os nomes e estatísticas conforme necessário.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validar se ambas as equipas têm 4 jogadores
    if (formData.team1.length !== 4 || formData.team2.length !== 4) {
      alert('Cada equipa deve ter exatamente 4 jogadores!');
      setIsSubmitting(false);
      return;
    }

    try {
      const winner = getWinner();
      const battleData = {
        map: formData.map,
        mode: 'Strikeout',
        result: winner === 'team1' ? 'win' : 'loss',
        team1: formData.team1,
        team2: formData.team2,
        team1Rounds: formData.team1Rounds,
        team2Rounds: formData.team2Rounds,
        date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
      };

      // Adicionar batalha à base de dados
      await addBattle(battleData);
      
      // Processar e atualizar estatísticas dos jogadores
      await processBattleResults(battleData);
      
      onClose();
    } catch (error) {
      console.error('Erro ao adicionar batalha:', error);
      alert('Erro ao adicionar batalha. Tenta novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="battle-form-overlay">
      <div className="battle-form-container">
        <div className="battle-form-header">
          <h2>Adicionar Batalha</h2>
          <div className="header-controls">
            <button 
              type="button" 
              className="mode-toggle-btn"
              onClick={() => setShowImportMode(!showImportMode)}
            >
              {showImportMode ? 'Modo Manual' : 'Importar Screenshot'}
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {showImportMode ? (
          <div className="import-mode">
            <div className="import-instructions">
              <h3>📸 Importar Screenshot do Rogue Company</h3>
              <p>Envia-me uma imagem do scoreboard e eu preencho automaticamente!</p>
              
              <div className="sample-data">
                <h4>Dados da partida real (POST MATCH REPORT - Team 3 vs Team 0):</h4>
                <div className="sample-teams">
                  <div className="sample-team">
                    <strong>Team 3 (Vencedora - VICTORY):</strong>
                    <ul>
                      <li><strong>antoniolamycp9</strong>: 27 elims, 22 downs, 5 assists, 1 revive, 4745 damage, 3 captures</li>
                      <li>wrrqvy: 20 elims, 13 downs, 7 assists, 0 revives, 2588 damage, 2 captures</li>
                      <li>franciscomrfe: 19 elims, 11 downs, 8 assists, 2 revives, 3098 damage, 3 captures</li>
                      <li>Benny_Fuego: 13 elims, 6 downs, 8 assists, 2 revives, 1590 damage, 2 captures</li>
                    </ul>
                  </div>
                  <div className="sample-team">
                    <strong>Team 0 (Perdedora):</strong>
                    <ul>
                      <li>fifagomesg-19: 21 elims, 19 downs, 5 assists, 0 revives, 3820 damage, 1 capture</li>
                      <li>BARROSA10: 20 elims, 15 downs, 3 assists, 2 revives, 3361 damage, 8 captures</li>
                      <li>pedro_jl76: 11 elims, 3 downs, 4 assists, 0 revives, 1694 damage, 1 capture</li>
                      <li>Duarte_Sogalho: 7 elims, 6 downs, 3 assists, 1 revive, 1312 damage, 2 captures</li>
                    </ul>
                  </div>
                </div>
                <div className="match-info">
                  <p><strong>Match ID:</strong> d3b5875d-8016-4d82-abd2-d</p>
                  <p><strong>Match Result:</strong> VICTORY</p>
                  <p><strong>Resultado:</strong> Team 3 VICTORY</p>
                </div>
              </div>

              <div className="import-actions">
                <button 
                  type="button" 
                  className="import-sample-btn"
                  onClick={processImportData}
                >
                  🎮 Usar Dados do POST MATCH REPORT (Team 3 VICTORY)
                </button>
                <p className="import-note">
                  <em>Dados extraídos do POST MATCH REPORT (Team 3 VICTORY)</em>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="battle-form">
          <div className="form-row">
            <div className="form-group">
              <label>Mapa</label>
              <select
                name="map"
                value={formData.map}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleciona um mapa</option>
                {maps.map(map => (
                  <option key={map} value={map}>{map}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="teams-section">
            <h3>Batalha Strikeout 4vs4</h3>
              <div className="scoreboard-container">
                <div className="scoreboard-header">
                  <div className="match-info">
                    <span>Match: {Date.now().toString().slice(-8)}</span>
                  </div>
                </div>
                
                <div className="scoreboard-tabs">
                  <div className="tab active">SCOREBOARD</div>
                </div>

                <div className="scoreboard-table">
                  <div className="table-header">
                    <div className="header-cell player">PLAYER</div>
                    <div className="header-cell">OPERADOR</div>
                    <div className="header-cell">ELIMS</div>
                    <div className="header-cell">DOWNS</div>
                    <div className="header-cell">ASSISTS</div>
                    <div className="header-cell">REVIVES</div>
                    <div className="header-cell">DAMAGE</div>
                    <div className="header-cell">CAPTURES</div>
                  </div>

                  {/* Team 1 */}
                  <div className="team-section-scoreboard">
                    <div className="team-label">
                      <span>TEAM 1</span>
                      <div className="rounds-counter">
                        <label>Rondas:</label>
                        <input
                          type="number"
                          value={formData.team1Rounds}
                          onChange={(e) => updateRounds('team1Rounds', e.target.value)}
                          min="0"
                          max="3"
                          className="rounds-input-small"
                        />
                        <span className="rounds-status">
                          {formData.team1Rounds >= 3 ? '🏆 VITÓRIA!' : `${formData.team1Rounds}/3`}
                        </span>
                      </div>
                    </div>
                        {formData.team1.map((player, index) => {
                          console.log(`🔍 Team1 - Jogador ${index + 1}:`, { id: player.id, name: player.name, operator: player.operator });
                          return (
                      <div key={player.id} className="player-row-scoreboard">
                        <div className="player-cell">
                          <span className="player-name">{player.name}</span>
                          <button
                            type="button"
                            onClick={() => removePlayerFromTeam('team1', player.id)}
                            className="remove-player-btn-small"
                          >
                            ×
                          </button>
                        </div>
                        <div className="operator-cell">
                          <select
                            value={player.operator || ''}
                            onChange={(e) => {
                              console.log(`🔄 Team1 - Jogador "${player.name}" (ID: ${player.id}) escolheu operador:`, e.target.value);
                              updatePlayerOperator('team1', player.id, e.target.value);
                            }}
                            className="operator-select"
                          >
                            <option value="">Escolher...</option>
                            {operators.map(op => (
                              <option key={op} value={op}>{op}</option>
                            ))}
                          </select>
                        </div>
                        <div className="stat-cell">
                          <input
                            type="number"
                            value={player.elims || 0}
                            onChange={(e) => updatePlayerScoreboardStats('team1', player.id, 'elims', e.target.value)}
                            min="0"
                            placeholder="0"
                          />
                        </div>
                        <div className="stat-cell">
                          <input
                            type="number"
                            value={player.downs || 0}
                            onChange={(e) => updatePlayerScoreboardStats('team1', player.id, 'downs', e.target.value)}
                            min="0"
                            placeholder="0"
                          />
                        </div>
                        <div className="stat-cell">
                          <input
                            type="number"
                            value={player.assists || 0}
                            onChange={(e) => updatePlayerScoreboardStats('team1', player.id, 'assists', e.target.value)}
                            min="0"
                            placeholder="0"
                          />
                        </div>
                        <div className="stat-cell">
                          <input
                            type="number"
                            value={player.revives || 0}
                            onChange={(e) => updatePlayerScoreboardStats('team1', player.id, 'revives', e.target.value)}
                            min="0"
                            placeholder="0"
                          />
                        </div>
                        <div className="stat-cell">
                          <input
                            type="number"
                            value={player.damage || 0}
                            onChange={(e) => updatePlayerScoreboardStats('team1', player.id, 'damage', e.target.value)}
                            min="0"
                            placeholder="0"
                          />
                        </div>
                        <div className="stat-cell">
                          <input
                            type="number"
                            value={player.captures || 0}
                            onChange={(e) => updatePlayerScoreboardStats('team1', player.id, 'captures', e.target.value)}
                            min="0"
                            placeholder="0"
                          />
                        </div>
                      </div>
                        );
                      })}
                    
                    {formData.team1.length < 4 && (
                      <div className="add-player-row">
                        <div className="player-cell">
                          <input
                            type="text"
                            className="player-input-scoreboard"
                            placeholder="Nome do jogador..."
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addPlayerToTeam('team1', e.target.value);
                                e.target.value = '';
                              }
                            }}
                            onBlur={(e) => {
                              if (e.target.value.trim()) {
                                addPlayerToTeam('team1', e.target.value);
                                e.target.value = '';
                              }
                            }}
                          />
                        </div>
                        <div className="stat-cell">-</div>
                        <div className="stat-cell">-</div>
                        <div className="stat-cell">-</div>
                        <div className="stat-cell">-</div>
                        <div className="stat-cell">-</div>
                        <div className="stat-cell">-</div>
                      </div>
                    )}
                  </div>

                  {/* Team 2 */}
                  <div className="team-section-scoreboard">
                    <div className="team-label">
                      <span>TEAM 2</span>
                      <div className="rounds-counter">
                        <label>Rondas:</label>
                        <input
                          type="number"
                          value={formData.team2Rounds}
                          onChange={(e) => updateRounds('team2Rounds', e.target.value)}
                          min="0"
                          max="3"
                          className="rounds-input-small"
                        />
                        <span className="rounds-status">
                          {formData.team2Rounds >= 3 ? '🏆 VITÓRIA!' : `${formData.team2Rounds}/3`}
                        </span>
                      </div>
                    </div>
                        {formData.team2.map((player, index) => {
                          console.log(`🔍 Team2 - Jogador ${index + 1}:`, { id: player.id, name: player.name, operator: player.operator });
                          return (
                      <div key={player.id} className="player-row-scoreboard">
                        <div className="player-cell">
                          <span className="player-name">{player.name}</span>
                          <button
                            type="button"
                            onClick={() => removePlayerFromTeam('team2', player.id)}
                            className="remove-player-btn-small"
                          >
                            ×
                          </button>
                        </div>
                        <div className="operator-cell">
                          <select
                            value={player.operator || ''}
                            onChange={(e) => {
                              console.log(`🔄 Team2 - Jogador "${player.name}" (ID: ${player.id}) escolheu operador:`, e.target.value);
                              updatePlayerOperator('team2', player.id, e.target.value);
                            }}
                            className="operator-select"
                          >
                            <option value="">Escolher...</option>
                            {operators.map(op => (
                              <option key={op} value={op}>{op}</option>
                            ))}
                          </select>
                        </div>
                        <div className="stat-cell">
                          <input
                            type="number"
                            value={player.elims || 0}
                            onChange={(e) => updatePlayerScoreboardStats('team2', player.id, 'elims', e.target.value)}
                            min="0"
                            placeholder="0"
                          />
                        </div>
                        <div className="stat-cell">
                          <input
                            type="number"
                            value={player.downs || 0}
                            onChange={(e) => updatePlayerScoreboardStats('team2', player.id, 'downs', e.target.value)}
                            min="0"
                            placeholder="0"
                          />
                        </div>
                        <div className="stat-cell">
                          <input
                            type="number"
                            value={player.assists || 0}
                            onChange={(e) => updatePlayerScoreboardStats('team2', player.id, 'assists', e.target.value)}
                            min="0"
                            placeholder="0"
                          />
                        </div>
                        <div className="stat-cell">
                          <input
                            type="number"
                            value={player.revives || 0}
                            onChange={(e) => updatePlayerScoreboardStats('team2', player.id, 'revives', e.target.value)}
                            min="0"
                            placeholder="0"
                          />
                        </div>
                        <div className="stat-cell">
                          <input
                            type="number"
                            value={player.damage || 0}
                            onChange={(e) => updatePlayerScoreboardStats('team2', player.id, 'damage', e.target.value)}
                            min="0"
                            placeholder="0"
                          />
                        </div>
                        <div className="stat-cell">
                          <input
                            type="number"
                            value={player.captures || 0}
                            onChange={(e) => updatePlayerScoreboardStats('team2', player.id, 'captures', e.target.value)}
                            min="0"
                            placeholder="0"
                          />
                        </div>
                      </div>
                        );
                      })}
                    
                    {formData.team2.length < 4 && (
                      <div className="add-player-row">
                        <div className="player-cell">
                          <input
                            type="text"
                            className="player-input-scoreboard"
                            placeholder="Nome do jogador..."
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addPlayerToTeam('team2', e.target.value);
                                e.target.value = '';
                              }
                            }}
                            onBlur={(e) => {
                              if (e.target.value.trim()) {
                                addPlayerToTeam('team2', e.target.value);
                                e.target.value = '';
                              }
                            }}
                          />
                        </div>
                        <div className="stat-cell">-</div>
                        <div className="stat-cell">-</div>
                        <div className="stat-cell">-</div>
                        <div className="stat-cell">-</div>
                        <div className="stat-cell">-</div>
                        <div className="stat-cell">-</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
          </div>



          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? 'A adicionar...' : 'Adicionar Batalha'}
            </button>
          </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BattleForm;
