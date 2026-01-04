import { useState, useEffect } from 'react';
import { gtaService } from '../services/gtaService';
import { playersRef, getDocs } from '../services/firebase';
import pendingRaces from '../data/pending_races.json';
import '../gta_race_input.css';

export function RaceInput({ onRaceAdded, onCancel }) {
    const [availablePlayers, setAvailablePlayers] = useState([]);

    // Predefined colors for teams
    const TEAM_COLORS = [
        { label: 'Roxo', value: '#a855f7' },
        { label: 'Preto', value: '#000000' },
        { label: 'Branco', value: '#ffffff' },
        { label: 'Amarelo', value: '#ffb800' },
        { label: 'Vermelho', value: '#ef4444' },
        { label: 'Laranja', value: '#ff6b00' },
        { label: 'Castanho', value: '#78350f' },
        { label: 'Azul', value: '#3b82f6' }
    ];

    // Grid Data: Rows = Players, Cols = Races
    // Example: [{ playerId: '...', name: 'Player', races: [15, 10, 5], total: 30 }]
    const [gridData, setGridData] = useState([]);
    const [numRaces, setNumRaces] = useState(3); // Default detected or customizable
    const [championshipName, setChampionshipName] = useState(''); // Nome do campeonato

    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadPlayers();
    }, []);

    async function loadPlayers() {
        const snap = await getDocs(playersRef);
        setAvailablePlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }

    // Mock function to simulate OCR result of a table
    // In real scenario, this would parse the image
    const simulateOCR = () => {
        setIsProcessing(true);
        setTimeout(() => {
            try {
                // Data extracted from the user's screenshot (3 races)
                const detectedRaces = 3;
                setNumRaces(detectedRaces);

                const mockResults = [
                    { name: "zManin-xZ", races: [15, 16, 13] },
                    { name: "xClassicMurder", races: [16, 15, 12] },
                    { name: "xCartierIV_", races: [12, 13, 16] },
                    { name: "EatMyOneShoot_", races: [13, 12, 15] },
                    { name: "Ambitionz--17", races: [12, 12, 15] }
                ];

                // Match with available players safe check
                const rounds = mockResults.map(r => {
                    const player = availablePlayers.find(p => p.name && p.name.toLowerCase().includes(r.name.toLowerCase()))
                        || { id: null, name: r.name }; // Fallback if not found

                    return {
                        playerId: player.id,
                        playerName: player.name,
                        races: r.races,
                        total: r.races.reduce((a, b) => a + b, 0)
                    };
                });

                setGridData(rounds);
            } catch (err) {
                console.error("OCR Simulation Error:", err);
                alert("Erro ao processar imagem: " + err.message);
            } finally {
                setIsProcessing(false);
            }
        }, 1500);
    };

    const handleImageUpload = (e) => {
        if (e.target.files[0]) {
            simulateOCR();
        }
    };

    const loadFromJSON = () => {
        setIsProcessing(true);
        try {
            const data = pendingRaces;
            if (!data || data.length === 0) {
                alert("Nenhum dado encontrado em pending_races.json");
                setIsProcessing(false);
                return;
            }

            processJSONData(data);
        } catch (err) {
            console.error("JSON Load Error:", err);
            alert("Erro ao carregar JSON: " + err.message);
            setIsProcessing(false);
        }
    };

    const handleJSONFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                processJSONData(data);
            } catch (err) {
                console.error("JSON Parse Error:", err);
                alert("Erro ao processar arquivo JSON: " + err.message);
                setIsProcessing(false);
            }
        };
        reader.readAsText(file);
    };

    const processJSONData = (data) => {
        if (!data || data.length === 0) {
            alert("Nenhum dado encontrado no JSON");
            setIsProcessing(false);
            return;
        }

        // Detect number of races from the first player
        const detectedRaces = data[0].races ? data[0].races.length : 0;
        if (detectedRaces === 0) {
            alert("Dados sem corridas detectadas.");
            setIsProcessing(false);
            return;
        }
        setNumRaces(detectedRaces);

        const rounds = data.map(r => {
            // Try to find player by name matching
            const player = availablePlayers.find(p => p.name && p.name.toLowerCase().includes(r.playerName.toLowerCase()))
                || { id: null, name: r.playerName };

            return {
                playerId: player.id,
                playerName: player.name || r.playerName,
                races: r.races,
                color: r.color || '#a855f7',
                total: r.races.reduce((a, b) => a + Number(b), 0)
            };
        });

        setGridData(rounds);
        setIsProcessing(false);
    };

    const handleClearData = () => {
        if (window.confirm("Tens a certeza que queres limpar todos os dados?")) {
            setGridData([]);
            setChampionshipName('');
            setNumRaces(3);
        }
    };

    const handleSaveEvent = async () => {
        if (gridData.length === 0) return;
        setIsSaving(true);

        try {
            // ... (keep existing logic) ...

            // 1. Ensure all players exist
            console.log("Saving event... Checking players...");

            const updatedGridData = [];
            for (const row of gridData) {
                let pid = row.playerId;
                if (!pid) {
                    try {
                        const newDoc = await gtaService.createPlayer(row.playerName);
                        pid = newDoc.id;
                    } catch (e) {
                        throw new Error(`Erro ao criar jogador ${row.playerName}: ${e.message}`);
                    }
                }
                updatedGridData.push({ ...row, playerId: pid });
            }

            // 2. Playlist
            const dateStr = new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            const playlistName = championshipName.trim() || `Campeonato ${dateStr}`;
            const playlistDoc = await gtaService.createPlaylist(playlistName);
            const playlistId = playlistDoc.id;

            // 3. Add Races
            for (let i = 0; i < numRaces; i++) {
                const raceResults = updatedGridData.map(row => {
                    const points = Number(row.races[i]) || 0;
                    return {
                        playerId: row.playerId,
                        playerName: row.playerName,
                        points: points,
                        teamColor: row.color // Extract color from grid row
                    };
                });
                raceResults.sort((a, b) => Number(b.points) - Number(a.points));

                const resultsWithPos = raceResults.map((r, idx) => {
                    const points = Number(r.points) || 0;
                    return {
                        playerId: r.playerId,
                        playerName: r.playerName,
                        points: points,
                        position: idx + 1,
                        teamColor: r.teamColor // Include Color
                    };
                });

                // Debug log for first race
                if (i === 0) {
                    console.log('Saving race data:', resultsWithPos);
                }

                await gtaService.addRace(playlistId, `Corrida ${i + 1}`, resultsWithPos);
            }

            // 4. Update Summary
            let maxPoints = -1;
            let winnerName = "N/A";
            updatedGridData.forEach(row => {
                const total = row.races.reduce((a, b) => Number(a) + Number(b), 0);
                if (total > maxPoints) {
                    maxPoints = total;
                    winnerName = row.playerName;
                }
            });

            await gtaService.updatePlaylist(playlistId, {
                raceCount: numRaces,
                winner: winnerName
            });

            alert("Campeonato salvo com sucesso!");
            onRaceAdded();

        } catch (error) {
            console.error("Error saving event:", error);
            alert(`Erro ao salvar evento: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="event-importer">

            {!gridData.length ? (
                <div className="upload-placeholder">
                    <label className="gta-btn gta-btn-primary upload-btn">
                        {isProcessing ? "PROCESSANDO..." : "📸 CARREGAR FOTO"}
                        <input type="file" onChange={handleImageUpload} hidden accept="image/*" />
                    </label>
                    <label className="gta-btn" style={{ marginTop: '1rem', display: 'block', cursor: 'pointer' }}>
                        📄 CARREGAR ARQUIVO JSON
                        <input type="file" onChange={handleJSONFileUpload} hidden accept=".json" />
                    </label>
                    <button className="gta-btn" onClick={loadFromJSON} style={{ marginTop: '1rem' }}>
                        📥 CARREGAR DADOS PENDENTES (pending_races.json)
                    </button>
                </div>
            ) : (
                <div className="preview-table-container">
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff', fontSize: '0.9rem' }}>
                            Nome do Campeonato:
                        </label>
                        <input
                            type="text"
                            value={championshipName}
                            onChange={(e) => setChampionshipName(e.target.value)}
                            placeholder="Ex: Jamais, Temporada 2025, etc."
                            className="gta-input-clean"
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                fontSize: '1rem',
                                background: 'rgba(0,0,0,0.5)',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                color: '#fff'
                            }}
                        />
                    </div>
                    <h3>Resultados Detectados</h3>
                    <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        💡 Podes editar os pontos diretamente na tabela. O total é calculado automaticamente.
                    </p>
                    <div className="table-wrapper">
                        <table className="gta-table detection-table">
                            <thead>
                                <tr>
                                    <th>Jogador</th>
                                    <th className="text-center" style={{ width: '80px' }}>COR</th>
                                    {Array.from({ length: numRaces }).map((_, i) => (
                                        <th key={i} className="text-center">C{i + 1}</th>
                                    ))}
                                    <th className="text-center">TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gridData.map((row, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <input
                                                className="gta-input-clean"
                                                value={row.playerName}
                                                readOnly // For now
                                            />
                                        </td>
                                        <td className="text-center">
                                            <select
                                                value={row.color || "#a855f7"}
                                                onChange={(e) => {
                                                    const newData = [...gridData];
                                                    newData[idx].color = e.target.value;
                                                    setGridData(newData);
                                                }}
                                                className="gta-input-clean"
                                                style={{
                                                    background: 'rgba(0,0,0,0.5)',
                                                    color: row.color === '#ffffff' || row.color === '#ffb800' ? 'black' : 'white',
                                                    backgroundColor: row.color || 'transparent',
                                                    border: '1px solid #444',
                                                    borderRadius: '4px',
                                                    padding: '2px',
                                                    fontSize: '0.8rem',
                                                    width: '100%',
                                                    textAlign: 'center',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {TEAM_COLORS.map(c => (
                                                    <option
                                                        key={c.value}
                                                        value={c.value}
                                                        style={{ backgroundColor: c.value, color: c.value === '#ffffff' || c.value === '#ffb800' ? 'black' : 'white' }}
                                                    >
                                                        {c.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        {row.races.map((points, rIdx) => (
                                            <td key={rIdx} className="text-center point-cell">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={points}
                                                    onChange={(e) => {
                                                        const newData = [...gridData];
                                                        const newPoints = parseInt(e.target.value) || 0;
                                                        newData[idx].races[rIdx] = newPoints;
                                                        newData[idx].total = newData[idx].races.reduce((a, b) => Number(a) + Number(b), 0);
                                                        setGridData(newData);
                                                    }}
                                                    className="gta-input-clean"
                                                    style={{
                                                        width: '50px',
                                                        textAlign: 'center',
                                                        background: 'rgba(0,0,0,0.5)',
                                                        border: '1px solid #444',
                                                        borderRadius: '4px',
                                                        padding: '2px',
                                                        fontSize: '0.9rem',
                                                        color: '#fff'
                                                    }}
                                                />
                                            </td>
                                        ))}
                                        <td className="text-center total-cell">
                                            {row.total}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="action-footer">
                        <button className="gta-btn" onClick={handleClearData} disabled={isSaving} style={{ marginRight: 'auto' }}>
                            🗑️ LIMPAR
                        </button>
                        <button className="gta-btn" onClick={onCancel} disabled={isSaving}>CANCELAR</button>
                        <button className="gta-btn gta-btn-primary" onClick={handleSaveEvent} disabled={isSaving}>
                            {isSaving ? "SALVANDO..." : `CONFIRMAR E SALVAR (${numRaces} Corridas)`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
