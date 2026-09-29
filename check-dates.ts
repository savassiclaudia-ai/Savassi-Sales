import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const patsSnap = await getDocs(collection(db, 'patients'));
  const counts: Record<string, number> = {};
  
  for (const p of patsSnap.docs) {
    const txsSnap = await getDocs(collection(db, 'patients', p.id, 'transactions'));
    for (const tx of txsSnap.docs) {
      const ym = tx.data().ym;
      counts[ym] = (counts[ym] || 0) + 1;
    }
  }
  
  console.log("Counts per YM:");
  const sorted = Object.keys(counts).sort();
  for (const k of sorted) {
    console.log(`${k}: ${counts[k]}`);
  }
}
run();
