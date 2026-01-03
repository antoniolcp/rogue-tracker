import { useState, useEffect } from 'react';
import { gtaService } from '../services/gtaService';
import { getRivalries, addRivalry, removeRivalry, hasTeamRivalries } from '../utils/rivalries';

export function TeamsManager() {
    const [players, setPlayers] = useState([]);
    const [activeTab, setActiveTab] = useState('rivalries'); // 'rivalries' or 'generator'

    // Generator State
    const [generatorStep, setGeneratorStep] = useState(1);
    const [numTeams, setNumTeams] = useState(2);
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
            // max limit check? Let's say max 20 players for now to avoid freezing
            if (selectedPlayers.length < 20) {
                setSelectedPlayers(current => [...current, playerName]);
                setGeneratedTeams(null);
            } else {
                alert("Máximo de 20 jogadores por segurança!");
            }
        }
    };

    const calculatePlayerRank = (player) => {
        const stats = player.stats || { wins: 0, totalPoints: 0, races: 0 };
        // PPR = Points / Races
        if (!stats.races || stats.races === 0) return 0;
        return (stats.totalPoints / stats.races);
    };

    const generateTeams = () => {
        if (selectedPlayers.length % numTeams !== 0 || selectedPlayers.length === 0) {
            alert(`Seleciona um número de jogadores divisível por ${numTeams} (ex: ${numTeams}, ${numTeams * 2}, ...).`);
            return;
        }

        const selectedData = players.filter(p => selectedPlayers.includes(p.name)).map(p => ({
            ...p,
            rank: calculatePlayerRank(p)
        }));

        // Sort by rank descending
        selectedData.sort((a, b) => b.rank - a.rank);

        // Partition Logic for N teams
        const teamSize = selectedData.length / numTeams;
        const teams = Array.from({ length: numTeams }, () => []);
        const teamScores = new Array(numTeams).fill(0);

        let bestSolution = null;
        let bestDiff = Infinity;
        let minConflicts = Infinity;

        const totalScore = selectedData.reduce((acc, p) => acc + p.rank, 0);
        const targetScore = totalScore / numTeams;

        const solve = (playerIdx) => {
            if (playerIdx === selectedData.length) {
                let currentDiff = 0;
                let currentConflicts = 0;

                for (let i = 0; i < numTeams; i++) {
                    currentDiff += Math.abs(teamScores[i] - targetScore);
                    if (hasTeamRivalries(teams[i])) currentConflicts++;
                }

                // We prioritize minimizing conflicts, then minimizing score difference
                if (currentConflicts < minConflicts || (currentConflicts === minConflicts && currentDiff < bestDiff)) {
                    minConflicts = currentConflicts;
                    bestDiff = currentDiff;
                    bestSolution = teams.map(t => [...t]);
                }
                return;
            }

            const player = selectedData[playerIdx];

            for (let i = 0; i < numTeams; i++) {
                if (teams[i].length < teamSize) {
                    teams[i].push(player);
                    teamScores[i] += player.rank;

                    solve(playerIdx + 1);

                    teamScores[i] -= player.rank;
                    teams[i].pop();

                    // Optimization: if this bucket is empty, filling it with current player is effectively same as filling next empty bucket
                    // so we can skip next buckets to avoid permutations of empty buckets
                    if (teams[i].length === 0) break;
                }
            }
        };

        solve(0);

        if (bestSolution) {
            setGeneratedTeams({
                teams: bestSolution.map((t, i) => ({
                    id: i + 1,
                    players: t,
                    score: t.reduce((acc, p) => acc + p.rank, 0).toFixed(1)
                })),
                diff: bestDiff.toFixed(1),
                conflicts: minConflicts
            });
        }
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

                    {/* STEP 1: CONFIG */}
                    {generatorStep === 1 && (
                        <div className="gta-feature-card" style={{ marginBottom: '2rem', cursor: 'default' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Raio X da Sessão</h3>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', ccolor: '#ccc' }}>Quantas Equipas?</label>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                    {[2, 3, 4].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setNumTeams(n)}
                                            style={{
                                                padding: '1rem 2rem',
                                                fontSize: '1.5rem',
                                                background: numTeams === n ? 'var(--gta-accent)' : 'rgba(0,0,0,0.5)',
                                                color: numTeams === n ? 'black' : 'white',
                                                border: numTeams === n ? 'none' : '1px solid #444',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                className="gta-btn gta-btn-primary"
                                onClick={() => setGeneratorStep(2)}
                            >
                                PRÓXIMO: SELECIONAR JOGADORES
                            </button>
                        </div>
                    )}

                    {/* STEP 2: PLAYERS */}
                    {generatorStep === 2 && (
                        <>
                            <div className="gta-feature-card" style={{ marginBottom: '2rem', cursor: 'default' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <button
                                        onClick={() => { setGeneratorStep(1); setGeneratedTeams(null); }}
                                        style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}
                                    >
                                        ← Voltar
                                    </button>
                                    <h3>Seleção de Jogadores ({selectedPlayers.length})</h3>
                                    <div style={{ width: '60px' }}></div> {/* Spacer */}
                                </div>

                                <p style={{ color: '#888', marginBottom: '1rem' }}>
                                    Seleciona um múltiplo de <strong style={{ color: 'white' }}>{numTeams}</strong> jogadores.
                                </p>

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
                                        GERAR {numTeams} EQUIPAS
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
                                            ⚠️ Atenção: {generatedTeams.conflicts} conflito(s) de rivalidade encontrados!
                                        </div>
                                    )}

                                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                        <span style={{ color: '#888' }}>Desvio de "Skill" (PPR): </span>
                                        <span style={{ color: 'var(--gta-accent)', fontWeight: 'bold' }}>{generatedTeams.diff}</span>
                                    </div>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: numTeams > 2 ? '1fr 1fr' : '1fr 1fr',
                                        gap: '2rem',
                                        // On mobile this might need to be stack
                                    }}>
                                        {generatedTeams.teams.map((team, idx) => (
                                            <div key={team.id} className="gta-feature-card" style={{
                                                cursor: 'default',
                                                borderColor: idx % 2 === 0 ? 'var(--gta-accent)' : 'var(--gta-accent-secondary)',
                                                gridColumn: (numTeams === 3 && idx === 2) ? '1 / -1' : 'auto' // Center 3rd element if 3 teams
                                            }}>
                                                <h3 style={{ color: idx % 2 === 0 ? 'var(--gta-accent)' : 'var(--gta-accent-secondary)' }}>
                                                    EQUIPA {team.id}
                                                </h3>
                                                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>Total PPR: {team.score}</div>
                                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                                    {team.players.map(p => (
                                                        <li key={p.id} style={{ padding: '0.5rem', borderBottom: '1px solid #333' }}>
                                                            {p.name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
