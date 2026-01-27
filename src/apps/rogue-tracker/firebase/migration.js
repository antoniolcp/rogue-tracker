import {
    collection,
    getDocs,
    getDoc,
    doc,
    setDoc,
    deleteDoc,
    updateDoc,
    query,
    where
} from 'firebase/firestore';
import { db } from './config';

export const migratePlayerName = async (oldName, newName) => {
    console.log(`🚀 Starting migration: "${oldName}" -> "${newName}"`);
    let battlesUpdated = 0;

    // 1. UPDATE BATTLES
    try {
        const q = query(collection(db, 'battles'));
        const snapshot = await getDocs(q);

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            let changed = false;

            const updateTeam = (team) => team.map(p => {
                if (p.name === oldName) {
                    changed = true;
                    return { ...p, name: newName };
                }
                return p;
            });

            const newTeam1 = updateTeam(data.team1 || []);
            const newTeam2 = updateTeam(data.team2 || []);

            if (changed) {
                await updateDoc(docSnap.ref, {
                    team1: newTeam1,
                    team2: newTeam2
                });
                battlesUpdated++;
                console.log(`✅ Updated Battle ID: ${docSnap.id}`);
            }
        }
    } catch (e) {
        console.error("Error updating battles:", e);
    }

    // 2. MIGRATE PLAYER STATS
    try {
        const oldRef = doc(db, 'players', oldName);
        const newRef = doc(db, 'players', newName);
        const oldSnap = await getDoc(oldRef);
        const newSnap = await getDoc(newRef);

        if (oldSnap.exists()) {
            const oldData = oldSnap.data();

            if (newSnap.exists()) {
                console.log("⚠️ Target player exists. Merging stats...");
                const newData = newSnap.data();

                // Merge Logic
                const totalRounds = (oldData.totalRounds || 0) + (newData.totalRounds || 0);

                const mergedData = {
                    ...newData,
                    totalGames: (oldData.totalGames || 0) + (newData.totalGames || 0),
                    totalRounds: totalRounds,
                    totalWins: (oldData.totalWins || 0) + (newData.totalWins || 0),
                    totalLosses: (oldData.totalLosses || 0) + (newData.totalLosses || 0),

                    totalElims: (oldData.totalElims || 0) + (newData.totalElims || 0),
                    totalDowns: (oldData.totalDowns || 0) + (newData.totalDowns || 0),
                    totalAssists: (oldData.totalAssists || 0) + (newData.totalAssists || 0),
                    totalRevives: (oldData.totalRevives || 0) + (newData.totalRevives || 0),
                    totalDamage: (oldData.totalDamage || 0) + (newData.totalDamage || 0),
                    totalCaptures: (oldData.totalCaptures || 0) + (newData.totalCaptures || 0),

                    bestElims: Math.max(oldData.bestElims || 0, newData.bestElims || 0),
                    bestDowns: Math.max(oldData.bestDowns || 0, newData.bestDowns || 0),
                    bestAssists: Math.max(oldData.bestAssists || 0, newData.bestAssists || 0),
                    bestRevives: Math.max(oldData.bestRevives || 0, newData.bestRevives || 0),
                    bestDamage: Math.max(oldData.bestDamage || 0, newData.bestDamage || 0),
                    bestCaptures: Math.max(oldData.bestCaptures || 0, newData.bestCaptures || 0),
                };

                // Recalculate averages
                if (totalRounds > 0) {
                    mergedData.avgElims = parseFloat((mergedData.totalElims / totalRounds).toFixed(2));
                    mergedData.avgDowns = parseFloat((mergedData.totalDowns / totalRounds).toFixed(2));
                    mergedData.avgAssists = parseFloat((mergedData.totalAssists / totalRounds).toFixed(2));
                    mergedData.avgRevives = parseFloat((mergedData.totalRevives / totalRounds).toFixed(2));
                    mergedData.avgDamage = parseFloat((mergedData.totalDamage / totalRounds).toFixed(2));
                    mergedData.avgCaptures = parseFloat((mergedData.totalCaptures / totalRounds).toFixed(2));
                }

                mergedData.winRate = mergedData.totalGames > 0
                    ? parseFloat(((mergedData.totalWins / mergedData.totalGames) * 100).toFixed(2))
                    : 0;

                await updateDoc(newRef, mergedData);
                await deleteDoc(oldRef);
                console.log("✅ Stats merged and old player deleted.");

            } else {
                console.log("🆕 Target player new. Moving stats...");
                await setDoc(newRef, { ...oldData, name: newName });
                await deleteDoc(oldRef);
                console.log("✅ Stats moved and old player deleted.");
            }
        } else {
            console.log("⚠️ Old player not found in 'players' collection (might only exist in battles).");
        }

    } catch (e) {
        console.error("Error migrating player stats:", e);
    }

    return `Migration Complete. Updated ${battlesUpdated} battles.`;
};
