import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch, collection, getDocs, deleteDoc } from 'firebase/firestore';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const RAW_CSV = `
DATA,PACIENTE,PG PARA,PROCEDIMENTO, VALOR TOTAL COBRANÇA,FORMA DE PAGAMENTO,RECIBOS,PREENCHIMENTO,ANOTAÇÕES, VALOR SÓ MÁQUINAS , VALOR SEM TAXA CARTÃO, CONSUMÍVEL, VALOR LIQUIDO, 40% LIGIA, 60% CLAUDIA, TOTAL LIGIA (40% + Consumível)
9/9/2025,Marilia Frazillio Souza Martins Daud,,CONSUMIVEL LIFTERA - Pgto em set, R$  -   ,,,,,,," R$  819,95 ", R$  -   , R$  -   , R$  -   ," R$  819,95 "
10/3/2025,Jaqueline Zoppi Hadade (Sogra Dra) ,,PICO 785, R$  -   , CORTESIA ,,,," R$  2.035,75 "," R$  2.035,75 ", R$  -   ," R$  2.035,75 "," R$  814,30 "," R$  1.221,45 "," R$  814,30 "
10/6/2025,CHLOE SAVASSI ,,"DEPILAÇÃO 1/2 PERNA, AXILA, VIRILHA, BUÇO ", R$  -   ,,,,,,," R$  165,00 ",,,," R$  165,00 "
10/20/2025,Jaqueline Zoppi Hadade (Sogra Dra) ,,PICO 785, R$  -   , CORTESIA ,,,," R$  2.035,75 "," R$  2.035,75 ", R$  -   ," R$  2.035,75 "," R$  814,30 "," R$  1.221,45 "," R$  814,30 "
10/22/2025,Marco Suhai,,DEPILAÇÃO ABD + TORAX E AXILA,"R$ 1.197,00", Usou Crédito pg para Clau,,,," R$  1.197,00 "," R$  1.197,00 "," R$  230,00 "," R$  967,00 "," R$  386,80 "," R$  580,20 "," R$  616,80 "
10/21/2025,MILENA COIMBRA MAZINI / DRA CLAUDIA,,DIFERENÇA DE PGTO PARA COMPLEMENTO DE PACOTE 15% ,"R$ 778,50",CRÉDITO 2 A 6X,,,,"R$ 778,50"," R$  759,82 ", R$  -   ," R$  759,82 "," R$  379,91 "," R$  379,91 "," R$  379,91 "

DATA,PACIENTE,PG PARA,PROCEDIMENTO, VALOR TOTAL COBRANÇA,FORMA DE PAGAMENTO,RECIBOS,PREENCHIMENTO,ANOTAÇÕES, VALOR SÓ MÁQUINAS , VALOR SEM TAXA CARTÃO, CONSUMÌVEL, VALOR LIQUIDO, 40% LIGIA, 60% CLAUDIA,
9/24/2025,Alexia Colli Filgueiras (MÊS DE SET),,DEPILAÇÃO BUÇO E AXILA," R$  648,00 ",TED/PIX,,,," R$  648,00 "," R$  648,00 "," R$ 239,00 "," R$  409,00 "," R$  163,60 "," R$  245,40 ",
10/1/2025,BIANCA TEDESCHI PASQUOTTO,,2 SESSÕES DE CELLU," R$  1.140,00 ",TED/PIX,,,," R$  1.140,00 "," R$  1.140,00 "," R$ 240,00 "," R$  900,00 "," R$  360,00 "," R$  540,00 ",
10/1/2025,LORIS VERONA JUNIOR ,,RIGENERA CAPILAR," R$  11.148,25 ",CRÉDITO 7 A 10X,,,," R$  11.148,25 "," R$  10.646,58 "," R$ 3.300,00 "," R$  7.346,58 "," R$  2.938,63 "," R$  4.407,95 ",
10/2/2025,MARIA RIQUE / DRA CLAUDIA ,,BIONE ," R$  550,00 ",TED/PIX,,,," R$  550,00 "," R$  550,00 ", R$ -   ," R$  550,00 "," R$  220,00 "," R$  330,00 ",
10/9/2025,RICARDO EID PHILIPP,,"PICO UNHA + DEPILAÇÃO PERIANAL, NARIZ, GLUTEOS E ORELHAS "," R$  1.971,00 ",CRÉDITO,,,," R$  1.971,00 "," R$  1.932,57 "," R$ 220,00 "," R$  1.712,57 "," R$  685,03 "," R$  1.027,54 ",
10/9/2025,MARIA RIQUE / DRA CLAUDIA ,,"BIONE + DEPILAÇÃO INTIMA, PERNA COMPLETA, BRAÇO, BUÇO E AXILA "," R$  3.565,00 ",TED/PIX,,,," R$  3.565,00 "," R$  3.565,00 "," R$ 280,00 "," R$  3.285,00 "," R$  1.314,00 "," R$  1.971,00 ",
10/13/2025,SONIA MARIA DIAS AGUILERA FERNANDES,,3 SESSÕES DE PICO 785 FACE," R$  6.825,75 ",CRÉDITO 2 A 6X,,,," R$  6.825,75 "," R$  6.661,93 ", R$ -   ," R$  6.661,93 "," R$  2.664,77 "," R$  3.997,16 ",
10/13/2025,ERICA TREVIZANI ROSSI REBELLO,, HYDRAFACIAL," R$  1.130,50 ",TED/PIX,,,," R$  1.130,50 "," R$  1.130,50 "," R$ 615,00 "," R$  515,50 "," R$  206,20 "," R$  309,30 ",
10/14/2025,JOSE MANOEL RAMOS RODRIGUEZ,,DERMA V VASINHOS ," R$  1.016,50 ",CRÉDITO 2 A 6X,,,," R$  1.016,50 "," R$  992,10 ", R$ -   ," R$  992,10 "," R$  396,84 "," R$  595,26 ",
10/15/2025,ALINE DE CASSIA FERREIRA KNAPP,,EXOCUBE CAPILAR (usado também um kit MCT)," R$  9.900,00 ",CRÉDITO 7 A 10X,,,," R$  9.900,00 "," R$  9.454,50 "," R$ 4.299,00 "," R$  5.155,50 "," R$  2.062,20 "," R$  3.093,30 ",
10/16/2025,ANA CAROLINA DE SOUSA WEEGE,,BUÇO + QUEIXO," R$  432,00 ",CRÉDITO,,,," R$  432,00 "," R$  423,58 "," R$ 50,00 "," R$  373,58 "," R$  149,43 "," R$  224,15 ",
10/17/2025,Carla Elaine Antonio Prado Troyjo,,"THERMAGE FULL FACE + PESCOÇO, E EXOCUBE"," R$  20.000,00 ",CRÉDITO 2 A 6X,,,," R$  20.000,00 "," R$  19.520,00 "," R$ 5.700,00 "," R$  13.820,00 "," R$  5.528,00 "," R$  8.292,00 ",
10/17/2025,Carla Elaine Antonio Prado Troyjo,,"THERMAGE FULL FACE + PESCOÇO,  E EXOCUBE"," R$  11.900,00 ",CRÉDITO,,,," R$  11.900,00 "," R$  11.667,95 "," R$ 3.099,00 "," R$  8.568,95 "," R$  3.427,58 "," R$  5.141,37 ",
10/20/2025,NADJA KELBIENE PEREIRA DE BRITO GOUVEIA,,DEPILAÇÃO ROSTO + NARIZ," R$  695,00 ",CRÉDITO,,,," R$  695,00 "," R$  681,45 "," R$ 60,00 "," R$  621,45 "," R$  248,58 "," R$  372,87 ",
10/21/2025,MARIA LUIZA ANDRADE DALTRO SANTOS / DRA CLAUDIA,,CLARITY AXILA+VIRILHA + BUÇO," R$  1.315,00 ",CRÉDITO,,,," R$  1.315,00 "," R$  1.289,36 "," R$ 115,00 "," R$  1.174,36 "," R$  469,74 "," R$  704,61 ",
10/23/2025,BEATRIZ FACHIN SOARES,,HYDRAFACIAL," R$  1.330,00 ",CRÉDITO,,,," R$  1.330,00 "," R$  1.304,07 "," R$ 615,00 "," R$  689,07 "," R$  275,63 "," R$  413,44 ",
10/23/2025,JULIANA FROTA,,DENSITY FULL FACE + PESCOÇO E LINEAR Z FULL FACE + PESCOÇO," R$  24.255,00 ",CRÉDITO 7 A 10X,,,," R$  24.255,00 "," R$  23.163,53 "," R$ 2.157,20 "," R$  21.006,33 "," R$  8.402,53 "," R$  12.603,80 ",
10/23/2025,Carla Elaine Antonio Prado Troyjo,,CLARITY ROSTO," R$  595,00 ",CRÉDITO,,,," R$  595,00 "," R$  583,40 "," R$ 50,00 "," R$  533,40 "," R$  213,36 "," R$  320,04 ",
10/29/2025,Julia Balassiano,,CLARITY AXILA +MEIA PERNA ," R$  1.075,00 ",CRÉDITO,,,," R$  1.075,00 "," R$  1.054,04 "," R$ 80,00 "," R$  974,04 "," R$  389,62 "," R$  584,42 ",
10/30/2025,BEATRIZ FACHIN SOARES,,DEPILAÇÃO BUÇO," R$  240,00 ",CRÉDITO,,,," R$  240,00 "," R$  235,32 "," R$ 20,00 "," R$  215,32 "," R$  86,13 "," R$  129,19 ",
10/31/2025,ANDREA QUARTIN CHEDE ABAD ,,"DEPILAÇÃO NUCA, BUÇO E ROSTO "," R$  1.075,00 ",CRÉDITO 2 A 6X,,,," R$  1.075,00 "," R$  1.049,20 "," R$ 120,00 "," R$  929,20 "," R$  371,68 "," R$  557,52 ",

DATA,PACIENTE,PG PARA,PROCEDIMENTO, VALOR TOTAL COBRANÇA,FORMA DE PAGAMENTO,RECIBOS,PREENCHIMENTO,ANOTAÇÕES, VALOR SÓ MÁQUINAS , VALOR SEM TAXA CARTÃO, CONSUMÌVEL, VALOR LIQUIDO, 50% LIGIA, 50% CLAUDIA,
10/17/2025,Carla Elaine Antonio Prado Troyjo / Dra Claudia,,Exomind," R$  1.000,00 ",CRÉDITO,,,," R$  1.000,00 "," R$  980,50 "," R$  120,00 "," R$  860,50 "," R$  430,25 "," R$  430,25 ",
10/13/2025,ERICA TREVIZANI ROSSI REBELLO / Dra Claudia,,Linear Z Full Face (c/ olhos)," R$  8.228,00 ",TED/PIX,,,," R$  8.228,00 "," R$  8.228,00 "," R$  560,00 "," R$  7.668,00 "," R$  3.834,00 "," R$  3.834,00 ",
10/13/2025,ERICA TREVIZANI ROSSI REBELLO / Dra Claudia,,Density Full Face (c/ olhos)," R$  8.228,00 ",TED/PIX,,,," R$  8.228,00 "," R$  8.228,00 "," R$  1.350,00 "," R$  6.878,00 "," R$  3.439,00 "," R$  3.439,00 ",
10/23/2025,Carla Elaine Antonio Prado Troyjo / Dra Claudia,,Exomind," R$  1.000,00 ",CRÉDITO,,,," R$  1.000,00 "," R$  980,50 "," R$  120,00 "," R$  860,50 "," R$  430,25 "," R$  430,25 ",
10/24/2025,MILENA COIMBRA MAZINI / DRA CLAUDIA,,Linear Z Full Face (c/ olhos)," R$  7.838,75 ",TED/PIX,,,," R$  7.838,75 "," R$  7.838,75 "," R$  560,00 "," R$  7.278,75 "," R$  3.639,38 "," R$  3.639,38 ",
10/24/2025,MILENA COIMBRA MAZINI / DRA CLAUDIA,,Density Full Face (c/ olhos)," R$  7.838,75 ",TED/PIX,,,," R$  7.838,75 "," R$  7.838,75 "," R$  1.620,00 "," R$  6.218,75 "," R$  3.109,38 "," R$  3.109,38 ",
10/28/2025,FERNANDA BEZERRA GOUVEIA,,HYDRAFACIAL," R$  1.330,00 ",CREDITO ,,,," R$  1.330,00 "," R$  1.330,00 "," R$  615,00 "," R$  715,00 "," R$  357,50 "," R$  357,50 "
`;

function parseCurrency(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/R\$/g, '').replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.').trim();
  if (!clean || clean === '-') return 0;
  return parseFloat(clean) || 0;
}

function parseDateYm(str: string): string {
  if (!str) return '';
  const parts = str.split('/');
  if (parts.length === 3) {
    const m = parts[0].padStart(2, '0');
    const y = parts[2];
    return String(y) + '-' + String(m);
  }
  return '';
}

function inferKit(proc: string): string {
  const p = (proc || '').toUpperCase();
  if (p.includes('CLARITY') || p.includes('DEPILAÇÃO')) return 'DEPILAÇÃO';
  if (p.includes('CAPILAR') || p.includes('MMP') || p.includes('RIGENERA') || p.includes('EXOCUBE')) return 'CAPILAR';
  if (p.includes('THERMAGE') || p.includes('LINEAR') || p.includes('DENSITY') || p.includes('SOFWAVE') || p.includes('LIFTERA')) return 'LIFTING PREMIUM';
  if (p.includes('HYDRAFACIAL') || p.includes('BIONE') || p.includes('EXOMIND') || p.includes('DERMA V')) return 'INJETÁVEIS & SKINCARE';
  if (p.includes('PICO') || p.includes('PESCOÇO')) return 'PELE & REJUVENESCIMENTO';
  if (p.includes('CELLU') || p.includes('GLUTEOS') || p.includes('EMSCULPT')) return 'FIRMEZA & CONTORNO';
  return 'OUTROS';
}

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log('Seeding real data to Firestore...');
  
  try {
    const patsSnap = await getDocs(collection(db, 'patients'));
    const allDeletes = [];
    for (const p of patsSnap.docs) {
      const txsSnap = await getDocs(collection(db, 'patients', p.id, 'transactions'));
      for (const tx of txsSnap.docs) {
        allDeletes.push(deleteDoc(tx.ref));
      }
      allDeletes.push(deleteDoc(p.ref));
    }
    await Promise.all(allDeletes);
    console.log('Completed deletion of existing data');
  } catch (err) {
    console.error('Error during delete:', err);
  }

  // 2. Parse CSV arrays
  const lines = RAW_CSV.split('\n').filter(l => l.trim() !== '');
  let currentGroup = '';
  
  const rawTx = [];
  
  for (const line of lines) {
    if (line.startsWith('DATA,PACIENTE')) continue; // Skip headers
    if (line.startsWith('TOTAL')) continue; // Skip totals
    
    // Use csv-parse for correct comma handling
    const records = parse(line, {
      columns: false,
      skip_empty_lines: true
    });
    
    if (records.length > 0) {
      const rec = records[0];
      if (rec.length < 5) continue;
      
      const pac = rec[1].trim();
      const dt = rec[0].trim();
      const proc = rec[3] ? rec[3].trim() : '';
      const cob = parseCurrency(rec[4]);
      const cons = parseCurrency(rec[11]); // CONSUMIVEL is around col 11 (0-indexed)
      const liq = parseCurrency(rec[12]);
      const pg = rec[5] ? rec[5].trim() : '';
      
      rawTx.push({ pac, ym: parseDateYm(dt), proc, cob, cons, liq, pg });
    }
  }
  
  const patientsMap = new Map();
  for (const tx of rawTx) {
    if (!patientsMap.has(tx.pac)) {
      patientsMap.set(tx.pac, {
        id: tx.pac.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: tx.pac,
        ltv: 0,
        liq: 0,
        cons: 0,
        n_tx: 0,
        txs: []
      });
    }
    const p = patientsMap.get(tx.pac);
    p.ltv += tx.cob;
    p.liq += tx.liq;
    p.cons += tx.cons;
    p.n_tx += 1;
    tx.kit = inferKit(tx.proc);
    p.txs.push(tx);
  }
  
  try {
    let count = 0;
    for (const p of Array.from(patientsMap.values())) {
      const { txs, ...patientData } = p;
      // Assign a score
      if (patientData.ltv > 5000) patientData.score = 'A';
      else if (patientData.ltv > 1000) patientData.score = 'B';
      else patientData.score = 'C';
      
      patientData.status = 'ativo';
      
      // Find top kit
      const kitCount: Record<string, number> = {};
      for (const tx of txs) {
         kitCount[tx.kit] = (kitCount[tx.kit] || 0) + 1;
      }
      patientData.top_kit = Object.keys(kitCount).sort((a,b) => kitCount[b] - kitCount[a])[0] || 'MULTIPLOS';
      patientData.kits = Object.keys(kitCount);
      
      // Dates
      const dts = txs.map(t => t.ym).filter(d => d).sort();
      patientData.first_visit = dts[0] || '';
      patientData.last_visit = dts[dts.length - 1] || '';
      
      const pRef = doc(db, 'patients', patientData.id);
      await setDoc(pRef, patientData);
      count++;
      
      let txCount = 0;
      for (const tx of txs) {
         txCount++;
         const { pac, ...txToWrite } = tx;
         const txRef = doc(db, 'patients', patientData.id, 'transactions', 'TX' + String(txCount).padStart(3,'0'));
         await setDoc(txRef, txToWrite);
      }
    }
    console.log('Successfully written ' + count + ' patients to Firestore!');
  } catch(err) {
    console.error("Write error:", err);
  }
}

run();
