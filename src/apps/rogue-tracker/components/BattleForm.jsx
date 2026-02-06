import { useState, useEffect, useCallback } from 'react';
import { addBattle, getBattles } from '../firebase/battles';
import { processBattleResults, getPlayers } from '../firebase/players';
import { recognizeImage } from '../utils/ocrService';
import { migratePlayerName } from '../firebase/migration';
import pendingBattlesData from '../data/pending_battles.json';
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
  const [playerFavoriteOperators, setPlayerFavoriteOperators] = useState({});
  const [pendingBattles, setPendingBattles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [allPlayers, setAllPlayers] = useState([]);

  // Carregar operadores favoritos dos jogadores
  useEffect(() => {
    const loadFavoriteOperators = async () => {
      try {
        const battles = await getBattles();
        const players = await getPlayers();
        setAllPlayers(players);

        // Criar mapa de operadores por jogador
        const operatorCount = {};

        // Inicializar com lastOperator de cada jogador
        players.forEach(player => {
          if (player.lastOperator && player.lastOperator !== 'Unknown' && player.lastOperator.trim() !== '') {
            if (!operatorCount[player.name]) {
              operatorCount[player.name] = {};
            }
            // Dar um peso inicial ao lastOperator
            operatorCount[player.name][player.lastOperator] = 1;
          }
        });

        // Contar uso de operadores nas batalhas
        battles.forEach(battle => {
          const allPlayers = [...(battle.team1 || []), ...(battle.team2 || [])];
          allPlayers.forEach(player => {
            if (!player || !player.name) return;

            if (player.operator && player.operator !== 'Unknown' && player.operator.trim() !== '') {
              if (!operatorCount[player.name]) {
                operatorCount[player.name] = {};
              }
              operatorCount[player.name][player.operator] = (operatorCount[player.name][player.operator] || 0) + 1;
            }
          });
        });

        // Encontrar operador mais usado para cada jogador
        const favorites = {};
        Object.keys(operatorCount).forEach(playerName => {
          const operators = operatorCount[playerName];
          const opKeys = Object.keys(operators);
          if (opKeys.length === 0) return;

          const mostUsed = opKeys.reduce((a, b) =>
            operators[a] > operators[b] ? a : b
          );
          favorites[playerName] = mostUsed;
        });

        setPlayerFavoriteOperators(favorites);
        console.log('🎯 Operadores favoritos carregados:', favorites);
      } catch (error) {
        console.error('Erro ao carregar operadores favoritos:', error);
      }
    };

    loadFavoriteOperators();
  }, []);

  // Debug: Monitorar mudanças no formData
  useEffect(() => {
    console.log('🔄 FormData atualizado:', formData);
  }, [formData]);

  const maps = [
    'High Castle', 'Skyfell', 'Vice', 'Wanted', 'Windward',
    'Lockdown', 'Canals', 'Icarus', 'The Arena', 'Breach', 'Favela', 'Factory', 'Glacier', 'Palace', 'Hollows', 'Canals 2', 'Meltdown', 'Unknown'
  ];

  const operators = [
    'Anvil', 'Chaac', 'Dallas', 'Dima', 'Gl1tch', 'Kestrel',
    'Lancer', 'Mack', 'Phantom', 'Rogue', 'Ronin', 'Saint',
    'Scorch', 'Seeker', 'Switchblade', 'Talon', 'Trench',
    'Vy', 'Wraith', 'Cannon', 'Dahlia', 'Fixer', 'Juke',
    'Sigrid', 'Umbra', 'Runway', 'Glimpse', 'Vivi'
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
      id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`, // ID único para cada jogador individual
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

      console.log(`✅ ${team} atualizada:`, updatedTeam.map((p, i) => `Jogador ${i + 1}: ${p.name} (${p.operator || 'Sem operador'})`));
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



  const handleSubmit = async (e, isBatch = false) => {
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

      if (isBatch && pendingBattles.length > 0) {
        // Mark as processed in LocalStorage
        const currentBattle = pendingBattles[0];
        if (currentBattle._signature) {
          const processed = JSON.parse(localStorage.getItem('rogue_processed_battles') || '[]');
          if (!processed.includes(currentBattle._signature)) {
            processed.push(currentBattle._signature);
            localStorage.setItem('rogue_processed_battles', JSON.stringify(processed));
          }
        }

        // If in batch mode and more battles exist, load next
        handleNextBattle();
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Erro ao adicionar batalha:', error);
      alert('Erro ao adicionar batalha. Tenta novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* 
   * BATCH UPLOAD IMPORT LOGIC 
   */

  const loadBattleIntoForm = useCallback((battleData) => {
    // Enrich with favorites logic (moved from old processImportData)
    const enrichTeam = (team) => team.map(player => ({
      ...player,
      id: player.id || `player_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      operator: player.operator && player.operator !== 'Unknown'
        ? player.operator
        : (playerFavoriteOperators[player.name] || '')
    }));

    setFormData({
      map: battleData.map,
      team1: enrichTeam(battleData.team1),
      team2: enrichTeam(battleData.team2),
      team1Rounds: battleData.team1Rounds || 0,
      team2Rounds: battleData.team2Rounds || 0
    });
  }, [playerFavoriteOperators]);

  // Using useCallback to key dependencies for useEffect
  const processFiles = useCallback(async (files) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    const results = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Processing file ${i + 1}/${files.length}...`);

        // Call OCR Service
        // Pass known players for fuzzy matching
        const knownNames = allPlayers.map(p => p.name);
        const data = await recognizeImage(file, knownNames);

        // Enrich with favorites if possible (reusing logic later)
        results.push({
          ...data,
          originalFile: file.name
        });
      }

      console.log('Processed battles:', results);

      if (results.length > 0) {
        setPendingBattles(prev => [...prev, ...results]);
        // If we were empty, load the first one. If we already had pending, just append.
        if (pendingBattles.length === 0) {
          loadBattleIntoForm(results[0]);
          setShowImportMode(false); // Go to edit mode
        }
      }
    } catch (error) {
      console.error('Batch upload error:', error);
      alert('Erro ao processar as imagens. ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  }, [pendingBattles, loadBattleIntoForm, setShowImportMode, setIsProcessing, setPendingBattles, allPlayers]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    await processFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const imageFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        await processFiles(imageFiles);
      } else {
        alert('Por favor, arrasta apenas ficheiros de imagem.');
      }
    }
  };

  // Paste listener for the whole window when in import mode
  useEffect(() => {
    const handlePaste = async (e) => {
      if (!showImportMode) return;

      const items = e.clipboardData.items;
      const imageFiles = [];

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        // Create dummy names for pasted files
        const filesWithNames = imageFiles.map((f) => {
          // Paste usually gives 'image.png' or similar. We can just use it.
          return f;
        });
        await processFiles(filesWithNames);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [showImportMode, pendingBattles, processFiles]); // Re-bind if mode changes



  const handleNextBattle = () => {
    // Remove current battle from pending
    const remaining = pendingBattles.slice(1);
    setPendingBattles(remaining);

    if (remaining.length > 0) {
      loadBattleIntoForm(remaining[0]);
    } else {
      // All done
      onClose();
    }
  };

  // Custom submit handler for batch mode
  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    await handleSubmit(e, true); // Pass true to indicate "don't close yet"
  };

  const getBattleSignature = (battle) => {
    // Create a unique string based on content
    const t1 = battle.team1 && battle.team1[0] ? battle.team1[0].name : '';
    const t1Damage = battle.team1 && battle.team1[0] ? battle.team1[0].damage : '';
    const score = `${battle.team1Rounds}-${battle.team2Rounds}`;
    const map = battle.map || 'Unknown';
    // Use JSON.stringify of simplified object to avoid minor differences
    // Added t1Damage to signature to avoid collisions on Unknown map with same players
    return `SIG_${map}_${t1}_${t1Damage}_${score}`;
  };

  const handleLoadPendingJson = () => {
    if (pendingBattlesData && pendingBattlesData.length > 0) {
      console.log('📂 Loading pending battles from JSON:', pendingBattlesData);

      const processedSignatures = JSON.parse(localStorage.getItem('rogue_processed_battles') || '[]');

      const results = [];
      let skipped = 0;

      pendingBattlesData.forEach((battle, index) => {
        const sig = getBattleSignature(battle);
        if (processedSignatures.includes(sig)) {
          skipped++;
          return;
        }

        results.push({
          ...battle,
          _signature: sig, // Store for later
          originalFile: battle.originalFile || `JSONItem_${index + 1}`
        });
      });

      if (results.length === 0) {
        if (skipped > 0) {
          alert(`Todas as ${skipped} batalhas do ficheiro já foram processadas anteriormente!`);
        } else {
          alert('O ficheiro JSON no código está vazio ([]).');
        }
        return;
      }

      setPendingBattles(prev => [...prev, ...results]);

      // Load the first one immediately
      if (pendingBattles.length === 0 && results.length > 0) {
        loadBattleIntoForm(results[0]);
        setShowImportMode(false);
      }

      alert(`${results.length} novas batalhas carregadas! (${skipped} ignoradas por já terem sido feitas)`);
    } else {
      alert('O ficheiro JSON no código está vazio ([]).');
    }
  };

  return (
    <div className="battle-form-overlay">
      <div className="battle-form-container">
        <div className="battle-form-header">
          <h2>
            {pendingBattles.length > 0
              ? `Validar Batalhas (${pendingBattles.length} restante${pendingBattles.length > 1 ? 's' : ''})`
              : 'Adicionar Batalha'}
          </h2>
          <div className="header-controls">
            {pendingBattles.length === 0 && (
              <>
                <button
                  type="button"
                  className="mode-toggle-btn"
                  onClick={handleLoadPendingJson}
                  style={{ marginRight: '10px', backgroundColor: '#2c3e50' }}
                >
                  📥 Carregar JSON
                </button>
                <button
                  type="button"
                  className="mode-toggle-btn"
                  onClick={() => setShowImportMode(!showImportMode)}
                >
                  {showImportMode ? 'Voltar ao Manual' : 'Importar (Img)'}
                </button>
              </>
            )}
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {showImportMode ? (
          <div className="import-mode">
            <div className="import-instructions">
              <h3>📸 Importar Screenshots (Batch)</h3>
              <p>Carrega várias imagens de uma vez. O sistema vai tentar ler os dados.</p>

              {isProcessing ? (
                <div className="processing-indicator">
                  <div className="spinner"></div>
                  <p>A processar imagens com IA... Aguarda.</p>
                </div>
              ) : (
                <div
                  className="upload-area"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="file-input-large"
                    id="batch-upload-input"
                  />
                  <label htmlFor="batch-upload-input" className="upload-label">
                    <span className="icon">📂</span>
                    <span>Clica, Arrasta ou Cola (Ctrl+V) aqui</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={pendingBattles.length > 0 ? handleBatchSubmit : handleSubmit} className="battle-form">
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

              {pendingBattles.length > 0 && (
                <div className="batch-info">
                  <span className="badge">Fila: {pendingBattles.length}</span>
                  {pendingBattles[0].originalFile && (
                    <span className="filename">Ficheiro: {pendingBattles[0].originalFile}</span>
                  )}
                </div>
              )}
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
                    <div className="header-cell player"><span className="desktop-only">PLAYER</span><span className="mobile-only">PLY</span></div>
                    <div className="header-cell"><span className="desktop-only">OPERADOR</span><span className="mobile-only">OP</span></div>
                    <div className="header-cell"><span className="desktop-only">ELIMS</span><span className="mobile-only">K</span></div>
                    <div className="header-cell"><span className="desktop-only">DOWNS</span><span className="mobile-only">D</span></div>
                    <div className="header-cell"><span className="desktop-only">ASSISTS</span><span className="mobile-only">A</span></div>
                    <div className="header-cell"><span className="desktop-only">REVIVES</span><span className="mobile-only">R</span></div>
                    <div className="header-cell"><span className="desktop-only">DAMAGE</span><span className="mobile-only">DMG</span></div>
                    <div className="header-cell"><span className="desktop-only">CAPTURES</span><span className="mobile-only">CP</span></div>
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

              {/* TEMP MIGRATION BUTTON */}
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm("Renomear 'wrrqvy' para 'DiogoFrancxssco' em TODA a base de dados?")) {
                    alert("A processar... Verifica a consola (F12) para detalhes.");
                    const res = await migratePlayerName('wrrqvy', 'DiogoFrancxssco');
                    alert(res);
                  }
                }}
                style={{ backgroundColor: '#4a4a4a', color: '#aaa', fontSize: '0.8rem', padding: '0 10px', border: '1px solid #666', borderRadius: '4px' }}
              >
                🔄 Fix Names
              </button>

              <button type="submit" className="btn-submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'A guardar...'
                  : (pendingBattles.length > 1 ? 'Guardar & Próximo' : 'Adicionar Batalha')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BattleForm;
