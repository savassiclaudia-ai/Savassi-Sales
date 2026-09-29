import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const patsSnap = await getDocs(query(collection(db, 'patients'), limit(50))); // limit to avoid timeout
  const txs: any[] = [];
  
  for (const p of patsSnap.docs) {
    const txsSnap = await getDocs(collection(db, 'patients', p.id, 'transactions'));
    for (const tx of txsSnap.docs) {
      txs.push(tx.data());
    }
  }
  
  console.log('Total de Transacoes na amostra (50 pacientes):', txs.length);
  const years = new Set<string>();
  const months = new Set<string>();
  
  for (const tx of txs) {
      if (tx.ym) {
          months.add(tx.ym);
          years.add(tx.ym.split('-')[0]);
      } else {
          console.log("No YM for tx:", tx);
      }
  }
  
  console.log("Anos encontrados:", Array.from(years).sort());
  console.log("Meses-Ano encontrados:", Array.from(months).sort());
  process.exit(0);
}

run();
