import { useState, useEffect } from 'react';
import { racesRef, query, where, getDocs } from '../services/firebase';
import '../../rogue-tracker/components/GameList.css';

export function PlaylistDetail({ playlist, onBack }) {
    const [races, setRaces] = useState([]);
    const [playerStats, setPlayerStats] = useState([]);
    const [mvp, setMvp] = useState(null);

    const [activeTab, setActiveTab] = useState('individual'); // 'individual' | 'teams'

    useEffect(() => {
        loadRaces();
    }, [playlist.id]);

    async function loadRaces() {
        // Fetch races for this playlist
        const q = query(racesRef, where("playlistId", "==", playlist.id));
        const snapshot = await getDocs(q);
        const racesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort races by name (Corrida 1, 2...) or creation time
        // Using string sort on mapName "Corrida X" works partially, but "Corrida 10" < "Corrida 2". 
        // Ideally we rely on creation time.
        racesData.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);

        setRaces(racesData);
        processStats(racesData);
    }

    function processStats(racesList) {
        const statsMap = {}; // playerId -> { name, races: { raceIdx: points }, total: 0 }

        // Initialize based on race results
        racesList.forEach((race, rIdx) => {
            race.results.forEach(res => {
                if (!statsMap[res.playerId]) {
                    statsMap[res.playerId] = {
                        id: res.playerId,
                        name: res.playerName || 'Unknown',
                        teamColor: res.teamColor, // Extract team color
                        races: {},
                        total: 0
                    };
                }
                // Update color if not set (fallback)
                if (!statsMap[res.playerId].teamColor && res.teamColor) {
                    statsMap[res.playerId].teamColor = res.teamColor;
                }

                const pts = Number(res.points) || 0;
                // Ensure we're using the correct points value
                if (isNaN(pts)) {
                    console.warn(`Invalid points for player ${res.playerName} in race ${rIdx}:`, res.points);
                }
                statsMap[res.playerId].races[rIdx] = pts;
                statsMap[res.playerId].total += pts;
            });
        });

        // Convert to array and sort by total descending
        const sortedPlayers = Object.values(statsMap).sort((a, b) => b.total - a.total);

        setPlayerStats(sortedPlayers);
        if (sortedPlayers.length > 0) {
            setMvp(sortedPlayers[0]);
        }
    }

    // Process Team Stats
    const getTeamStats = () => {
        const teamMap = {}; // "color|teamName" -> { color, names: [], races: { raceIdx: points }, total: 0 }

        playerStats.forEach(p => {
            // If no team color, treat as individual team (or skip? user said "players of same team")
            // We use color as ID.
            const color = p.teamColor || '#default';
            // If white or common default, might be tricky if intended as "no team" but user said manually assign color for team

            if (!teamMap[color]) {
                teamMap[color] = {
                    color: p.teamColor, // preserve original null if so
                    players: [],
                    races: {},
                    total: 0
                };
            }

            teamMap[color].players.push(p.name);
            teamMap[color].total += p.total;

            // Sum per race
            // We need to iterate over all possible races (from races state)
            races.forEach((_, rIdx) => {
                const pPoints = p.races[rIdx] || 0;
                teamMap[color].races[rIdx] = (teamMap[color].races[rIdx] || 0) + pPoints;
            });
        });

        // Convert to array and sort
        return Object.values(teamMap).sort((a, b) => b.total - a.total);
    };

    const teamStats = getTeamStats();



    return (
        <div className="game-detail" style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
            {/* Header */}
            <div className="detail-header">
                <button onClick={onBack} className="back-btn">← VOLTAR</button>
                <h3>{playlist.name}</h3>
                <div></div> {/* Spacer to balance flex if needed */}
            </div>

            {/* MVP Section */}
            {activeTab === 'individual' && mvp && (
                <div className="mvp-section" style={{ borderColor: mvp.teamColor || 'var(--gta-accent)' }}>
                    <div className="mvp-header">
                        <span className="mvp-icon">🏆</span>
                        <span className="mvp-label">VENCEDOR DO CAMPEONATO</span>
                    </div>
                    <div className="mvp-player">
                        <div className="mvp-info">
                            <div className="mvp-avatar">
                                <div className="avatar-circle mvp-avatar-circle" style={{ background: mvp.teamColor || 'var(--gta-accent)' }}>
                                    {mvp.name.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="mvp-details">
                                <div className="mvp-name" style={{ color: mvp.teamColor || 'var(--gta-accent)' }}>{mvp.name}</div>
                                <div className="mvp-operator">{mvp.total} PONTOS</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'teams' && teamStats.length > 0 && (
                <div className="mvp-section" style={{
                    borderColor: teamStats[0].color || 'var(--gta-accent)',
                    background: `linear-gradient(135deg, ${teamStats[0].color}22 0%, rgba(20,20,20,0.8) 100%)`
                }}>
                    <div className="mvp-header">
                        <span className="mvp-icon">🏆</span>
                        <span className="mvp-label">VENCEDORES DO CAMPEONATO</span>
                    </div>
                    <div className="mvp-player">
                        <div className="mvp-info">
                            <div className="mvp-avatar">
                                <div className="avatar-circle mvp-avatar-circle" style={{ background: teamStats[0].color || 'var(--gta-accent)' }}>
                                    T
                                </div>
                            </div>
                            <div className="mvp-details">
                                <div className="mvp-name" style={{ color: teamStats[0].color || 'var(--gta-accent)', fontSize: '1.5rem' }}>
                                    {teamStats[0].players.join(' & ')}
                                </div>
                                <div className="mvp-operator">{teamStats[0].total} PONTOS</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Tabs */}
            <div className="gta-hero-buttons" style={{ marginBottom: '1.5rem', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
                <button
                    className={`gta-btn ${activeTab === 'individual' ? 'gta-btn-primary' : ''}`}
                    onClick={() => setActiveTab('individual')}
                    style={{
                        fontSize: '1rem',
                        padding: '0.5rem 1.5rem',
                        border: '1px solid var(--gta-border)',
                        background: activeTab !== 'individual' ? 'transparent' : undefined,
                        color: activeTab !== 'individual' ? 'white' : 'black'
                    }}
                >
                    INDIVIDUAL
                </button>
                <button
                    className={`gta-btn ${activeTab === 'teams' ? 'gta-btn-primary' : ''}`}
                    onClick={() => setActiveTab('teams')}
                    style={{
                        fontSize: '1rem',
                        padding: '0.5rem 1.5rem',
                        border: '1px solid var(--gta-border)',
                        background: activeTab !== 'teams' ? 'transparent' : undefined,
                        color: activeTab !== 'teams' ? 'white' : 'black'
                    }}
                >
                    EQUIPAS
                </button>
            </div>

            {/* Standings Table */}
            <div className="game-details">
                <div className="team-section team1">
                    <div className="team-header">
                        <div className="team-number">#</div>
                        <div className="team-label">{activeTab === 'individual' ? 'CLASSIFICAÇÃO INDIVIDUAL' : 'CLASSIFICAÇÃO POR EQUIPAS'}</div>
                    </div>

                    <div className="team-players">
                        {/* INDIVIDUAL TABLE */}
                        {activeTab === 'individual' && playerStats.map((p, i) => {
                            const isMVP = i === 0;
                            return (
                                <div
                                    key={p.id}
                                    className={`player-row ${isMVP ? 'mvp-player' : ''}`}
                                    style={{
                                        borderLeft: p.teamColor ? `4px solid ${p.teamColor}` : '4px solid transparent',
                                        background: p.teamColor ? `linear-gradient(90deg, ${p.teamColor}22 0%, rgba(20,20,20,0) 100%)` : ''
                                    }}
                                >
                                    <div className="player-avatar">
                                        <div
                                            className={`avatar-circle ${isMVP ? 'mvp-avatar-circle' : ''}`}
                                            style={{
                                                background: p.teamColor || (isMVP ? 'var(--gta-accent)' : '#333'),
                                                color: p.teamColor ? (['#ffffff', '#ffb800'].includes(p.teamColor) ? '#000' : '#fff') : '#fff'
                                            }}
                                        >
                                            <span style={{ fontSize: '0.9rem' }}>{i + 1}º</span>
                                        </div>
                                    </div>
                                    <div className="player-info">
                                        <div
                                            className={`player-name ${isMVP ? 'mvp-name' : ''}`}
                                            style={{ color: p.teamColor || 'inherit' }}
                                        >
                                            {p.name}
                                        </div>
                                    </div>
                                    <div className="player-stats">
                                        {/* Per Race Points */}
                                        {races.map((_, rIdx) => (
                                            <div key={rIdx} className="stat-item">
                                                <span className="stat-label">C{rIdx + 1}</span>
                                                <span className="stat-value" style={{ fontSize: '0.9rem' }}>
                                                    {p.races[rIdx] !== undefined ? p.races[rIdx] : '-'}
                                                </span>
                                            </div>
                                        ))}

                                        {/* Total */}
                                        <div className="stat-item">
                                            <span className="stat-label" style={{ color: p.teamColor || 'var(--gta-accent)' }}>TOTAL</span>
                                            <span
                                                className="stat-value"
                                                style={{
                                                    color: p.teamColor || (isMVP ? '#000' : 'var(--gta-accent)'),
                                                    fontSize: '1.2rem',
                                                    fontWeight: '900'
                                                }}
                                            >
                                                {p.total}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* TEAMS TABLE */}
                        {activeTab === 'teams' && teamStats.map((team, i) => {
                            const isWinner = i === 0;
                            return (
                                <div
                                    key={i}
                                    className={`player-row ${isWinner ? 'mvp-player' : ''}`}
                                    style={{
                                        borderLeft: team.color ? `4px solid ${team.color}` : '4px solid transparent',
                                        background: team.color ? `linear-gradient(90deg, ${team.color}22 0%, rgba(20,20,20,0) 100%)` : ''
                                    }}
                                >
                                    <div className="player-avatar">
                                        <div
                                            className="avatar-circle"
                                            style={{
                                                background: team.color || '#333',
                                                color: team.color ? (['#ffffff', '#ffb800'].includes(team.color) ? '#000' : '#fff') : '#fff'
                                            }}
                                        >
                                            <span style={{ fontSize: '0.9rem' }}>{i + 1}º</span>
                                        </div>
                                    </div>
                                    <div className="player-info">
                                        <div
                                            className="player-name"
                                            style={{ color: team.color || 'inherit', fontSize: '1.1rem' }}
                                        >
                                            {team.players.join(' & ')}
                                        </div>
                                    </div>
                                    <div className="player-stats">
                                        {/* Per Race Points (Summed) */}
                                        {races.map((_, rIdx) => (
                                            <div key={rIdx} className="stat-item">
                                                <span className="stat-label">C{rIdx + 1}</span>
                                                <span className="stat-value" style={{ fontSize: '0.9rem' }}>
                                                    {team.races[rIdx] || 0}
                                                </span>
                                            </div>
                                        ))}

                                        {/* Total */}
                                        <div className="stat-item">
                                            <span className="stat-label" style={{ color: team.color || 'var(--gta-accent)' }}>TOTAL</span>
                                            <span
                                                className="stat-value"
                                                style={{
                                                    color: team.color || 'var(--gta-accent)',
                                                    fontSize: '1.2rem',
                                                    fontWeight: '900'
                                                }}
                                            >
                                                {team.total}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
