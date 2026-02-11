
import { getPlayers as getRoguePlayers } from '../../rogue-tracker/firebase/players';
import { gtaService } from '../../gta/services/gtaService';

// Jogadores a ignorar
const IGNORED_PLAYERS = ['mrobalo10', 'pedro__jl76'];

// Aliases para mapear nomes diferentes para a mesma pessoa
// Key: Nome alternativo (lowercase), Value: Nome principal
const KNOWN_ALIASES = {
    'juveleo1979': 'DiogoFrancxssco',
    'diogofrancxssco': 'DiogoFrancxssco'
};

const resolveName = (name) => {
    const lowerName = name.toLowerCase();
    if (KNOWN_ALIASES[lowerName]) {
        return KNOWN_ALIASES[lowerName];
    }
    return name;
};

export const olimpicsService = {
    async getCombinedPlayers() {
        try {
            // 1. Fetch data from both games
            const [roguePlayers, gtaPlayers] = await Promise.all([
                getRoguePlayers(),
                gtaService.getPlayers()
            ]);

            // 2. Normalize Rogue Stats
            // Rogue Score Formula: (Win Rate * 0.4) + ((Avg Damage / Max Avg Damage) * 60)
            // We prioritize individual performance (damage) slightly more than win rate
            const maxAvgDamage = Math.max(...roguePlayers.map(p => p.avgDamage || 0), 1);

            const rogueScores = {};
            roguePlayers.forEach(p => {
                const winRate = p.winRate || 0;
                const avgDamage = p.avgDamage || 0;

                // Normalize Avg Damage to 0-100 scale
                const normalizedDamage = (avgDamage / maxAvgDamage) * 100;

                // Combined Rogue Score (0-100)
                const score = (winRate * 0.4) + (normalizedDamage * 0.6);

                const canonicalName = resolveName(p.name);
                const key = canonicalName.toLowerCase();

                // Use the highest score if multiple accounts map to same person
                if (rogueScores[key]) {
                    if (score > rogueScores[key].score) {
                        rogueScores[key] = {
                            original: p,
                            name: canonicalName,
                            score
                        };
                    }
                } else {
                    rogueScores[key] = {
                        original: p,
                        name: canonicalName,
                        score
                    };
                }
            });

            // 3. Normalize GTA Stats
            // GTA Score Formula: (Total Points / Races) which is Avg Points per Race
            // We normalize this to 0-100 scale based on the max avg points found
            const gtaStatsList = gtaPlayers.map(p => {
                const stats = p.stats || { totalPoints: 0, races: 0, wins: 0 };
                const avgPoints = stats.races > 0 ? (stats.totalPoints / stats.races) : 0;
                return { name: p.name, avgPoints, original: p };
            });

            const maxAvgPoints = Math.max(...gtaStatsList.map(p => p.avgPoints), 1);

            const gtaScores = {};
            gtaStatsList.forEach(p => {
                // Normalize Avg Points to 0-100 scale
                const normalizedPoints = (p.avgPoints / maxAvgPoints) * 100;

                const canonicalName = resolveName(p.name);
                const key = canonicalName.toLowerCase();

                if (gtaScores[key]) {
                    if (normalizedPoints > gtaScores[key].score) {
                        gtaScores[key] = {
                            original: p.original,
                            name: canonicalName,
                            score: normalizedPoints
                        };
                    }
                } else {
                    gtaScores[key] = {
                        original: p.original,
                        name: canonicalName,
                        score: normalizedPoints
                    };
                }
            });

            // 4. Combine Players
            // We take the union of all players
            const allNames = new Set([
                ...Object.keys(rogueScores),
                ...Object.keys(gtaScores)
            ]);

            const combinedPlayers = [];

            allNames.forEach(nameKey => {
                // Skip ignored players (check against canonical key)
                if (IGNORED_PLAYERS.some(ignored => resolveName(ignored).toLowerCase() === nameKey)) {
                    return;
                }

                const rogueData = rogueScores[nameKey];
                const gtaData = gtaScores[nameKey];

                // Use the canonical name we stored
                const displayName = rogueData?.name || gtaData?.name || nameKey;
                // Capitalize first letter if it looks like a raw key? 
                // Actually our 'name' property in objects is the resolved canonical name which usually has correct casing from KNOWN_ALIASES or original input.

                const rScore = rogueData ? rogueData.score : 0;
                const gScore = gtaData ? gtaData.score : 0;

                const finalScore = (rScore + gScore); // Sum them up -> Max 200

                combinedPlayers.push({
                    name: displayName,
                    rogueScore: rScore,
                    gtaScore: gScore,
                    totalScore: finalScore,
                    rogueData: rogueData?.original || null,
                    gtaData: gtaData?.original || null
                });
            });

            return combinedPlayers;

        } catch (error) {
            console.error("Error fetching combined players:", error);
            throw error;
        }
    },

    generateTeams(players) {
        // Sort by total score descending
        const sortedPlayers = [...players].sort((a, b) => b.totalScore - a.totalScore);

        const team1 = [];
        const team2 = [];

        // Snake Draft for size balance + fair skill distribution
        // A B B A A B B A
        const sTeam1 = [];
        const sTeam2 = [];

        sortedPlayers.forEach((player, index) => {
            // Pattern: 0->A, 1->B, 2->B, 3->A, 4->A, 5->B ...
            // (index % 4 == 0) or (index % 4 == 3) -> A
            // (index % 4 == 1) or (index % 4 == 2) -> B

            const mod = index % 4;
            if (mod === 0 || mod === 3) {
                sTeam1.push(player);
            } else {
                sTeam2.push(player);
            }
        });

        return {
            team1: sTeam1,
            team2: sTeam2,
            team1TotalScore: sTeam1.reduce((sum, p) => sum + p.totalScore, 0),
            team2TotalScore: sTeam2.reduce((sum, p) => sum + p.totalScore, 0)
        };
    }
};
