import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const patsSnap = await getDocs(collection(db, 'patients'));
  const allMonths = new Set<string>();
  
  for (const p of patsSnap.docs) {
    const txsSnap = await getDocs(collection(db, 'patients', p.id, 'transactions'));
    for (const tx of txsSnap.docs) {
      if (tx.data().ym) allMonths.add(tx.data().ym);
    }
  }
  
  const sorted = Array.from(allMonths).sort();
  console.log("All months sorted:", sorted);
  if (sorted.length > 0) {
     console.log("First:", sorted[0]);
     console.log("Last:", sorted[sorted.length-1]);
  }
}
run();
