import { useState, useEffect } from 'react';
import { gtaService } from '../services/gtaService';
import { getRivalries, addRivalry, removeRivalry, hasTeamRivalries } from '../utils/rivalries';

export function TeamsManager() {
    const [players, setPlayers] = useState([]);
    const [activeTab, setActiveTab] = useState('rivalries'); // 'rivalries' or 'generator'

    // Generator State
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [generatedTeams, setGeneratedTeams] = useState(null);

    // Rivalries State
    const [rivalries, setRivalries] = useState([]);
    const [newRivalryPlayer1, setNewRivalryPlayer1] = useState('');
    const [newRivalryPlayer2, setNewRivalryPlayer2] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const pData = await gtaService.getPlayers();
        setPlayers(pData);
        setRivalries(getRivalries());
    };

    // --- RIVALRIES LOGIC ---
    const handleAddRivalry = () => {
        if (!newRivalryPlayer1 || !newRivalryPlayer2) {
            alert('Seleciona dois jogadores!');
            return;
        }
        if (newRivalryPlayer1 === newRivalryPlayer2) {
            alert('Um jogador não pode ser rival de si mesmo.');
            return;
        }
        if (addRivalry(newRivalryPlayer1, newRivalryPlayer2)) {
            setRivalries(getRivalries());
            setNewRivalryPlayer1('');
            setNewRivalryPlayer2('');
        } else {
            alert('Essa rivalidade já existe ou é inválida.');
        }
    };

    const handleRemoveRivalry = (p1, p2) => {
        if (removeRivalry(p1, p2)) {
            setRivalries(getRivalries());
        }
    };

    // --- GENERATOR LOGIC ---
    const togglePlayerSelection = (playerName) => {
        if (selectedPlayers.includes(playerName)) {
            setSelectedPlayers(current => current.filter(p => p !== playerName));
            setGeneratedTeams(null);
        } else {
            if (selectedPlayers.length < 8) {
                setSelectedPlayers(current => [...current, playerName]);
                setGeneratedTeams(null);
            } else {
                alert("Máximo de 8 jogadores!");
            }
        }
    };

    const calculatePlayerRank = (player) => {
        const stats = player.stats || { wins: 0, totalPoints: 0, races: 0 };
        const winRate = stats.races > 0 ? (stats.wins / stats.races) : 0;
        const totalPoints = stats.totalPoints || 0;

        // Simple weighted score: Points (70%) + WinRate*100 (30%)
        // Normalized roughly: 1000 points = 1000, 50% WR * 20 = 1000
        return totalPoints + (winRate * 500);
    };

    const generateTeams = () => {
        if (selectedPlayers.length % 2 !== 0 || selectedPlayers.length === 0) {
            alert("Seleciona um número par de jogadores para dividir (ex: 2, 4, 6, 8).");
            return;
        }

        const selectedData = players.filter(p => selectedPlayers.includes(p.name)).map(p => ({
            ...p,
            rank: calculatePlayerRank(p)
        }));

        // Sort by rank descending
        selectedData.sort((a, b) => b.rank - a.rank);

        // Brute force combinations for best balance
        // We want to split selectedData into 2 teams of equal size
        const teamSize = selectedData.length / 2;

        // Helper to generate combinations
        const getCombinations = (arr, k) => {
            const results = [];
            const helper = (start, combo) => {
                if (combo.length === k) {
                    results.push([...combo]);
                    return;
                }
                for (let i = start; i < arr.length; i++) {
                    combo.push(arr[i]);
                    helper(i + 1, combo);
                    combo.pop();
                }
            };
            helper(0, []);
            return results;
        };

        const allCombos = getCombinations(selectedData, teamSize);

        let bestTeam1 = [];
        let minDiff = Infinity;
        let minConflicts = Infinity;

        const totalScore = selectedData.reduce((acc, p) => acc + p.rank, 0);
        const targetScore = totalScore / 2;

        allCombos.forEach(team1 => {
            const team1Ids = new Set(team1.map(p => p.id));
            const team2 = selectedData.filter(p => !team1Ids.has(p.id));

            let conflicts = 0;
            if (hasTeamRivalries(team1)) conflicts++;
            if (hasTeamRivalries(team2)) conflicts++;

            const t1Score = team1.reduce((acc, p) => acc + p.rank, 0);
            const diff = Math.abs(t1Score - targetScore);

            if (conflicts < minConflicts) {
                minConflicts = conflicts;
                minDiff = diff;
                bestTeam1 = team1;
            } else if (conflicts === minConflicts) {
                if (diff < minDiff) {
                    minDiff = diff;
                    bestTeam1 = team1;
                }
            }
        });

        const finalTeam1 = bestTeam1;
        const finalTeam1Ids = new Set(finalTeam1.map(p => p.id));
        const finalTeam2 = selectedData.filter(p => !finalTeam1Ids.has(p.id));

        const t1Score = finalTeam1.reduce((acc, p) => acc + p.rank, 0);
        const t2Score = finalTeam2.reduce((acc, p) => acc + p.rank, 0);

        setGeneratedTeams({
            team1: finalTeam1,
            team2: finalTeam2,
            team1Score: t1Score.toFixed(0),
            team2Score: t2Score.toFixed(0),
            diff: Math.abs(t1Score - t2Score).toFixed(0),
            conflicts: minConflicts
        });
    };

    return (
        <div className="teams-manager-container" style={{ color: 'white' }}>
            {/* Tabs */}
            <div className="gta-hero-buttons" style={{ marginBottom: '2rem', justifyContent: 'center' }}>
                <button
                    className={`gta-btn ${activeTab === 'rivalries' ? 'gta-btn-primary' : ''}`}
                    onClick={() => setActiveTab('rivalries')}
                    style={{ border: '1px solid var(--gta-border)', background: activeTab !== 'rivalries' ? 'transparent' : undefined }}
                >
                    ⚔️ RIVALIDADES
                </button>
                <button
                    className={`gta-btn ${activeTab === 'generator' ? 'gta-btn-primary' : ''}`}
                    onClick={() => setActiveTab('generator')}
                    style={{ border: '1px solid var(--gta-border)', background: activeTab !== 'generator' ? 'transparent' : undefined }}
                >
                    ⚖️ CRIAR EQUIPAS
                </button>
            </div>

            {/* RIVALRIES TAB */}
            {activeTab === 'rivalries' && (
                <div className="rivalries-section">
                    <div className="gta-feature-card" style={{ marginBottom: '2rem', cursor: 'default', textAlign: 'left' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Adicionar Rivalidade</h3>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <select
                                className="gta-input"
                                value={newRivalryPlayer1}
                                onChange={e => setNewRivalryPlayer1(e.target.value)}
                                style={{ flex: 1 }}
                            >
                                <option value="">Jogador 1</option>
                                {players.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            </select>

                            <span style={{ color: 'var(--gta-accent)', fontSize: '1.5rem', fontWeight: 'bold' }}>X</span>

                            <select
                                className="gta-input"
                                value={newRivalryPlayer2}
                                onChange={e => setNewRivalryPlayer2(e.target.value)}
                                style={{ flex: 1 }}
                            >
                                <option value="">Jogador 2</option>
                                {players.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            </select>

                            <button className="gta-btn gta-btn-primary" onClick={handleAddRivalry}>
                                ADICIONAR
                            </button>
                        </div>
                    </div>

                    <div className="gta-lists-grid">
                        {rivalries.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#666' }}>Sem rivalidades registradas.</p>
                        ) : (
                            rivalries.map((rivalry, idx) => (
                                <div key={idx} className="team-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span className="player-tag" style={{ borderColor: 'var(--gta-accent-tertiary)', background: 'rgba(255, 107, 0, 0.1)' }}>{rivalry[0]}</span>
                                        <span style={{ margin: '0 1rem', color: '#666' }}>recusa-se a jogar com</span>
                                        <span className="player-tag" style={{ borderColor: 'var(--gta-accent-tertiary)', background: 'rgba(255, 107, 0, 0.1)' }}>{rivalry[1]}</span>
                                    </div>
                                    <button
                                        className="gta-close-btn"
                                        style={{ fontSize: '1.5rem' }}
                                        onClick={() => handleRemoveRivalry(rivalry[0], rivalry[1])}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* GENERATOR TAB */}
            {activeTab === 'generator' && (
                <div className="generator-section">
                    <div className="gta-feature-card" style={{ marginBottom: '2rem', cursor: 'default' }}>
                        <h3>Seleção de Jogadores ({selectedPlayers.length})</h3>
                        <p style={{ color: '#888', marginBottom: '1rem' }}>Seleciona um número par de jogadores para dividir.</p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                            {players.map(player => {
                                const isSelected = selectedPlayers.includes(player.name);
                                return (
                                    <button
                                        key={player.id}
                                        onClick={() => togglePlayerSelection(player.name)}
                                        style={{
                                            background: isSelected ? 'var(--gta-accent)' : 'rgba(0,0,0,0.3)',
                                            color: isSelected ? 'black' : 'var(--gta-text-primary)',
                                            border: `1px solid ${isSelected ? 'var(--gta-accent)' : 'var(--gta-border)'}`,
                                            padding: '0.5rem 1rem',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {player.name}
                                    </button>
                                );
                            })}
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <button
                                className="gta-btn gta-btn-primary"
                                onClick={generateTeams}
                                disabled={selectedPlayers.length === 0}
                            >
                                GERAR EQUIPAS EQUILIBRADAS
                            </button>
                            <button
                                className="gta-btn"
                                onClick={() => { setSelectedPlayers([]); setGeneratedTeams(null); }}
                                style={{ marginLeft: '1rem', background: 'transparent', border: '1px solid #444' }}
                            >
                                LIMPAR
                            </button>
                        </div>
                    </div>

                    {generatedTeams && (
                        <div className="generated-result">
                            {generatedTeams.conflicts > 0 && (
                                <div style={{
                                    background: 'rgba(255, 0, 0, 0.2)',
                                    border: '1px solid red',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    marginBottom: '1rem',
                                    textAlign: 'center'
                                }}>
                                    ⚠️ Atenção: {generatedTeams.conflicts} conflito(s) de rivalidade encontrados nestas equipas!
                                </div>
                            )}

                            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                <span style={{ color: '#888' }}>Diferença de "Skill": </span>
                                <span style={{ color: 'var(--gta-accent)', fontWeight: 'bold' }}>{generatedTeams.diff} pontos</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                {/* Team 1 */}
                                <div className="gta-feature-card" style={{ cursor: 'default', borderColor: 'var(--gta-accent)' }}>
                                    <h3 style={{ color: 'var(--gta-accent)' }}>EQUIPA 1</h3>
                                    <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>Score: {generatedTeams.team1Score}</div>
                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                        {generatedTeams.team1.map(p => (
                                            <li key={p.id} style={{ padding: '0.5rem', borderBottom: '1px solid #333' }}>
                                                {p.name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Team 2 */}
                                <div className="gta-feature-card" style={{ cursor: 'default', borderColor: 'var(--gta-accent-secondary)' }}>
                                    <h3 style={{ color: 'var(--gta-accent-secondary)' }}>EQUIPA 2</h3>
                                    <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>Score: {generatedTeams.team2Score}</div>
                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                        {generatedTeams.team2.map(p => (
                                            <li key={p.id} style={{ padding: '0.5rem', borderBottom: '1px solid #333' }}>
                                                {p.name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
