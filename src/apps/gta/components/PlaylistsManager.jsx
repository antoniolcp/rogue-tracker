import { useState, useEffect } from 'react';
import { gtaService } from '../services/gtaService';
import { PlaylistDetail } from './PlaylistDetail';
import '../../rogue-tracker/components/GameList.css'; // Import Rogue Tracker styles directly

export function PlaylistsManager() {
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadPlaylists();
    }, []);

    async function loadPlaylists() {
        setLoading(true);
        try {
            const data = await gtaService.getPlaylists();
            // Sort by date desc (assuming date is a Firestore Timestamp)
            data.sort((a, b) => b.date?.seconds - a.date?.seconds);
            setPlaylists(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    if (selectedPlaylist) {
        return <PlaylistDetail playlist={selectedPlaylist} onBack={() => { setSelectedPlaylist(null); loadPlaylists(); }} />;
    }

    // Date formatter helper
    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleDateString('pt-PT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).toUpperCase();
    };

    return (
        <div className="game-list-container" style={{ height: '100%', border: 'none', background: 'transparent', boxShadow: 'none' }}>
            <div className="game-list-header" style={{ borderRadius: '15px' }}>
                <h2>🏎️ Lista de Corridas</h2>
            </div>

            <div className="game-list-content">
                {loading ? (
                    <div className="loading">Carregando corridas...</div>
                ) : (
                    <div className="games-grid">
                        {playlists.map(pl => (
                            <button
                                key={pl.id}
                                className="game-card"
                                onClick={() => setSelectedPlaylist(pl)}
                            >
                                <div className="game-title">
                                    <div className="game-date">{formatDate(pl.date)}</div>
                                    <div className="game-number">Corridas {pl.raceCount || 0}</div>
                                </div>
                                <div className="game-summary">
                                    <div className="game-info">
                                        <div className="game-map">VENCEDOR</div>
                                        <div className="game-rounds">
                                            {pl.winner || '-'}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {playlists.length === 0 && !loading && (
                    <div className="no-games">
                        <p>Nenhuma lista de corridas encontrada.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
