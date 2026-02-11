
import { useState } from 'react'
import './ChinsOlimpics.css'

// Equipas re-equilibradas manualmente para Rogue Tracker
const STATIC_TEAMS = {
    "team1": [
        { "name": "Gametti" },
        { "name": "franciscomrfe" },
        { "name": "tiagofranca6" },
        { "name": "miguel_paisana" },
        { "name": "duartealmeida8" },
        { "name": "martim1087" },
        { "name": "pedro_jl76" }
    ],
    "team2": [
        { "name": "antoniolamycp9" },
        { "name": "BARROSA10" },
        { "name": "fifagomesg-19" },
        { "name": "Andre_santinho" },
        { "name": "DiogoFrancxssco" },
        { "name": "Duarte_Sogalho" },
        { "name": "Benny_Fuego" },
        { "name": "TheRealSantana-" }
    ]
};

function ChinsOlimpics({ onBackToHub }) {
    const [teams] = useState(STATIC_TEAMS)

    return (
        <div className="olimpics-app">
            <header className="olimpics-header">
                {onBackToHub && (
                    <button className="olimpics-back-btn" onClick={onBackToHub}>
                        ← HUB
                    </button>
                )}
                <h1 className="olimpics-title">🏆 CHINS OLIMPICS 🏆</h1>
            </header>

            <main className="olimpics-content">
                <div className="olimpics-app simple-tables-container">

                    {/* Tabela Equipa 1 */}
                    <div className="simple-team-table">
                        <h2 className="team-title-red">EQUIPA 1</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Jogadores</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teams.team1.map((p, idx) => (
                                    <tr key={idx}>
                                        <td>{p.name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Tabela Equipa 2 */}
                    <div className="simple-team-table">
                        <h2 className="team-title-blue">EQUIPA 2</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Jogadores</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teams.team2.map((p, idx) => (
                                    <tr key={idx}>
                                        <td>{p.name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            </main>
        </div>
    )
}

export default ChinsOlimpics
