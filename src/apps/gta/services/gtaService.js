import { playersRef, teamsRef, playlistsRef, racesRef, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc, Timestamp } from './firebase';

export const gtaService = {
    // Players
    async createPlayer(name, teamId = null) {
        return await addDoc(playersRef, {
            name,
            teamId,
            stats: { wins: 0, totalPoints: 0, races: 0 },
            createdAt: Timestamp.now()
        });
    },

    async getPlayers() {
        const snapshot = await getDocs(playersRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Teams
    async createTeam(name, color) {
        return await addDoc(teamsRef, {
            name,
            color,
            createdAt: Timestamp.now()
        });
    },

    async getTeams() {
        const snapshot = await getDocs(teamsRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Playlists
    async createPlaylist(name) {
        return await addDoc(playlistsRef, {
            name,
            status: 'active',
            date: Timestamp.now(),
            races: [] // Array of race IDs or sub-objects
        });
    },

    async getPlaylists() {
        const snapshot = await getDocs(playlistsRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async updatePlaylist(playlistId, data) {
        const docRef = doc(playlistsRef, playlistId);
        return await updateDoc(docRef, data);
    },

    // Races
    async addRace(playlistId, mapName, results) {
        // results: [{ playerId, position, points }]
        const raceDoc = await addDoc(racesRef, {
            playlistId,
            mapName,
            results,
            createdAt: Timestamp.now()
        });

        // Update player stats
        const updatePromises = results.map(async (res) => {
            if (!res.playerId) return;

            // Use getDoc with the specific doc reference instead of query
            // We need to import getDoc in firebase.js first, or use getDocs with query if getDoc is not exported
            // Ideally we should export getDoc from firebase.js. 
            // Checking firebase.js imports: collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, Timestamp
            // getDoc is MISSING from firebase.js exports.

            // OPTION 1: Add getDoc to firebase.js (cleanest)
            // OPTION 2: Use getDocs(query(...)) (robust fallback)

            // Let's use the query approach to avoid touching firebase.js again if possible, or just add getDoc.
            // Adding getDoc is better for 'doc(playersRef, id)' usage.
            // But wait, getDocs(query(playersRef, where('__name__', '==', res.playerId))) is what was there.

            // Let's stick to the query approach which is already imported, or fix imports. It's better to fix imports.
            // Actually, I can just use getDocs on the collection if I query by documentID().

            // Simpler: fetch the doc using the query method that was intended originally.
            const q = query(playersRef, where('__name__', '==', res.playerId));
            const playerSnapshot = await getDocs(q);

            if (!playerSnapshot.empty) {
                const playerDocSnap = playerSnapshot.docs[0];
                const currentStats = playerDocSnap.data().stats || { wins: 0, totalPoints: 0, races: 0 };

                const newStats = {
                    wins: (currentStats.wins || 0) + (res.position === 1 ? 1 : 0),
                    totalPoints: (currentStats.totalPoints || 0) + (parseInt(res.points) || 0),
                    races: (currentStats.races || 0) + 1
                };

                return updateDoc(playerDocSnap.ref, { stats: newStats });
            }
        });

        await Promise.all(updatePromises);

        return raceDoc;
    },

    async resetDatabase() {
        // Helper to delete all docs in a collection
        const deleteCollection = async (ref) => {
            const snapshot = await getDocs(ref);
            const deletePromises = snapshot.docs.map(d => deleteDoc(doc(ref, d.id)));
            await Promise.all(deletePromises);
        };

        await Promise.all([
            deleteCollection(playersRef),
            deleteCollection(teamsRef),
            deleteCollection(playlistsRef),
            deleteCollection(racesRef)
        ]);

        // Also clear local storage rivalries
        localStorage.removeItem('gta_hub_rivalries');

        return true;
    }
};
