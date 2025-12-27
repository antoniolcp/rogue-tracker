import { useState, useEffect } from 'react';
import { gtaService } from '../services/gtaService';
import { teamsRef, racesRef, getDocs } from '../services/firebase';

export function GlobalRanking() {
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState({});
    const [teamRankings, setTeamRankings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('total'); // 'total' | 'ppr' | 'teams'

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [playersData, teamsSnap, racesSnap] = await Promise.all([
                gtaService.getPlayers(),
                getDocs(teamsRef),
                getDocs(racesRef)
            ]);

            const teamsMap = {};
            teamsSnap.docs.forEach(doc => {
                teamsMap[doc.id] = doc.data();
            });
            setTeams(teamsMap);

            // Calculate Playlist Wins for Individuals & Teams
            const playlistWinsMap = {}; // playerId -> count

            // Group races by playlist
            const playlists = {};
            racesSnap.docs.forEach(doc => {
                const race = doc.data();
                if (!playlists[race.playlistId]) playlists[race.playlistId] = [];
                playlists[race.playlistId].push(race);
            });

            // Determine winner for each playlist
            Object.values(playlists).forEach(playlistRaces => {
                const scores = {}; // playerId -> totalScore

                playlistRaces.forEach(race => {
                    race.results.forEach(res => {
                        scores[res.playerId] = (scores[res.playerId] || 0) + (Number(res.points) || 0);
                    });
                });

                // Find max score
                let winnerId = null;
                let maxScore = -1;
                Object.entries(scores).forEach(([pid, score]) => {
                    if (score > maxScore) {
                        maxScore = score;
                        winnerId = pid;
                    }
                });

                if (winnerId) {
                    playlistWinsMap[winnerId] = (playlistWinsMap[winnerId] || 0) + 1;
                }
            });

            // Enhance players with PPR and Championship Wins
            const enhancedPlayers = playersData.map(p => {
                const stats = p.stats || { totalPoints: 0, races: 0, wins: 0 };
                const ppr = stats.races > 0 ? (stats.totalPoints / stats.races) : 0;
                const championships = playlistWinsMap[p.id] || 0;
                return { ...p, stats, ppr, championships };
            });

            setPlayers(enhancedPlayers);

            // Process Team Rankings (Playlist Wins & PPR)
            processTeamRankings(racesSnap.docs.map(d => d.data()), teamsMap, enhancedPlayers);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const processTeamRankings = (races, teamsMap, playersData) => {
        // Initialize player stats map
        const playerTeamStats = {};
        playersData.forEach(p => {
            playerTeamStats[p.id] = {
                id: p.id,
                name: p.name,
                teamChampionships: 0,
                teamWins: 0,
                teamPoints: 0,
                teamRaces: 0
            };
        });

        const getStat = (pid) => {
            if (!playerTeamStats[pid]) {
                playerTeamStats[pid] = { id: pid, name: 'Unknown', teamChampionships: 0, teamWins: 0, teamPoints: 0, teamRaces: 0 };
            }
            return playerTeamStats[pid];
        };

        // 1. Process Races
        const playlists = {};
        races.forEach(race => {
            if (!playlists[race.playlistId]) playlists[race.playlistId] = [];
            playlists[race.playlistId].push(race);

            const teamRaceScores = {};
            race.results.forEach(res => {
                const color = res.teamColor || '#default';
                if (!teamRaceScores[color]) teamRaceScores[color] = { points: 0, playerIds: [] };

                const pts = Number(res.points) || 0;
                teamRaceScores[color].points += pts;
                if (res.playerId) teamRaceScores[color].playerIds.push(res.playerId);
            });

            let winnerColor = null;
            let maxScore = -1;
            Object.entries(teamRaceScores).forEach(([color, data]) => {
                if (data.points > maxScore) {
                    maxScore = data.points;
                    winnerColor = color;
                }
            });

            Object.entries(teamRaceScores).forEach(([color, data]) => {
                data.playerIds.forEach(pid => {
                    const pStat = getStat(pid);
                    pStat.teamPoints += data.points;
                    pStat.teamRaces += 1;
                    if (winnerColor && color === winnerColor) {
                        pStat.teamWins += 1;
                    }
                });
            });
        });

        // 2. Process Playlists
        Object.values(playlists).forEach(playlistRaces => {
            const playlistTeamScores = {};

            playlistRaces.forEach(race => {
                race.results.forEach(res => {
                    const color = res.teamColor || '#default';
                    if (!playlistTeamScores[color]) {
                        playlistTeamScores[color] = { points: 0, playerIds: new Set() };
                    }
                    playlistTeamScores[color].points += (Number(res.points) || 0);
                    if (res.playerId) playlistTeamScores[color].playerIds.add(res.playerId);
                });
            });

            let winnerColor = null;
            let maxScore = -1;
            Object.entries(playlistTeamScores).forEach(([color, data]) => {
                if (data.points > maxScore) {
                    maxScore = data.points;
                    winnerColor = color;
                }
            });

            if (winnerColor && playlistTeamScores[winnerColor]) {
                playlistTeamScores[winnerColor].playerIds.forEach(pid => {
                    const pStat = getStat(pid);
                    pStat.teamChampionships += 1;
                });
            }
        });

        // 3. Sort and Set
        const rankedPlayers = Object.values(playerTeamStats)
            .filter(p => p.teamRaces > 0)
            .map(p => ({
                ...p,
                ppr: p.teamRaces > 0 ? (p.teamPoints / p.teamRaces) : 0
            }));

        rankedPlayers.sort((a, b) => {
            if (b.teamChampionships !== a.teamChampionships) return b.teamChampionships - a.teamChampionships;
            if (b.teamWins !== a.teamWins) return b.teamWins - a.teamWins;
            return b.ppr - a.ppr;
        });

        setTeamRankings(rankedPlayers);
    };

    const getSortedPlayers = () => {
        const list = [...players];
        if (activeTab === 'total') {
            return list.sort((a, b) => {
                if (b.stats.totalPoints !== a.stats.totalPoints) return b.stats.totalPoints - a.stats.totalPoints;
                return b.championships - a.championships;
            });
        } else if (activeTab === 'ppr') {
            return list.sort((a, b) => b.ppr - a.ppr);
        }
        return list;
    };

    const sortedPlayers = getSortedPlayers();

    if (loading) return <div>Carregando ranking...</div>;

    return (
        <div className="global-ranking">
            <div className="ranking-header">
                <h2>RANKING GLOBAL</h2>

                <div className="gta-hero-buttons" style={{ justifyContent: 'flex-start', gap: '0.8rem', flexWrap: 'wrap' }}>
                    <button
                        className={`gta-btn ${activeTab === 'total' ? 'gta-btn-primary' : ''}`}
                        onClick={() => setActiveTab('total')}
                        style={{
                            fontSize: '0.85rem',
                            padding: '0.5rem 1rem',
                            border: '1px solid var(--gta-border)',
                            background: activeTab !== 'total' ? 'transparent' : undefined,
                            color: activeTab !== 'total' ? 'white' : 'black'
                        }}
                    >
                        TOTAL
                    </button>
                    <button
                        className={`gta-btn ${activeTab === 'ppr' ? 'gta-btn-primary' : ''}`}
                        onClick={() => setActiveTab('ppr')}
                        style={{
                            fontSize: '0.85rem',
                            padding: '0.5rem 1rem',
                            border: '1px solid var(--gta-border)',
                            background: activeTab !== 'ppr' ? 'transparent' : undefined,
                            color: activeTab !== 'ppr' ? 'white' : 'black'
                        }}
                    >
                        PPR
                    </button>
                    <button
                        className={`gta-btn ${activeTab === 'teams' ? 'gta-btn-primary' : ''}`}
                        onClick={() => setActiveTab('teams')}
                        style={{
                            fontSize: '0.85rem',
                            padding: '0.5rem 1rem',
                            border: '1px solid var(--gta-border)',
                            background: activeTab !== 'teams' ? 'transparent' : undefined,
                            color: activeTab !== 'teams' ? 'white' : 'black'
                        }}
                    >
                        EQUIPAS
                    </button>
                </div>

                <div className="ranking-stats-summary">
                    <div className="stat-box">
                        <span>{activeTab === 'teams' ? 'EQUIPAS' : 'PILOTOS'}</span>
                        <strong>{activeTab === 'teams' ? teamRankings.length : players.length}</strong>
                    </div>
                    <div className="stat-box">
                        <span>LÍDER</span>
                        <strong>
                            {activeTab === 'teams'
                                ? (teamRankings[0]?.name || '-')
                                : (sortedPlayers[0]?.name || '-')}
                        </strong>
                    </div>
                </div>
            </div>

            <div className="gta-card ranking-table-card">
                <table className="gta-table">
                    <thead>
                        {activeTab === 'teams' ? (
                            <tr>
                                <th>POS</th>
                                <th><span className="desktop-only">PILOTO (EQUIPA)</span><span className="mobile-only">PILOTO</span></th>
                                <th className="text-center"><span className="desktop-only">CAMPEONATOS</span><span className="mobile-only">CMP</span></th>
                                <th className="text-center"><span className="desktop-only">CORRIDAS</span><span className="mobile-only">COR</span></th>
                                <th className="text-center"><span className="desktop-only">VITÓRIAS</span><span className="mobile-only">VIT</span></th>
                                <th className="text-right">TOTAL</th>
                                <th className="text-right"><span className="desktop-only">PPR (EQUIPA)</span><span className="mobile-only">PPR</span></th>
                            </tr>
                        ) : (
                            <tr>
                                <th>POS</th>
                                <th>PILOTO</th>
                                <th className="text-center"><span className="desktop-only">CAMPEONATOS</span><span className="mobile-only">CMP</span></th>
                                <th className="text-center"><span className="desktop-only">CORRIDAS</span><span className="mobile-only">COR</span></th>
                                <th className="text-center"><span className="desktop-only">VITÓRIAS</span><span className="mobile-only">VIT</span></th>
                                <th className="text-right" style={{ color: activeTab === 'total' ? 'var(--gta-accent)' : 'white' }}>TOTAL</th>
                                <th className="text-right" style={{ color: activeTab === 'ppr' ? 'var(--gta-accent)' : 'white' }}><span className="desktop-only">MÉDIA (PPR)</span><span className="mobile-only">PPR</span></th>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {activeTab === 'teams' ? (
                            teamRankings.map((p, index) => (
                                <tr key={index} className={index < 3 ? `top-${index + 1}` : ''} style={{ borderLeft: index < 3 ? `4px solid var(--gta-accent)` : '4px solid #444' }}>
                                    <td className="rank-pos" data-label="POS">{index + 1}</td>
                                    <td className="pilot-name" data-label="PILOTO">
                                        <span style={{ color: 'white', fontWeight: 'bold' }}>
                                            {p.name}
                                        </span>
                                        {index === 0 && ' 👑'}
                                    </td>
                                    <td className="text-center" data-label="CAMPEONATOS" style={{ color: p.teamChampionships > 0 ? 'var(--gta-accent)' : 'inherit', fontWeight: p.teamChampionships > 0 ? 'bold' : 'normal' }}>
                                        {p.teamChampionships}
                                    </td>
                                    <td className="text-center" data-label="CORRIDAS">{p.teamRaces}</td>
                                    <td className="text-center" data-label="VITÓRIAS">{p.teamWins}</td>
                                    <td className="text-right" data-label="TOTAL" style={{ fontWeight: 'bold', color: 'var(--gta-accent)' }}>{p.teamPoints}</td>
                                    <td className="text-right" data-label="PPR" style={{ fontFamily: 'monospace' }}>{p.ppr.toFixed(2)}</td>
                                </tr>
                            ))
                        ) : (
                            sortedPlayers.map((p, index) => (
                                <tr key={p.id} className={index < 3 ? `top-${index + 1}` : ''}>
                                    <td className="rank-pos" data-label="POS">{index + 1}</td>
                                    <td className="pilot-name" data-label="PILOTO">
                                        {p.name} {index === 0 && '👑'}
                                    </td>
                                    <td className="text-center" data-label="CAMPEONATOS" style={{ color: p.championships > 0 ? 'var(--gta-accent)' : '#666', fontWeight: p.championships > 0 ? 'bold' : 'normal' }}>
                                        {p.championships}
                                    </td>
                                    <td className="text-center" data-label="RACES">{p.stats.races}</td>
                                    <td className="text-center" data-label="WINS">{p.stats.wins}</td>
                                    <td className="text-right points-cell" data-label="TOTAL" style={{ fontWeight: activeTab === 'total' ? 'bold' : 'normal', color: activeTab === 'total' ? 'var(--gta-accent)' : 'white' }}>
                                        {p.stats.totalPoints}
                                    </td>
                                    <td className="text-right" data-label="PPR" style={{ fontWeight: activeTab === 'ppr' ? 'bold' : 'normal', color: activeTab === 'ppr' ? 'var(--gta-accent)' : 'white' }}>
                                        {p.ppr.toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
