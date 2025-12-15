// Re-export the existing shared Firestore instance
// This assumes both apps share the same Firebase project
import { db } from '../../rogue-tracker/firebase/config';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, Timestamp } from 'firebase/firestore';

// Collection References
export const playersRef = collection(db, 'gta_players');
export const teamsRef = collection(db, 'gta_teams');
export const playlistsRef = collection(db, 'gta_playlists');
export const racesRef = collection(db, 'gta_races');

export { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, Timestamp };
