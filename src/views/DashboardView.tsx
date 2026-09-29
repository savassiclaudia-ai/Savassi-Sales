import { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis
} from 'recharts';
import { GoogleGenAI } from '@google/genai';
import { LayoutGrid, Search, TrendingUp, Grid, List, Activity, Users, AlertTriangle, Target, RefreshCw, Layers, MessageCircle, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';
import { DASH, KIT_ORDER, Patient } from '../lib/data';
import { fmtK, fmtFull, cn } from '../lib/utils';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, getDocs, deleteDoc, doc, setDoc, writeBatch } from 'firebase/firestore';
import { parse } from 'csv-parse/browser/esm/sync';
import { RAW_CSV } from '../rawCsv';

function parseCurrency(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  const str = String(val);
  const clean = str.replace(/R\$/gi, '').replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.').trim();
  if (!clean || clean === '-') return 0;
  return parseFloat(clean) || 0;
}

function parseDateYm(val: any): string {
  if (!val) return '';
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const y = d.getUTCFullYear();
    return `${y}-${m}`;
  }
  
  const str = String(val).trim().toLowerCase().replace(/\s+/g, '');

  if (str === 'nov/09' || str === 'nov/2009' || str === '11/09' || str === '11/2009') {
     if (str === 'nov/09') return '';
  }

  if (str.includes('2109')) return '';
  
  // Try mapping portuguese month names if it's a format like maio/25
  const ptMonths: Record<string, string> = {
    'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'maio': '05',
    'jun': '06', 'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
  };

  const parts = str.split(/[\/-]/);
  
  if (parts.length === 2) {
    let p0 = parts[0];
    let p1 = parts[1];
    
    if (p0.length === 4) {
       return `${p0}-${p1.padStart(2, '0')}`;
    }
    
    let isTextMonth = false;
    for (const key of Object.keys(ptMonths)) {
      if (p0.includes(key)) {
        p0 = ptMonths[key];
        isTextMonth = true;
        break;
      }
    }
    
    if (p1.length === 4) {
       return `${p1}-${p0.padStart(2, '0')}`;
    }
    
    if (isTextMonth || Number(p1) > 12) {
      let m = p0.padStart(2, '0');
      let y = p1;
      if (y.length === 2) y = '20' + y;
      return `${y}-${m}`;
    } else {
      let m = p1.padStart(2, '0');
      let y = new Date().getFullYear().toString();
      return `${y}-${m}`;
    }
  }
  
  if (parts.length === 3) {
    let m = parts[1];
    let d = parts[0];
    let y = parts[2];
    
    if (parts[0].length === 4) {
       y = parts[0];
       m = parts[1];
       d = parts[2];
    }
    
    // Check if middle part is a named month
    let foundNamed = false;
    for (const key of Object.keys(ptMonths)) {
      if (m.includes(key)) {
        m = ptMonths[key];
        foundNamed = true;
        break;
      }
    }
    
    if (!foundNamed) {
      if (Number(parts[0]) > 12) {
         // definitely DD/MM/YYYY
         m = parts[1];
      } else if (Number(parts[1]) > 12) {
         // definitely MM/DD/YYYY
         m = parts[0];
      } else {
         // Default to DD/MM
         m = parts[1]; 
      }
      m = m.padStart(2, '0');
    }

    if (y.length === 2) y = '20' + y;
    return `${y}-${m}`;
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

const KIT_COLORS: Record<string, string> = {
  'LIFTING PREMIUM': '#115EA3',
  'FIRMEZA & CONTORNO': '#0F5494',
  'PELE & REJUVENESCIMENTO': '#A88B52',
  'CAPILAR': '#D3BB8C',
  'DEPILAÇÃO': '#B38B41',
  'INJETÁVEIS & SKINCARE': '#9E7E49',
  'OUTROS': '#7B623A'
};

const NAV_ITEMS = [
  { id: 'overview', icon: LayoutGrid, Search, label: 'Visão Geral', sec: 'Visões' },
  { id: 'tendencia', icon: TrendingUp, label: 'Tendência Mensal', sec: null },
  { id: 'kits', icon: Grid, label: 'Por Categoria', sec: null },
  { id: 'procedimentos', icon: Layers, label: 'Procedimentos', sec: null },
  { id: 'transacoes', icon: List, label: 'Transações', sec: null },
  { id: 'termos', icon: Activity, label: 'Frequência', sec: 'Análise' },
  { id: 'pacientes', icon: Users, label: 'Pacientes', sec: null },
  { id: 'anomalias', icon: AlertTriangle, label: 'Anomalias', sec: null },
  { id: 'plano', icon: Target, label: 'Próximos Passos', sec: null }
];

export function DashboardView({ onOpenCrm, patients, role, forcePage }: { onOpenCrm: (name: string) => void, patients: Patient[], role?: import("../App").Role, forcePage?: string }) {
  const [page, setPage] = useState(forcePage || 'overview');
  const [isSyncing, setIsSyncing] = useState(false);
  const [txSortCol, setTxSortCol] = useState<string>('ym');
  const [txSortAsc, setTxSortAsc] = useState<boolean>(false);
  const [kitSortCol, setKitSortCol] = useState<string>('value');
  const [kitSortAsc, setKitSortAsc] = useState<boolean>(false);
  const [kitTxSortCol, setKitTxSortCol] = useState<string>('ym');
  const [kitTxSortAsc, setKitTxSortAsc] = useState<boolean>(false);
  const [patSortCol, setPatSortCol] = useState<string>('ltv');
  const [patSortAsc, setPatSortAsc] = useState<boolean>(false);
  const [procListSortCol, setProcListSortCol] = useState<string>('cob');
  const [procListSortAsc, setProcListSortAsc] = useState<boolean>(false);
  const [procSearchTerm, setProcSearchTerm] = useState<string>('');
  const [selectedKit, setSelectedKit] = useState<string | null>(null);
  const [activities, setActivities] = useState<{id: number, paciente: string, action: string, notes: string, date: string}[]>([]);
  const [newActivity, setNewActivity] = useState<{paciente: string, action: string}>({paciente: '', action: ''});
  const [dateFilter, setDateFilter] = useState<{start: string, end: string} | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState<string | null>(null);
  const [generatedContact, setGeneratedContact] = useState<{p: any, action: string, msg: string} | null>(null);

  const getApiKey = () => {
    let key = localStorage.getItem('gemini_api_key');
    if (!key) {
      key = prompt('Para usar a Inteligência Artificial, insira sua chave da API do Google Gemini (ela ficará salva no seu navegador):');
      if (key) {
        localStorage.setItem('gemini_api_key', key);
      }
    }
    return key;
  };

  const handleAiAnalysis = async () => {
    const apiKey = getApiKey();
    if (!apiKey) return;

    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const promptText = `Você é um Diretor de Vendas e Marketing altamente analítico. Aqui estão os dados de receita por categoria ("Kits") de uma clínica:\n${JSON.stringify(kitPieData, null, 2)}\n\nFaça uma análise concisa e estratégica sobre esses dados:\n1. Identifique o carro-chefe e seu impacto.\n2. Identifique oportunidades de upsell ou cross-sell.\n3. Sugira uma ação rápida de marketing para a categoria com pior desempenho ou maior potencial.\n\nAja com tom profissional, focado em resultados.\nFormate sua resposta em parágrafos claros ou bullet points curtos usando Markdown.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
      });
      
      if (response.text) {
        setAiAnalysis(response.text);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('API key not valid')) {
          localStorage.removeItem('gemini_api_key');
          alert('Chave de API inválida. Tente novamente.');
      } else {
          alert('Erro ao chamar a IA: ' + err.message);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsSyncing(true);
    
    try {
        const XLSX = await import('xlsx');
        let rawTx: any[] = [];
        
        for (const file of files) {
          const data = new Uint8Array(await file.arrayBuffer());
          const workbook = XLSX.read(data, { type: 'array' });
          
          for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
            
            for (const row of rows) {
               if (!row || row.length < 2) continue;
               const dateVal = row[0];
               if (dateVal === undefined || dateVal === null) continue;
               
               const dateStr = String(dateVal).toUpperCase();
               if (dateStr === 'DATA' || dateStr.includes('TOTAL') || dateStr.includes('RESUMO')) continue;
               
               const pacName = String(row[1] || '').trim();
               if (!pacName) continue;
               
               const extraData = row.filter((_, idx) => idx !== 13 && idx !== 14);
               const ym = parseDateYm(dateVal);
               
               if (!ym || ym < '2019-10') continue;
               
               rawTx.push({
                 pac: pacName,
                 ym: ym,
                 proc: String(row[3] || '').trim(),
                 cob: typeof row[4] === 'number' ? row[4] : parseCurrency(String(row[4] || '')),
                 cons: typeof row[11] === 'number' ? row[11] : parseCurrency(String(row[11] || '')),
                 liq: typeof row[12] === 'number' ? row[12] : parseCurrency(String(row[12] || '')),
                 pg: String(row[5] || '').trim(),
                 raw: extraData
               });
            }
          }
        }

        const uniqueTxMap = new Map();
        for (const tx of rawTx) {
          const key = `${tx.pac}|${tx.ym}|${tx.proc}|${tx.cob}|${tx.cons}`;
          if (!uniqueTxMap.has(key)) {
            uniqueTxMap.set(key, tx);
          }
        }
        rawTx = Array.from(uniqueTxMap.values());

        const patsSnap = await getDocs(collection(db, 'patients'));
        
        let batch = writeBatch(db);
        let opCount = 0;
        
        for (const p of patsSnap.docs) {
          batch.delete(p.ref);
          opCount++;
          if (opCount >= 400) {
            await batch.commit();
            batch = writeBatch(db);
            opCount = 0;
          }
        }
        if (opCount > 0) {
          await batch.commit();
        }

        const patientsMap = new Map();
        for (const tx of rawTx) {
          if (!tx.pac) continue;
          if (!patientsMap.has(tx.pac)) {
            patientsMap.set(tx.pac, {
              id: tx.pac.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              name: tx.pac, ltv: 0, liq: 0, cons: 0, n_tx: 0, txs: []
            });
          }
          const p = patientsMap.get(tx.pac);
          p.ltv += tx.cob || 0;
          p.liq += tx.liq || 0;
          p.cons += tx.cons || 0;
          p.n_tx += 1;
          tx.kit = inferKit(tx.proc);
          p.txs.push(tx);
        }

        batch = writeBatch(db);
        opCount = 0;
        
        for (const p of Array.from(patientsMap.values())) {
          const patientData = { ...p };
          if (patientData.ltv > 5000) patientData.score = 'A';
          else if (patientData.ltv > 1000) patientData.score = 'B';
          else patientData.score = 'C';
          patientData.status = 'ativo';
          
          const kitCount: Record<string, number> = {};
          for (const tx of patientData.txs) kitCount[tx.kit] = (kitCount[tx.kit] || 0) + 1;
          patientData.top_kit = Object.keys(kitCount).sort((a,b) => kitCount[b] - kitCount[a])[0] || 'MULTIPLOS';
          patientData.kits = Object.keys(kitCount);
          
          const dts = patientData.txs.map((t: any) => t.ym).filter((d: string) => d).sort();
          patientData.first_visit = dts[0] || '';
          patientData.last_visit = dts[dts.length - 1] || '';
          
          const pRef = doc(db, 'patients', patientData.id);
          batch.set(pRef, patientData);
          opCount++;
          
          if (opCount >= 400) {
             await batch.commit();
             batch = writeBatch(db);
             opCount = 0;
          }
        }
        if (opCount > 0) {
          await batch.commit();
        }
        
        alert(`Sincronização com Planilha finalizada com sucesso! (${rawTx.length} registros únicos importados)`);
    } catch (err) {
        console.error(err);
        alert('Erro ao sincronizar.');
        handleFirestoreError(err, OperationType.WRITE, 'patients');
    } finally {
        setIsSyncing(false);
        if (e.target) e.target.value = '';
    }
  };

  // Dynamic metric calculations from `patients`, filtering ignoring entries before 2019-10
  const allAvailableMonths = Array.from(new Set(patients.flatMap(p => (p.txs || []).map(tx => tx.ym).filter(ym => ym && ym >= '2019-10')))).sort();

  const activePatients = patients.map(p => {
    let validTxs = (p.txs || []).filter(tx => tx.ym && tx.ym >= '2019-10');
    if (dateFilter) {
       validTxs = validTxs.filter(tx => tx.ym >= dateFilter.start && tx.ym <= dateFilter.end);
    }
    if (validTxs.length === 0) return null;
    
    const ltv = validTxs.reduce((sum, tx) => sum + (tx.cob || 0), 0);
    const liq = validTxs.reduce((sum, tx) => sum + (tx.liq || 0), 0);
    const cons = validTxs.reduce((sum, tx) => sum + (tx.cons || 0), 0);
    const n_tx = validTxs.length;
    
    const dts = validTxs.map(t => t.ym).sort();
    return { ...p, txs: validTxs, ltv, liq, cons, n_tx, first_visit: dts[0], last_visit: dts[dts.length - 1] };
  }).filter(Boolean) as any[];

  const totals = activePatients.reduce((acc, p) => {
    acc.cob += p.ltv || 0;
    acc.liq += p.liq || 0;
    acc.cons += p.cons || 0;
    acc.n += p.n_tx || 0;
    return acc;
  }, { cob: 0, liq: 0, cons: 0, n: 0, pacientes: activePatients.length, ticket_medio: 0 });
  totals.ticket_medio = totals.n > 0 ? totals.cob / totals.n : 0;

  // Monthly Data
  const monthlyAcc: Record<string, { cob: number; liq: number; cons: number; n: number, procs: Record<string, { n: number, cob: number }> }> = {};
  const kitAcc: Record<string, number> = {};
  const termCounts: Record<string, number> = {};

  const allTxs: any[] = [];

  activePatients.forEach(p => {
    (p.txs || []).forEach(tx => {
      allTxs.push({ ...tx, paciente: p.name });
      const ym = tx.ym;
      const proc = String(tx.proc || 'OUTROS').toUpperCase().trim();
      if (ym) {
        if (!monthlyAcc[ym]) monthlyAcc[ym] = { cob: 0, liq: 0, cons: 0, n: 0, procs: {} };
        monthlyAcc[ym].cob += tx.cob || 0;
        monthlyAcc[ym].liq += tx.liq || 0;
        monthlyAcc[ym].cons += tx.cons || 0;
        monthlyAcc[ym].n += 1;
        
        if (!monthlyAcc[ym].procs[proc]) monthlyAcc[ym].procs[proc] = { n: 0, cob: 0 };
        monthlyAcc[ym].procs[proc].n += 1;
        monthlyAcc[ym].procs[proc].cob += tx.cob || 0;
      }
      
      const kit = tx.kit || "OUTROS";
      kitAcc[kit] = (kitAcc[kit] || 0) + (tx.cob || 0);

      const procUpper = (tx.proc || "").toUpperCase();
      // Extract words for dynamic term counting
      const words = procUpper.split(/[\s\/\+\-]+/).map(w => w.trim()).filter(w => w.length > 3 && !['COM', 'PARA', 'SESSÕES', 'SESSAO', 'SESSÃO', 'PACOTE', 'ÁREA', 'AREAS', 'ÁREAS', 'MÚLTIPLAS', 'RETORNO'].includes(w));
      words.forEach(w => {
         termCounts[w] = (termCounts[w] || 0) + 1;
      });
    });
  });

  const ptMonthNames: Record<string, string> = {
    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
    '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
  };

  const monthlyData = Object.keys(monthlyAcc).sort().map(m => {
    const y = m.split('-')[0];
    const mo = m.split('-')[1];
    return { 
      month: `${ptMonthNames[mo] || mo}/${y.slice(2)}`, 
      name: m, 
      ...monthlyAcc[m] 
    };
  });

  const kitPieData = Object.keys(kitAcc).map(k => ({
    name: k,
    value: kitAcc[k]
  })).sort((a,b) => b.value - a.value);

  const radarData = Object.keys(termCounts)
    .map(term => ({ subject: term, A: termCounts[term] }))
    .sort((a, b) => b.A - a.A)
    .slice(0, 12);
  if (radarData.length > 0) {
    const fullMark = radarData[0].A;
    radarData.forEach(d => (d as any).fullMark = fullMark);
  }

  let maxDescMonth = "0000-00";
  const currYm = new Date().getFullYear() + "-" + String(new Date().getMonth() + 1).padStart(2, '0');
  activePatients.forEach(p => {
    if (p.last_visit && p.last_visit > maxDescMonth && p.last_visit <= currYm) maxDescMonth = p.last_visit;
  });
  if (maxDescMonth === "0000-00") maxDescMonth = currYm;
  const [maxY, maxM] = maxDescMonth.split('-').map(Number);
  const maxAbsoluteMonth = (maxY || 0) * 12 + (maxM || 0);

  const getMonthsSinceLastVisit = (last_visit: string) => {
    if (!last_visit) return 0;
    const [y, m] = last_visit.split('-').map(Number);
    const diff = maxAbsoluteMonth - ((y || 0) * 12 + (m || 0));
    return diff < 0 ? 0 : diff;
  };

  const formatAusencia = (mDiff: number) => {
    if (mDiff < 1) return 'Ativo';
    if (mDiff < 12) return `${mDiff}m ausente`;
    const y = Math.floor(mDiff / 12);
    const m = mDiff % 12;
    return `${y}a${m > 0 ? ` ${m}m` : ''} ausente`;
  };

  const kpis = [
    { lbl: 'Receita Bruta Total', val: 'R$' + (totals.cob / 1000).toFixed(1) + 'K', sub: monthlyData.length > 0 ? `${monthlyData[0]?.month} – ${monthlyData[monthlyData.length-1]?.month}` : '-', ic: '💰', cls: 'text-[#115EA3]' },
    { lbl: 'Receita Líquida', val: 'R$' + (totals.liq / 1000).toFixed(1) + 'K', sub: 'Após consumíveis', ic: '✅', cls: 'text-gray-900' },
    { lbl: 'Consumível Total', val: fmtK(totals.cons), sub: Math.round(totals.cob > 0 ? (totals.cons / totals.cob * 100) : 0) + '% da receita', ic: '🧪', cls: 'text-gray-900' },
    { lbl: 'Ticket Médio', val: fmtK(totals.ticket_medio), sub: totals.n + ' transações pagas', ic: '🎯', cls: 'text-[#115EA3]' },
    { lbl: 'Pacientes Únicos', val: totals.pacientes, sub: `${patients.length} cadastros`, ic: '👤', cls: 'text-gray-900' },
  ];

  return (
    <div className="flex-1 flex bg-[#F3F2F1] text-gray-900 h-full overflow-hidden font-sans">
      {generatedContact && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-sans font-bold text-gray-900 mb-2">Mensagem Gerada (Inteligência Comercial)</h3>
            <p className="text-sm text-gray-500 mb-6">Revise e edite a mensagem sugerida para {generatedContact.p.name}.</p>
            <textarea
              className="w-full h-40 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 focus:outline-none focus:border-[#115EA3] focus:ring-1 focus:ring-[#115EA3] resize-none mb-6"
              value={generatedContact.msg}
              onChange={(e) => setGeneratedContact({...generatedContact, msg: e.target.value})}
            ></textarea>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setGeneratedContact(null)}
                className="px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const { p, action, msg } = generatedContact;
                  setActivities([{ id: Date.now(), paciente: p.name, action, notes: msg, date: new Date().toLocaleDateString() }, ...activities]);
                  window.open(`https://wa.me/${(p.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                  setGeneratedContact(null);
                }}
                className="px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest font-semibold bg-[#115EA3] text-white hover:bg-[#0F5494] transition-colors flex items-center gap-2"
              >
                Salvar & Enviar WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className="w-64 bg-transparent border-none flex flex-col z-10 shrink-0 p-6 xl:p-8">
        <div className="flex flex-col gap-1 flex-1 overflow-y-auto mt-4">
          {NAV_ITEMS.map((item) => (
            <div key={item.id}>
              {item.sec && <div className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-4 mt-6 first:mt-0 px-3">{item.sec}</div>}
              <button
                onClick={() => setPage(item.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl text-[11px] uppercase tracking-widest font-bold transition-all relative border-none",
                  page === item.id 
                    ? "bg-white shadow-sm text-[#115EA3]" 
                    : "text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <div className={cn("w-1.5 h-1.5 rounded-full", page === item.id ? "bg-[#115EA3]" : "bg-gray-200")}></div>
                {item.label}
              </button>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="h-20 min-h-[5rem] bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-8 sticky top-0 z-50">
          <div className="font-sans tracking-tight text-2xl font-extrabold text-gray-900">{NAV_ITEMS.find(i => i.id === page)?.label}</div>
          <div className="flex items-center gap-6">
            {allAvailableMonths.length > 0 && (
              <div className="flex items-center gap-2">
                <select 
                  className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm text-[10px] font-semibold uppercase tracking-widest text-gray-700 px-4 py-2 rounded-xl focus:outline-none focus:border-[#115EA3] transition-all"
                  value={dateFilter?.start || allAvailableMonths[0]}
                  onChange={(e) => {
                    const start = e.target.value;
                    const end = dateFilter?.end || allAvailableMonths[allAvailableMonths.length - 1];
                    setDateFilter({ start, end: start > end ? start : end });
                  }}
                >
                  {allAvailableMonths.map(m => (
                    <option key={`start-${m}`} value={m}>{m.split('-').reverse().join('/')}</option>
                  ))}
                </select>
                <span className="text-gray-400 text-[10px] font-semibold tracking-widest">ATÉ</span>
                <select 
                  className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm text-[10px] font-semibold uppercase tracking-widest text-gray-700 px-4 py-2 rounded-xl focus:outline-none focus:border-[#115EA3] transition-all"
                  value={dateFilter?.end || allAvailableMonths[allAvailableMonths.length - 1]}
                  onChange={(e) => {
                    const end = e.target.value;
                    const start = dateFilter?.start || allAvailableMonths[0];
                    setDateFilter({ start: start > end ? end : start, end });
                  }}
                >
                  {allAvailableMonths.map(m => (
                    <option key={`end-${m}`} value={m}>{m.split('-').reverse().join('/')}</option>
                  ))}
                </select>
              </div>
            )}
            <span className="text-xs uppercase tracking-widest text-[#115EA3] border-b border-[#115EA3] pb-1">
              {monthlyData.length > 0 ? `${monthlyData[0]?.month} a ${monthlyData[monthlyData.length-1]?.month}` : 'Sem dados'}
            </span>
            <span className="text-xs uppercase tracking-widest text-gray-500">{totals.n} Transações</span>
          </div>
        </header>

        <div className="p-10 flex-1">
          {page === 'overview' && (() => {
             const topActiveUsers = [...activePatients].sort((a,b) => (b.txs?.length || 0) - (a.txs?.length || 0)).slice(0, 15).map((p, i) => ({ name: p.name, frequencia: p.txs?.length || 0, rank: `#${i+1}` }));
             const churnRiskFreq = [...activePatients]
               .filter(p => getMonthsSinceLastVisit(p.last_visit || '') >= 2)
               .sort((a,b) => (b.txs?.length || 0) - (a.txs?.length || 0))
               .slice(0, 5);
             const churnRiskLTV = [...activePatients]
               .filter(p => getMonthsSinceLastVisit(p.last_visit || '') >= 2)
               .sort((a,b) => (b.ltv || 0) - (a.ltv || 0))
               .slice(0, 5);
             return (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-5 gap-6 mb-8">
                {kpis.map((k, i) => (
                  <div key={i} className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 relative overflow-hidden group">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-3">{k.lbl}</div>
                    <div className={cn("font-sans font-semibold tracking-tight text-3xl", k.cls)}>{k.val}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-2">{k.sub}</div>
                    <div className="absolute top-6 right-6 text-4xl opacity-[0.04] drop-shadow-sm">{k.ic}</div>
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#115EA3] to-[#0F5494] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="col-span-2 bg-white border border-gray-200 shadow-sm rounded-xl p-8 flex flex-col">
                  <header className="flex justify-between items-end mb-8">
                    <h2 className="text-2xl font-sans font-semibold tracking-tight capitalize tracking-wide">Receita Bruta Mensal</h2>
                    <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">{monthlyData.length > 0 ? `${monthlyData[0]?.month} a ${monthlyData[monthlyData.length-1]?.month}` : 'Sem dados'}</span>
                  </header>
                  <div className="h-[250px] w-full flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData}>
                        <XAxis dataKey="month" stroke="#F3F4F6" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#F3F4F6" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{backgroundColor: '#ffffff', color: '#111827', border: '1px solid #F3F4F6', borderRadius: '2px'}} formatter={(v: number) => fmtFull(v)} />
                        <Line type="monotone" dataKey="cob" stroke="#115EA3" strokeWidth={2} dot={{r:0}} activeDot={{r:4, fill: '#115EA3'}} />
                        <Line type="monotone" dataKey="liq" stroke="#9CA3AF" strokeWidth={2} dot={{r:0}} strokeOpacity={0.3} activeDot={{r:4, fill: '#E0E0E0'}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 flex flex-col">
                  <header className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-sans font-semibold tracking-tight capitalize tracking-wide">Por Categoria</h2>
                  </header>
                  <div className="flex h-[200px] w-full mt-4 items-center">
                    <div className="w-[60%] h-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={kitPieData} innerRadius="60%" outerRadius="100%" paddingAngle={2} dataKey="value" stroke="none">
                            {kitPieData.map((e,i) => <Cell key={i} fill={KIT_COLORS[e.name] || '#9CA3AF'} />)}
                          </Pie>
                          <Tooltip contentStyle={{backgroundColor: '#ffffff', color: '#111827', border: '1px solid #F3F4F6', borderRadius: '12px', padding: '8px 12px', fontSize: '12px'}} formatter={(v: number) => fmtK(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <span className="text-[10px] uppercase tracking-widest text-gray-400">Total</span>
                         <span className="text-lg font-sans font-bold text-gray-900">{fmtK(totals.cob)}</span>
                      </div>
                    </div>
                    <div className="w-[40%] pl-4 flex flex-col gap-3 justify-center">
                       {kitPieData.slice(0, 5).map((k, i) => (
                          <div key={i} className="flex flex-col mb-1 last:mb-0">
                            <div className="flex items-center gap-2">
                               <div className="w-3 h-3 rounded-sm shadow-sm" style={{backgroundColor: KIT_COLORS[k.name] || '#9CA3AF'}}></div>
                               <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 truncate flex-1">{k.name}</span>
                               <span className="text-[10px] text-gray-400 font-semibold">{totals.cob > 0 ? Math.round((k.value / totals.cob) * 100) : 0}%</span>
                            </div>
                            <span className="text-xs font-sans font-extrabold text-gray-900 pl-5">{fmtK(k.value)}</span>
                          </div>
                       ))}
                    </div>
                  </div>
                </div>
              </div>

              {(() => {
                 const currentMonthData = monthlyData[monthlyData.length - 1];
                 const previousMonthData = monthlyData[monthlyData.length - 2];
                 
                 let growthRate = 0;
                 if (currentMonthData && previousMonthData && previousMonthData.cob > 0) {
                    growthRate = ((currentMonthData.cob - previousMonthData.cob) / previousMonthData.cob) * 100;
                 }
               
                 const activeBaseCount = activePatients.filter(p => getMonthsSinceLastVisit(p.last_visit) <= 3).length;
                 const inactiveBaseCount = activePatients.length - activeBaseCount;
                 const activeRate = activePatients.length > 0 ? (activeBaseCount / activePatients.length) * 100 : 0;
                 
                 let topProcMonth = "-";
                 let topProcVol = 0;
                 if (currentMonthData && currentMonthData.procs) {
                    const procs = Object.entries(currentMonthData.procs).sort((a,b) => b[1].n - a[1].n);
                    if (procs.length > 0) {
                        topProcMonth = procs[0][0];
                        topProcVol = procs[0][1].n;
                    }
                 }

                 const ltvMedio = activePatients.length > 0 ? totals.cob / activePatients.length : 0;
                 
                 const last3Months = monthlyData.slice(-3);
                 const avgMonthlyRev = last3Months.length > 0 ? last3Months.reduce((a,b) => a + b.cob, 0) / last3Months.length : 0;
                 const projectedRev = avgMonthlyRev * 1.05; // 5% growth assumption
                 
                 const returningPatients = activePatients.filter(p => (p.txs?.length || 0) > 1).length;
                 const returningRate = activePatients.length > 0 ? (returningPatients / activePatients.length) * 100 : 0;

                 return (
                   <>
                   <div className="grid grid-cols-3 gap-6 mb-6">
                      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 flex flex-col justify-between">
                         <div>
                            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-1">Crescimento Mensal</h3>
                            <div className="font-sans font-semibold text-2xl text-gray-900 mt-2">
                               {currentMonthData ? fmtK(currentMonthData.cob) : '-'}
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">vs {previousMonthData ? fmtK(previousMonthData.cob) : '-'} (mês anterior)</div>
                         </div>
                         <div className="mt-6 flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-xl uppercase tracking-widest ${growthRate >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                               {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest">Ritmo atual</span>
                         </div>
                      </div>

                      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 flex flex-col justify-between">
                         <div>
                            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-1">Saúde da Base</h3>
                            <div className="font-sans font-semibold text-2xl text-gray-900 mt-2">
                               {activeRate.toFixed(1)}% <span className="text-sm font-medium text-gray-500">Ativos</span>
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">{activeBaseCount} pacientes (visitou em &lt;= 3 meses)</div>
                         </div>
                         <div className="mt-6 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden flex">
                            <div className="bg-green-500 h-full" style={{ width: `${activeRate}%` }}></div>
                            <div className="bg-red-200 h-full flex-1"></div>
                         </div>
                      </div>

                      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 flex flex-col justify-between">
                         <div>
                            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-1">Tendência do Mês ({currentMonthData?.month})</h3>
                            <div className="font-sans font-semibold text-xl text-[#115EA3] mt-2 capitalize truncate w-full" title={topProcMonth.toLowerCase()}>
                               {topProcMonth.toLowerCase()}
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Procedimento mais realizado</div>
                         </div>
                         <div className="mt-6 flex items-center gap-2">
                            <span className="text-xs font-semibold px-2 py-1 rounded-xl bg-[#F3F2F1] text-gray-700 uppercase tracking-widest">
                               {topProcVol} execuções
                            </span>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 flex items-center gap-4 group">
                          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                             <Users size={20} />
                          </div>
                          <div>
                             <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">LTV Médio Base</h3>
                             <div className="font-sans font-bold text-lg text-gray-900">{fmtFull(ltvMedio)}</div>
                             <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Média gasta por paciente</div>
                          </div>
                      </div>
                      
                      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 flex items-center gap-4 group">
                          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                             <TrendingUp size={20} />
                          </div>
                          <div>
                             <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">Projeção Próx. Mês</h3>
                             <div className="font-sans font-bold text-lg text-gray-900">{fmtFull(projectedRev)}</div>
                             <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Baseado na média 3m + 5%</div>
                          </div>
                      </div>

                      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 flex items-center gap-4 group">
                          <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                             <RefreshCw size={20} />
                          </div>
                          <div>
                             <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">Taxa de Retorno</h3>
                             <div className="font-sans font-bold text-lg text-gray-900">{returningRate.toFixed(1)}%</div>
                             <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">{returningPatients} pacientes voltaram</div>
                          </div>
                      </div>
                   </div>
                   </>
                 );
              })()}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 flex flex-col">
                  <header className="flex justify-between items-end mb-6">
                     <h2 className="text-xl font-sans font-semibold tracking-tight capitalize tracking-wide">Top 10 Clientes (Por Receita) & Alertas</h2>
                     <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">&gt; 30 dias de constância</span>
                  </header>
                  <div className="flex flex-col gap-2">
                     {[...activePatients].sort((a,b) => (b.ltv || 0) - (a.ltv || 0)).slice(0, 10).map((p, i) => {
                       const mDiff = getMonthsSinceLastVisit(p.last_visit || '');
                       const alert = mDiff >= 1; // 1 month is ~30 days
                       return (
                         <div key={i} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer" onDoubleClick={() => onOpenCrm(p.name)}>
                           <div className="flex flex-col">
                             <span className="font-sans font-medium text-sm text-gray-900 group-hover:text-[#115EA3]">{p.name}</span>
                             <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Última: {p.last_visit ? p.last_visit.split('-').reverse().join('/') : '-'}</span>
                           </div>
                           <div className="flex items-center gap-3">
                             <span className="font-sans font-semibold text-sm text-[#115EA3]">{fmtK(p.ltv || 0)}</span>
                             {alert ? (
                                <span className="flex items-center gap-1 text-[10px] uppercase font-semibold tracking-widest text-red-500 bg-red-50 px-2 py-1.5 rounded-xl"><AlertTriangle size={12} /> {formatAusencia(mDiff)}</span>
                             ) : (
                                <span className="flex items-center gap-1 text-[10px] uppercase font-semibold tracking-widest text-green-600 bg-green-50 px-2 py-1.5 rounded-xl">Ativo</span>
                             )}
                           </div>
                         </div>
                       );
                     })}
                  </div>
                </div>
              
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 flex flex-col">
                  <header className="flex justify-between items-end mb-6">
                     <h2 className="text-xl font-sans font-semibold tracking-tight capitalize tracking-wide">Risco de Churn</h2>
                     <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Top 10 Maior Tempo Sem Visita</span>
                  </header>
                  <div className="flex flex-col gap-2">
                     {[...activePatients].filter(p => !!p.last_visit).sort((a,b) => {
                        const aM = getMonthsSinceLastVisit(a.last_visit || '');
                        const bM = getMonthsSinceLastVisit(b.last_visit || '');
                        if (bM !== aM) return bM - aM;
                        return (b.ltv || 0) - (a.ltv || 0);
                     }).slice(0, 10).map((p, i) => {
                       const mDiff = getMonthsSinceLastVisit(p.last_visit || '');
                       return (
                         <div key={i} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer" onDoubleClick={() => onOpenCrm(p.name)}>
                           <div className="flex flex-col">
                             <span className="font-sans font-medium text-sm text-gray-900 group-hover:text-[#115EA3]">{p.name}</span>
                             <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Última: {p.last_visit ? p.last_visit.split('-').reverse().join('/') : '-'}</span>
                           </div>
                           <div className="flex items-center gap-3">
                             <span className="font-sans font-semibold text-sm text-gray-500">{fmtK(p.ltv || 0)}</span>
                             <span className="flex items-center gap-1 text-[10px] uppercase font-semibold tracking-widest text-[#B38B41] bg-[#B38B41]/10 px-2 py-1.5 rounded-xl"><Users size={12} /> {formatAusencia(mDiff)}</span>
                           </div>
                         </div>
                       );
                     })}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 mt-6">
                 <header className="flex justify-between items-end mb-6">
                    <h2 className="text-xl font-sans font-semibold tracking-tight capitalize tracking-wide">Frequência: Usuários Mais Ativos</h2>
                    <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Top 15 Acessos</span>
                 </header>
                 <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={topActiveUsers} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis dataKey="rank" tick={{fill: '#9CA3AF', fontSize: 10}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fill: '#9CA3AF', fontSize: 10}} axisLine={false} tickLine={false} />
                        <Tooltip 
                           cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '3 3' }}
                           content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                 const data = payload[0].payload;
                                 return (
                                   <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-3">
                                     <p className="font-semibold text-gray-900 text-sm">{data.name}</p>
                                     <p className="text-xs text-gray-500 mt-1">Frequência: {data.frequencia} acessos</p>
                                   </div>
                                 );
                              }
                              return null;
                           }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="frequencia" 
                            stroke="#115EA3" 
                            strokeWidth={3} 
                            dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} 
                            activeDot={{ r: 6, fill: "#115EA3", stroke: "#fff", strokeWidth: 2 }} 
                            animationDuration={1500}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8">
                  <header className="mb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-lg font-sans font-semibold tracking-tight text-gray-900">Alerta de Churn: Alta Frequência</h2>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">Clientes assíduos sem visitas (&gt;= 2m)</p>
                    </div>
                    <AlertTriangle className="text-red-500 opacity-80" size={18} />
                  </header>
                  <div className="flex flex-col gap-2">
                    {churnRiskFreq.map((p, i) => {
                       const mDiff = getMonthsSinceLastVisit(p.last_visit || '');
                       return (
                         <div key={i} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer" onDoubleClick={() => onOpenCrm(p.name)}>
                           <div className="flex flex-col">
                             <span className="font-sans font-medium text-sm text-gray-900 group-hover:text-[#115EA3] transition-colors">{p.name}</span>
                             <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Última: {p.last_visit ? p.last_visit.split('-').reverse().join('/') : '-'}</span>
                           </div>
                           <div className="flex flex-col items-end">
                             <span className="text-xs font-semibold text-[#115EA3]">{p.txs?.length || 0} visitas</span>
                             <span className="text-[10px] text-red-500 font-medium mt-0.5 flex items-center gap-1"><AlertTriangle size={10} /> {formatAusencia(mDiff)}</span>
                           </div>
                         </div>
                       );
                    })}
                    {churnRiskFreq.length === 0 && (
                       <div className="text-center py-6 text-gray-400 text-sm">Nenhum risco detectado.</div>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8">
                  <header className="mb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-lg font-sans font-semibold tracking-tight text-gray-900">Alerta de Churn: Alta Receita (LTV)</h2>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">Clientes rentáveis sem visitas (&gt;= 2m)</p>
                    </div>
                    <Users className="text-[#B38B41] opacity-80" size={18} />
                  </header>
                  <div className="flex flex-col gap-2">
                    {churnRiskLTV.map((p, i) => {
                       const mDiff = getMonthsSinceLastVisit(p.last_visit || '');
                       return (
                         <div key={i} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer" onDoubleClick={() => onOpenCrm(p.name)}>
                           <div className="flex flex-col">
                             <span className="font-sans font-medium text-sm text-gray-900 group-hover:text-[#B38B41] transition-colors">{p.name}</span>
                             <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Última: {p.last_visit ? p.last_visit.split('-').reverse().join('/') : '-'}</span>
                           </div>
                           <div className="flex flex-col items-end">
                             <span className="text-xs font-semibold text-gray-600">{fmtK(p.ltv)}</span>
                             <span className="text-[10px] text-[#B38B41] font-medium mt-0.5 flex items-center gap-1"><Users size={10} /> {formatAusencia(mDiff)}</span>
                           </div>
                         </div>
                       );
                    })}
                    {churnRiskLTV.length === 0 && (
                       <div className="text-center py-6 text-gray-400 text-sm">Nenhum risco detectado.</div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          ); })()}
          {page === 'termos' && (() => {
             const topFreq = activePatients.sort((a,b) => (b.txs?.length || 0) - (a.txs?.length || 0)).slice(0, 8);
             
             const repeatedKitsMap = new Map<string, { kit: string, clientsCount: number, totalRepeats: number }>();
             for (const p of activePatients) {
                 if (!p.txs) continue;
                 const patKitCounts = new Map<string, number>();
                 for (const tx of p.txs) {
                     if (tx.kit) {
                         patKitCounts.set(tx.kit, (patKitCounts.get(tx.kit) || 0) + 1);
                     }
                 }
                 for (const [kit, count] of Array.from(patKitCounts.entries())) {
                     if (count > 1) {
                         if (!repeatedKitsMap.has(kit)) {
                             repeatedKitsMap.set(kit, { kit, clientsCount: 0, totalRepeats: 0 });
                         }
                         const s = repeatedKitsMap.get(kit)!;
                         s.clientsCount += 1;
                         s.totalRepeats += count;
                     }
                 }
             }
             const topRepeatedKits = Array.from(repeatedKitsMap.values())
                 .sort((a, b) => b.clientsCount - a.clientsCount)
                 .slice(0, 12);
             return (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col gap-8 h-full overflow-y-auto pr-4">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8">
                 <header className="flex justify-between items-end mb-8">
                    <h2 className="text-2xl font-sans font-semibold tracking-tight capitalize tracking-wide">Radar de Procedimentos</h2>
                    <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Top 12</span>
                 </header>
                 <div className="h-[350px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <RadarChart data={radarData} outerRadius="75%">
                       <PolarGrid stroke="#F3F4F6" />
                       <PolarAngleAxis dataKey="subject" tick={{fill: '#6B7280', fontSize: 10, }} />
                       <Radar name="Frequência" dataKey="A" stroke="#115EA3" strokeWidth={1.5} fill="#115EA3" fillOpacity={0.1} />
                     </RadarChart>
                   </ResponsiveContainer>
                 </div>
               </div>
               
               
               <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 flex flex-col lg:col-span-2">
                 <header className="flex justify-between items-end mb-8">
                    <h2 className="text-2xl font-sans font-semibold tracking-tight capitalize tracking-wide">Top Consumers</h2>
                    <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Por Frequência (Qtd. Idas)</span>
                 </header>
                 <div className="flex flex-col gap-4 overflow-y-auto max-h-[350px]">
                    {topFreq.map((p, i) => (
                      <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 hover:bg-gray-50/50 p-2 -mx-2 px-2 cursor-pointer transition-colors group">
                        <div className="flex items-center gap-3 flex-1" onClick={() => onOpenCrm(p.name)}>
                           <div className="w-6 h-6 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-semibold">{i+1}</div>
                           <div className="flex flex-col">
                              <span className="font-sans font-semibold text-gray-900 text-sm group-hover:text-[#115EA3] transition-colors">{p.name}</span>
                              <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Última: {p.last_visit || '-'}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end" onClick={() => onOpenCrm(p.name)}>
                               <span className="font-sans text-[#115EA3] font-semibold text-sm">{p.txs?.length || 0} acessos</span>
                               <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{fmtK(p.ltv)} LTV</span>
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const msg = encodeURIComponent(`Olá ${p.name.split(' ')[0]}, tudo bem?`);
                                    window.open(`https://wa.me/${(p.phone || '').replace(/\D/g, '')}?text=${msg}`, '_blank');
                                }} 
                                className="text-gray-300 hover:text-green-500 transition-colors bg-white border border-gray-200 shadow-sm rounded-xl p-1.5 shadow-sm"
                                title="Enviar WhatsApp"
                            >
                                <MessageCircle size={16} />
                            </button>
                        </div>
                      </div>
                    ))}
                 </div>
               </div>
             </div>
             
             <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 mt-2">
                 <header className="flex justify-between items-end mb-8">
                    <h2 className="text-xl font-sans font-semibold tracking-tight capitalize tracking-wide">Top Procedimentos Frequentes (Word Cloud / Detalhes)</h2>
                    <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Termos mais usados</span>
                 </header>
                 <div className="flex flex-wrap gap-3">
                    {radarData.map((d: any, idx) => (
                       <div key={idx} className="bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl flex items-center justify-between min-w-[150px]">
                           <span className="font-sans font-medium text-[#115EA3] text-sm capitalize">{d.subject.toLowerCase()}</span>
                           <span className="text-gray-500 text-xs font-semibold">{d.A}x</span>
                       </div>
                    ))}
                    {Object.entries(termCounts)
                        .filter(([k]) => !radarData.find((r:any) => r.subject === k))
                        .sort((a,b) => b[1] - a[1])
                        .slice(0, 30)
                        .map(([k, v], idx) => (
                       <div key={idx} className="bg-white border border-gray-100 px-4 py-2 rounded-xl flex items-center justify-between min-w-[150px]">
                           <span className="font-sans text-gray-700 text-sm capitalize">{k.toLowerCase()}</span>
                           <span className="text-gray-400 text-xs">{v}x</span>
                       </div>
                    ))}
                 </div>
             </div>

             <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 mt-2">
                 <header className="flex justify-between items-end mb-8">
                    <h2 className="text-xl font-sans font-semibold tracking-tight capitalize tracking-wide">Kits Mais Repetidos</h2>
                    <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Fidelização de Clientes</span>
                 </header>
                 {topRepeatedKits.length === 0 ? (
                    <div className="text-gray-500 text-xs uppercase tracking-widest">Nenhum kit repetido detectado.</div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {topRepeatedKits.map((k, idx) => (
                            <div key={idx} className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex flex-col">
                                <span className="font-sans font-semibold text-[#115EA3] text-sm truncate mb-2" title={k.kit}>{k.kit}</span>
                                <div className="flex justify-between text-xs mt-auto">
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 uppercase tracking-widest text-[9px]">Clientes</span>
                                        <span className="font-medium text-gray-900">{k.clientsCount}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-gray-400 uppercase tracking-widest text-[9px]">Acessos Totais</span>
                                        <span className="font-medium text-gray-900">{k.totalRepeats}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                 )}
             </div>
             
             </div>
             );
          })()}

          {page === 'pacientes' && (() => {
             const vipRisk = activePatients.filter(p => p.ltv >= 20000 && getMonthsSinceLastVisit(p.last_visit) >= 3).sort((a,b) => b.ltv - a.ltv).slice(0, 5);
             const upsellOpps = activePatients.filter(p => p.ltv < 10000 && p.ltv > 2000 && getMonthsSinceLastVisit(p.last_visit) <= 2).sort((a,b) => b.ltv - a.ltv).slice(0, 5);

             const addActivity = (paciente: string, action: string) => {
               const notes = prompt(`Registrar contato para ${paciente} (${action}):`, 'Contato realizado via WhatsApp');
               if (notes) {
                 setActivities([{ id: Date.now(), paciente, action, notes, date: new Date().toLocaleDateString() }, ...activities]);
               }
             };


             const handleAiContact = async (p: any, objective: 'retencao' | 'upsell', action: string) => {
                const apiKey = getApiKey();
                if (!apiKey) return;

                setAiGenerating(p.name);
                try {
                    const ai = new GoogleGenAI({ apiKey });
                    const historyText = p.txs?.map((tx: any) => `${tx.ym}: ${tx.proc} - R$ ${tx.cob}`).join('\n') || 'Sem histórico';
                    const promptText = `Você é um assistente de inteligência comercial de uma clínica de estética de alto padrão.\nO objetivo é criar uma mensagem de WhatsApp para o cliente "${p.name}".\n\nObjetivo do Contato: ${objective === 'retencao' ? 'Retenção/Reativação de VIP (cliente ausente há algum tempo, trazer de volta)' : 'Upsell/Upgrade (cliente ativo com potencial para procedimentos de maior valor)'}\n\nHistórico do Cliente:\n${historyText}\n\nLTV (Valor total já gasto): R$ ${p.ltv}\nÚltima visita: ${p.last_visit || 'Desconhecida'}\n\nInstruções:\n- Crie uma mensagem curta, elegante e persuasiva, pronta para ser enviada por WhatsApp.\n- Seja caloroso, mas mantenha o tom premium da clínica.\n- Não use placeholders como "[Nome da Clínica]" se não souber o nome, apenas evite mencionar ou assuma a postura do profissional.\n- Sugira o próximo passo de forma sutil (ex: agendar uma avaliação, conhecer uma novidade).\n- Retorne APENAS o texto da mensagem, sem explicações adicionais.`;

                    const response = await ai.models.generateContent({
                        model: "gemini-3.5-flash",
                        contents: promptText,
                    });
                    
                    if (response.text) {
                        setGeneratedContact({ p, action, msg: response.text.trim() });
                    }
                } catch (err: any) {
                    console.error(err);
                    if (err.message && err.message.includes('API key not valid')) {
                        localStorage.removeItem('gemini_api_key');
                        alert('Chave de API inválida. Tente novamente.');
                    } else {
                        alert('Erro ao gerar mensagem com IA: ' + err.message);
                    }
                } finally {
                    setAiGenerating(null);
                }
             };

             return (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-y-auto pr-4 h-full pointer-events-auto">
                 <header className="flex justify-between items-end mb-8">
                    <div>
                      <h2 className="text-3xl font-sans font-semibold tracking-tight tracking-wide">Inteligência Comercial</h2>
                      <p className="text-xs text-gray-500 mt-2">Visão proativa de vendas de alto padrão e retenção.</p>
                    </div>
                 </header>

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                   {/* VIP EM RISCO */}
                   <div className="bg-white border border-red-200 rounded-xl p-6">
                     <h3 className="text-lg font-sans font-semibold tracking-tight text-red-700 mb-2">Risco Evasão VIP</h3>
                     <p className="text-xs text-red-500 uppercase tracking-widest mb-6">LTV &gt; 20k, inativos &gt; 3 meses</p>
                     <div className="flex flex-col gap-4">
                       {vipRisk.map((p, i) => (
                         <div key={i} className="flex flex-col border border-red-100 bg-red-50/30 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-sans font-semibold text-gray-900 cursor-pointer hover:text-[#115EA3] transition-colors" onDoubleClick={() => onOpenCrm(p.name)}>{p.name}</span>
                              <span className="text-red-600 font-sans font-semibold text-sm">{fmtK(p.ltv)} ({getMonthsSinceLastVisit(p.last_visit)}m ausente)</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <button onClick={() => handleAiContact(p, 'retencao', 'Convite Evento VIP / Retenção')} disabled={aiGenerating === p.name} className="bg-red-600 text-white px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider hover:bg-red-700 transition-colors flex items-center gap-1">
                                {aiGenerating === p.name ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />} Ação: Convite / Ligar
                              </button>
                              <a href={`https://wa.me/${(p.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-[10px] text-gray-600 uppercase tracking-widest border border-gray-300 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">Enviar WhatsApp</a>
                            </div>
                         </div>
                       ))}
                       {vipRisk.length === 0 && <span className="text-xs text-gray-500">Zero VIPs em risco.</span>}
                     </div>
                   </div>

                   {/* OPORTUNIDADES UPSELL */}
                   <div className="bg-white border border-green-200 rounded-xl p-6">
                     <h3 className="text-lg font-sans font-semibold tracking-tight text-green-700 mb-2">Oportunidades de Upsell</h3>
                     <p className="text-xs text-green-600 uppercase tracking-widest mb-6">LTV &lt; 10k, ativos recentes (0-2 meses)</p>
                     <div className="flex flex-col gap-4">
                       {upsellOpps.map((p, i) => (
                         <div key={i} className="flex flex-col border border-green-100 bg-green-50/30 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-sans font-semibold text-gray-900 cursor-pointer hover:text-[#115EA3] transition-colors" onDoubleClick={() => onOpenCrm(p.name)}>{p.name}</span>
                              <span className="text-green-700 font-sans font-semibold text-sm">{fmtK(p.ltv)} ({getMonthsSinceLastVisit(p.last_visit)}m ausente)</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <button onClick={() => handleAiContact(p, 'upsell', 'Oferta Lifting / Upgrade')} disabled={aiGenerating === p.name} className="bg-green-600 text-white px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider hover:bg-green-700 transition-colors flex items-center gap-1">
                                {aiGenerating === p.name ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />} Ação: Oferta Upgrade
                              </button>
                              <a href={`https://wa.me/${(p.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-[10px] text-gray-600 uppercase tracking-widest border border-gray-300 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">Enviar WhatsApp</a>
                            </div>
                         </div>
                       ))}
                       {upsellOpps.length === 0 && <span className="text-xs text-gray-500">Sem oportunidades no momento.</span>}
                     </div>
                   </div>
                 </div>

                 {/* REGISTRO DE ATIVIDADES */}
                 <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 mb-8">
                   <h3 className="text-lg font-sans font-semibold tracking-tight text-gray-900 mb-6">Registro de Contatos Recentes</h3>
                   {activities.length === 0 ? (
                      <p className="text-xs text-gray-500 uppercase tracking-widest">Nenhhum contato registrado na sessão atual.</p>
                   ) : (
                      <div className="flex flex-col gap-3">
                        {activities.map(a => (
                          <div key={a.id} className="border-b border-gray-100 pb-3 flex flex-col gap-1">
                             <div className="flex justify-between">
                               <span className="text-sm font-sans font-semibold text-[#115EA3] cursor-pointer" onDoubleClick={() => onOpenCrm(a.paciente)}>{a.paciente}</span>
                               <span className="text-[10px] text-gray-400">{a.date}</span>
                             </div>
                             <span className="text-xs text-gray-700 font-medium">{a.action}</span>
                             <p className="text-[11px] text-gray-500">{a.notes}</p>
                          </div>
                        ))}
                      </div>
                   )}
                 </div>

                 {/* TABELA DE PACIENTES */}
                 {(() => {
                   const handlePatSort = (col: string) => {
                      if (patSortCol === col) setPatSortAsc(!patSortAsc);
                      else { setPatSortCol(col); setPatSortAsc(true); }
                   };

                   const sortedPats = [...activePatients].sort((a,b) => {
                      let vA = (a as any)[patSortCol];
                      let vB = (b as any)[patSortCol];
                      if (patSortCol === 'txsLength') {
                         vA = a.txs?.length || 0;
                         vB = b.txs?.length || 0;
                      }
                      
                      if (vA === undefined || vA === null) vA = '';
                      if (vB === undefined || vB === null) vB = '';
                      
                      if (typeof vA === 'string' && typeof vB === 'string') {
                         return patSortAsc ? vA.localeCompare(vB) : vB.localeCompare(vA);
                      }
                      if (typeof vA === 'number' && typeof vB === 'number') {
                         return patSortAsc ? vA - vB : vB - vA;
                      }
                      return 0;
                   });

                   return (
                     <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden mt-8">
                       <header className="p-8 pb-4">
                         <h3 className="text-xl font-sans font-semibold tracking-tight text-gray-900">Base de Pacientes Integrada</h3>
                         <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">Todos os clientes ativos</p>
                       </header>
                       <table className="w-full text-left text-[11px] uppercase tracking-widest border-collapse">
                         <thead className="bg-gray-50 border-b border-t border-gray-200">
                           <tr className="text-gray-500">
                             <th className="py-4 px-6 font-normal relative cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handlePatSort('name')}>Paciente {patSortCol === 'name' && (patSortAsc ? '↑' : '↓')}</th>
                             <th className="py-4 px-6 font-normal relative cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handlePatSort('last_visit')}>Última Visita {patSortCol === 'last_visit' && (patSortAsc ? '↑' : '↓')}</th>
                             <th className="py-4 px-6 font-normal relative cursor-pointer hover:bg-gray-100 transition-colors text-center" onClick={() => handlePatSort('txsLength')}>Nº Transações {patSortCol === 'txsLength' && (patSortAsc ? '↑' : '↓')}</th>
                             <th className="py-4 px-6 font-normal relative text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handlePatSort('ltv')}>LTV Total {patSortCol === 'ltv' && (patSortAsc ? '↑' : '↓')}</th>
                           </tr>
                         </thead>
                         <tbody>
                           {sortedPats.map((p, i) => (
                             <tr key={i} className="border-b border-gray-100/50 hover:bg-[#115EA3]/5 transition-colors cursor-pointer" onDoubleClick={() => onOpenCrm(p.name)}>
                                <td className="py-4 px-6 text-[#115EA3] font-sans font-medium">{p.name}</td>
                                <td className="py-4 px-6 text-gray-600">{p.last_visit || '-'} <span className="opacity-50 text-[9px]">({formatAusencia(getMonthsSinceLastVisit(p.last_visit || ''))})</span></td>
                                <td className="py-4 px-6 text-gray-600 text-center">{p.txs?.length || 0}</td>
                                <td className="py-4 px-6 text-right font-sans font-semibold tracking-tight text-[14px] text-gray-900">{fmtK(p.ltv || 0)}</td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   );
                 })()}
               </div>
             );
          })()}

          {page === 'tendencia' && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col gap-8 h-full overflow-y-auto pr-4">
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 flex flex-col min-h-[400px]">
                  <header className="flex justify-between items-end mb-8">
                    <h2 className="text-2xl font-sans font-semibold tracking-tight capitalize tracking-wide">Evolução de Receita / Ticket Médio</h2>
                  </header>
                  <div className="w-full relative h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData}>
                        <XAxis dataKey="month" stroke="#F3F4F6" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" stroke="#F3F4F6" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                        <YAxis yAxisId="right" orientation="right" stroke="#115EA3" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `R$${v}`} />
                        <Tooltip contentStyle={{backgroundColor: '#ffffff', color: '#111827', border: '1px solid #F3F4F6', borderRadius: '2px'}} formatter={(v: number) => fmtFull(v)} />
                        <Line yAxisId="left" type="monotone" name="Receita" dataKey="cob" stroke="#115EA3" strokeWidth={2} dot={{r:0}} activeDot={{r:4, fill: '#115EA3'}} />
                        <Line yAxisId="right" type="monotone" name="Ticket Médio" dataKey={(d) => Math.round(d.n > 0 ? d.cob / d.n : 0)} stroke="#9CA3AF" strokeOpacity={0.8} strokeDasharray="5 5" strokeWidth={2} dot={{r:0}} activeDot={{r:4, fill: '#E0E0E0'}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8">
                  <header className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-sans font-semibold tracking-tight capitalize tracking-wide">Top Procedimentos por Mês (Coluna D)</h2>
                    <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Frequência & Receita</span>
                  </header>
                  <div className="overflow-x-auto pb-4">
                     <div className="flex gap-4">
                        {monthlyData.map((m, i) => {
                           const topProcs = Object.entries(m.procs || {})
                              .map(([name, stats]) => ({ name, ...(stats as any) }))
                              .sort((a,b) => b.cob - a.cob)
                              .slice(0, 5);
                           return (
                             <div key={i} className="min-w-[280px] bg-gray-50 border border-gray-200 p-5 rounded-xl">
                               <div className="font-sans font-semibold tracking-tight text-lg mb-4 text-[#115EA3]">{m.month}</div>
                               <div className="flex flex-col gap-3">
                                 {topProcs.map((p, j) => (
                                    <div key={j} className="flex flex-col border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                                      <span className="text-xs font-medium text-gray-800 line-clamp-1" title={p.name}>{p.name}</span>
                                      <div className="flex justify-between items-center mt-1">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-widest">{p.n} itens</span>
                                        <span className="text-xs text-[#115EA3] font-semibold">{fmtK(p.cob)}</span>
                                      </div>
                                    </div>
                                 ))}
                               </div>
                             </div>
                           );
                        })}
                     </div>
                  </div>
                </div>

                {/* Agente Analítico */}
                <div className="bg-white border border-[#115EA3]/20 rounded-xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#115EA3]"></div>
                  <header className="flex justify-between items-end mb-6">
                    <div>
                      <h2 className="text-2xl font-sans font-semibold tracking-tight text-[#115EA3] tracking-wide">Agente Analítico Integrado</h2>
                      <p className="text-xs text-gray-500 mt-1">Análise automatizada de histórico, receita e frequência para sugestões comerciais.</p>
                    </div>
                    <div className="text-[10px] text-white bg-[#115EA3] px-2 py-1 rounded-xl uppercase tracking-[0.2em] animate-pulse">Ativo</div>
                  </header>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(() => {
                      // Agent Logic
                      const suggestions = [];
                      
                      // 1. Top Revenue Procedure
                      let topProc = "";
                      let topCob = 0;
                      if (monthlyData.length > 0) {
                        const lastMonth = monthlyData[monthlyData.length - 1];
                        const procs = Object.entries(lastMonth.procs || {}).map(([name, stats]) => ({ name, ...(stats as any) }));
                        procs.sort((a,b) => b.cob - a.cob);
                        if (procs.length > 0) {
                          topProc = procs[0].name;
                          topCob = procs[0].cob;
                        }
                      }
                      
                      if (topProc) {
                        suggestions.push({
                          title: "Campanha de Retargeting: " + topProc.split(' ')[0],
                          desc: `O procedimento '${topProc}' liderou a receita no último período ativo. O agente sugere configurar alertas para os clientes deste procedimento após 15 dias, oferecendo um retorno de avaliação ou pacote associado.`
                        });
                      } else {
                        suggestions.push({
                          title: "Campanha de Retargeting",
                          desc: "Identifique seu procedimento carro-chefe e configure alertas de retorno a cada 30 dias para incentivar LTV contínuo."
                        });
                      }

                      // 2. Cross-sell opportunity
                      const kitsSorted = [...kitPieData].sort((a,b) => b.value - a.value);
                      if (kitsSorted.length >= 2) {
                        const kit1 = kitsSorted[0].name;
                        const kit2 = kitsSorted[1].name;
                        suggestions.push({
                          title: "Oportunidade Cross-Sell",
                          desc: `Houve alta procura por '${kit1}'. O agente identificou sinergia forte para upsell com '${kit2}'. Crie combos unificando estes dois kits e dispare para clientes inativos há > 60 dias.`
                        });
                      } else {
                        suggestions.push({
                          title: "Expansão de Categorias",
                          desc: "Diversifique os pacotes oferecidos. Baseado no histórico, clientes que compram pacotes corporais tendem a focar mais se receberem pequenos benefícios faciais como cortesia controlada."
                        });
                      }

                      // 3. Frequency / Drops
                      suggestions.push({
                        title: "Frequência: Pacientes One-Off",
                        desc: "Historicamente, uma parcela considerável realiza apenas uma sessão e não retorna. O agente sugere implementar um bot de WhatsApp D+7 (7 dias pós-procedimento) focado exclusivamente em colher feedback, aumentando a retenção."
                      });

                      return suggestions.map((s, idx) => (
                        <div key={idx} className="bg-[#115EA3]/5 border border-[#115EA3]/10 p-5 rounded-xl flex flex-col gap-2">
                           <h4 className="font-sans font-semibold tracking-tight text-sm text-[#115EA3]">{s.title}</h4>
                           <p className="text-xs text-gray-700 leading-relaxed">{s.desc}</p>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
             </div>
          )}

          {page === 'transacoes' && (() => {
             const handleSort = (col: string) => {
                if (txSortCol === col) setTxSortAsc(!txSortAsc);
                else { setTxSortCol(col); setTxSortAsc(true); }
             };
             
             const sortedTxs = [...allTxs].sort((a,b) => {
                let vA = (a as any)[txSortCol];
                let vB = (b as any)[txSortCol];
                if (vA === undefined || vA === null) vA = '';
                if (vB === undefined || vB === null) vB = '';
                
                if (typeof vA === 'string' && typeof vB === 'string') {
                   return txSortAsc ? vA.localeCompare(vB) : vB.localeCompare(vA);
                }
                if (typeof vA === 'number' && typeof vB === 'number') {
                   return txSortAsc ? vA - vB : vB - vA;
                }
                return 0;
             });

             return (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-y-auto pr-4 h-full relative border border-gray-200 bg-white rounded-xl">
                 <table className="w-full text-left text-[11px] uppercase tracking-widest border-collapse">
                   <thead className="sticky top-0 bg-white z-10 before:absolute before:inset-0 before:border-b before:border-gray-200">
                     <tr className="text-gray-500">
                       <th className="py-4 px-6 font-normal relative relative cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('ym')}>Data {txSortCol === 'ym' && (txSortAsc ? '↑' : '↓')}</th>
                       <th className="py-4 px-6 font-normal relative relative cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('paciente')}>Paciente {txSortCol === 'paciente' && (txSortAsc ? '↑' : '↓')}</th>
                       <th className="py-4 px-6 font-normal relative relative cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('proc')}>Procedimento {txSortCol === 'proc' && (txSortAsc ? '↑' : '↓')}</th>
                       <th className="py-4 px-6 font-normal relative relative cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('kit')}>Categoria {txSortCol === 'kit' && (txSortAsc ? '↑' : '↓')}</th>
                       <th className="py-4 px-6 font-normal relative text-right relative cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('cob')}>Valor {txSortCol === 'cob' && (txSortAsc ? '↑' : '↓')}</th>
                     </tr>
                   </thead>
                   <tbody>
                     {sortedTxs.slice(0, 500).map((tx, i) => (
                       <tr key={i} className="border-b border-gray-200 hover:bg-[#115EA3]/5 transition-colors cursor-pointer" onDoubleClick={() => onOpenCrm(tx.paciente)}>
                          <td className="py-4 px-6 whitespace-nowrap">{tx.ym}</td>
                          <td className="py-4 px-6 text-[#115EA3]">{tx.paciente}</td>
                          <td className="py-4 px-6 text-gray-700 max-w-[300px] truncate" title={tx.proc}>{tx.proc}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: KIT_COLORS[tx.kit || 'OUTROS'] || KIT_COLORS['OUTROS'] }}></div>
                              <span className="text-gray-900 font-medium">{tx.kit || "OUTROS"}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right font-sans font-semibold tracking-tight text-[14px]">{fmtK(tx.cob || 0)}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
             );
          })()}

          {page === 'kits' && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <header className="flex justify-between items-end mb-8">
                   <h2 className="text-3xl font-sans font-semibold tracking-tight tracking-wide">Receita por Categoria</h2>
                   <button onClick={handleAiAnalysis} disabled={aiLoading} className="text-xs uppercase tracking-widest font-semibold bg-[#115EA3] hover:bg-[#0F5494] text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
                     <Sparkles size={14} />
                     {aiLoading ? 'Analisando...' : 'Diretor de Marketing IA'}
                   </button>
                </header>
                
                {aiAnalysis && (
                  <div className="bg-white border border-[#115EA3] rounded-xl p-8 mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex items-center gap-3 mb-4 text-[#115EA3]">
                      <Sparkles size={20} />
                      <h3 className="font-sans font-semibold text-lg uppercase tracking-widest">Análise Estratégica</h3>
                    </div>
                    <div className="markdown-body text-sm text-gray-700 leading-relaxed font-sans">
                      <Markdown>{aiAnalysis}</Markdown>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {kitPieData.map((k, i) => (
                     <div key={i} onClick={() => setSelectedKit(k.name)} className={`border rounded-xl p-6 relative overflow-hidden group cursor-pointer transition-colors ${selectedKit === k.name ? 'bg-gray-50 border-[#115EA3]' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                       <div className="flex items-center gap-3 mb-4">
                         <div className="w-3 h-3 rounded-xl" style={{ backgroundColor: KIT_COLORS[k.name] || KIT_COLORS['OUTROS'] }}></div>
                         <div className="text-[10px] uppercase tracking-[0.2em]">{k.name}</div>
                       </div>
                       <div className="font-sans font-semibold tracking-tight text-3xl mb-1 text-[#115EA3]">{fmtK(k.value)}</div>
                       <div className="text-[10px] text-gray-500 tracking-widest">{Math.round(totals.cob > 0 ? (k.value / totals.cob) * 100 : 0)}% da receita total</div>
                       <div className="absolute -right-4 -bottom-4 text-[120px] font-sans font-semibold tracking-tight opacity-[0.02] group-hover:opacity-[0.05] transition-opacity select-none">{i + 1}</div>
                     </div>
                   ))}
                </div>

                {!selectedKit && (() => {
                   const handleKitSort = (col: string) => {
                      if (kitSortCol === col) setKitSortAsc(!kitSortAsc);
                      else { setKitSortCol(col); setKitSortAsc(true); }
                   };

                   const kitDataMapped = kitPieData.map((k) => {
                      const itemsCount = allTxs.filter(tx => (tx.kit || 'OUTROS') === k.name).length;
                      const tme = itemsCount > 0 ? k.value / itemsCount : 0;
                      const perc = totals.cob > 0 ? (k.value / totals.cob) * 100 : 0;
                      return { name: k.name, value: k.value, itemsCount, tme, perc };
                   });

                   kitDataMapped.sort((a,b) => {
                      let vA = (a as any)[kitSortCol];
                      let vB = (b as any)[kitSortCol];
                      if (typeof vA === 'string' && typeof vB === 'string') {
                         return kitSortAsc ? vA.localeCompare(vB) : vB.localeCompare(vA);
                      }
                      if (typeof vA === 'number' && typeof vB === 'number') {
                         return kitSortAsc ? vA - vB : vB - vA;
                      }
                      return 0;
                   });

                   return (
                   <div className="mt-8 border-t border-gray-200 pt-8 animate-in fade-in slide-in-from-top-2 duration-500">
                     <h3 className="text-xl font-sans font-semibold tracking-tight tracking-wide text-gray-900 mb-6">Detalhamento Geral</h3>
                     <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                        <table className="w-full text-left text-[11px] uppercase tracking-widest border-collapse">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr className="text-gray-500">
                              <th className="py-4 px-6 font-normal relative cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleKitSort('name')}>Categoria {kitSortCol === 'name' && (kitSortAsc ? '↑' : '↓')}</th>
                              <th className="py-4 px-6 font-normal relative text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleKitSort('itemsCount')}>Volume (Itens) {kitSortCol === 'itemsCount' && (kitSortAsc ? '↑' : '↓')}</th>
                              <th className="py-4 px-6 font-normal relative text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleKitSort('tme')}>Ticket Médio {kitSortCol === 'tme' && (kitSortAsc ? '↑' : '↓')}</th>
                              <th className="py-4 px-6 font-normal relative text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleKitSort('value')}>Receita Total {kitSortCol === 'value' && (kitSortAsc ? '↑' : '↓')}</th>
                              <th className="py-4 px-6 font-normal relative text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleKitSort('perc')}>Participação {kitSortCol === 'perc' && (kitSortAsc ? '↑' : '↓')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {kitDataMapped.map((k, i) => {
                              return (
                                <tr key={i} onClick={() => setSelectedKit(k.name)} className="border-b border-gray-100/50 hover:bg-[#115EA3]/5 transition-colors cursor-pointer">
                                   <td className="py-4 px-6">
                                     <div className="flex items-center gap-2">
                                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: KIT_COLORS[k.name] || KIT_COLORS['OUTROS'] }}></div>
                                       <span className="text-gray-900 font-medium">{k.name}</span>
                                     </div>
                                   </td>
                                   <td className="py-4 px-6 text-right text-gray-600">{k.itemsCount}</td>
                                   <td className="py-4 px-6 text-right text-gray-600">{fmtK(k.tme)}</td>
                                   <td className="py-4 px-6 text-right font-sans font-semibold tracking-tight text-[14px] text-[#115EA3]">{fmtK(k.value || 0)}</td>
                                   <td className="py-4 px-6 text-right text-gray-600">{k.perc.toFixed(1)}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                     </div>
                   </div>
                   );
                })()}

                {selectedKit && (() => {
                   const handleKitTxSort = (col: string) => {
                      if (kitTxSortCol === col) setKitTxSortAsc(!kitTxSortAsc);
                      else { setKitTxSortCol(col); setKitTxSortAsc(true); }
                   };

                   const kitTxs = allTxs.filter(tx => (tx.kit || 'OUTROS') === selectedKit);
                   kitTxs.sort((a,b) => {
                      let vA = (a as any)[kitTxSortCol];
                      let vB = (b as any)[kitTxSortCol];
                      if (vA === undefined || vA === null) vA = '';
                      if (vB === undefined || vB === null) vB = '';
                      if (typeof vA === 'string' && typeof vB === 'string') {
                         return kitTxSortAsc ? vA.localeCompare(vB) : vB.localeCompare(vA);
                      }
                      if (typeof vA === 'number' && typeof vB === 'number') {
                         return kitTxSortAsc ? vA - vB : vB - vA;
                      }
                      return 0;
                   });

                   return (
                   <div className="mt-8 animate-in fade-in slide-in-from-top-2 duration-500 border-t border-gray-200 pt-8">
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-sans font-semibold tracking-tight tracking-wide text-gray-900">
                           Itens na Categoria: <span style={{color: KIT_COLORS[selectedKit] || KIT_COLORS['OUTROS']}}>{selectedKit}</span>
                        </h3>
                        <button onClick={() => setSelectedKit(null)} className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-xl bg-white uppercase tracking-widest text-[10px] font-semibold">Fechar</button>
                     </div>
                     <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                        <table className="w-full text-left text-[11px] uppercase tracking-widest border-collapse">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr className="text-gray-500">
                              <th className="py-4 px-6 font-normal relative cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleKitTxSort('ym')}>Data {kitTxSortCol === 'ym' && (kitTxSortAsc ? '↑' : '↓')}</th>
                              <th className="py-4 px-6 font-normal relative cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleKitTxSort('paciente')}>Paciente {kitTxSortCol === 'paciente' && (kitTxSortAsc ? '↑' : '↓')}</th>
                              <th className="py-4 px-6 font-normal relative cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleKitTxSort('proc')}>Procedimento {kitTxSortCol === 'proc' && (kitTxSortAsc ? '↑' : '↓')}</th>
                              <th className="py-4 px-6 font-normal relative text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleKitTxSort('cob')}>Valor {kitTxSortCol === 'cob' && (kitTxSortAsc ? '↑' : '↓')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {kitTxs.map((tx, i) => (
                              <tr key={i} className="border-b border-gray-100/50 hover:bg-[#115EA3]/5 transition-colors cursor-pointer" onDoubleClick={() => onOpenCrm(tx.paciente)}>
                                 <td className="py-4 px-6 whitespace-nowrap">{tx.ym}</td>
                                 <td className="py-4 px-6 text-[#115EA3]">{tx.paciente}</td>
                                 <td className="py-4 px-6 text-gray-700">{tx.proc}</td>
                                 <td className="py-4 px-6 text-right font-sans font-semibold tracking-tight text-[14px]">{fmtK(tx.cob || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                     </div>
                   </div>
                   );
                })()}
             </div>
          )}

          {page === 'procedimentos' && (() => {
             const handleProcSort = (col: string) => {
                if (procListSortCol === col) setProcListSortAsc(!procListSortAsc);
                else { setProcListSortCol(col); setProcListSortAsc(true); }
             };

             const procMap = new Map<string, { name: string, count: number, cob: number, cons: number }>();
             allTxs.forEach(tx => {
                const pName = tx.proc || 'Indefinido';
                if (!procMap.has(pName)) {
                   procMap.set(pName, { name: pName, count: 0, cob: 0, cons: 0 });
                }
                const s = procMap.get(pName)!;
                s.count += 1;
                s.cob += (tx.cob || 0);
                s.cons += (tx.cons || 0);
             });
             let procData = Array.from(procMap.values()).map(s => ({
                ...s,
                tme: s.count > 0 ? s.cob / s.count : 0,
                margin: s.cob > 0 ? ((s.cob - s.cons) / s.cob) * 100 : ((s.cons > 0 && s.cob === 0) ? -100 : 0)
             }));
             
             if (procSearchTerm.trim() !== '') {
                const term = procSearchTerm.toLowerCase();
                procData = procData.filter(s => s.name.toLowerCase().includes(term));
             }

             procData.sort((a,b) => {
                let vA = (a as any)[procListSortCol];
                let vB = (b as any)[procListSortCol];
                if (typeof vA === 'string' && typeof vB === 'string') {
                   return procListSortAsc ? vA.localeCompare(vB) : vB.localeCompare(vA);
                }
                if (typeof vA === 'number' && typeof vB === 'number') {
                   return procListSortAsc ? vA - vB : vB - vA;
                }
                return 0;
             });

             return (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-y-auto pr-4 h-full relative border border-gray-200 bg-white rounded-xl p-8">
                   <header className="flex justify-between items-end mb-8">
                      <div>
                         <h2 className="text-3xl font-sans font-semibold tracking-tight tracking-wide">Desempenho por Procedimento</h2>
                         <p className="text-xs text-gray-500 mt-2 uppercase tracking-widest">Análise unitária de procedimentos e pacotes</p>
                      </div>
                      <div className="relative">
                         <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search size={14} className="text-gray-400" />
                         </div>
                         <input 
                            type="text" 
                            placeholder="Buscar procedimento..." 
                            value={procSearchTerm}
                            onChange={(e) => setProcSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#115EA3]/20 focus:border-[#115EA3] w-64 bg-white"
                         />
                      </div>
                   </header>
                   <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden mb-8">
                      <table className="w-full text-left text-[11px] uppercase tracking-widest border-collapse">
                         <thead className="sticky top-0 bg-gray-50 z-10 before:absolute before:inset-0 before:border-b before:border-gray-200">
                            <tr className="text-gray-500">
                               <th className="py-4 px-6 font-normal relative cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleProcSort('name')}>Procedimento / Pacote {procListSortCol === 'name' && (procListSortAsc ? '↑' : '↓')}</th>
                               <th className="py-4 px-6 font-normal relative text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleProcSort('count')}>Volume (Itens) {procListSortCol === 'count' && (procListSortAsc ? '↑' : '↓')}</th>
                               <th className="py-4 px-6 font-normal relative text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleProcSort('tme')}>Ticket Médio {procListSortCol === 'tme' && (procListSortAsc ? '↑' : '↓')}</th>
                               <th className="py-4 px-6 font-normal relative text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleProcSort('cons')}>Custo (Consumo) {procListSortCol === 'cons' && (procListSortAsc ? '↑' : '↓')}</th>
                               <th className="py-4 px-6 font-normal relative text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleProcSort('margin')}>Margem % {procListSortCol === 'margin' && (procListSortAsc ? '↑' : '↓')}</th>
                               <th className="py-4 px-6 font-normal relative text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleProcSort('cob')}>Receita Total {procListSortCol === 'cob' && (procListSortAsc ? '↑' : '↓')}</th>
                            </tr>
                         </thead>
                         <tbody>
                            {procData.map((s, i) => (
                               <tr key={i} className="border-b border-gray-100/50 hover:bg-[#115EA3]/5 transition-colors">
                                  <td className="py-4 px-6 text-[#115EA3] font-medium max-w-[300px] truncate" title={s.name}>{s.name}</td>
                                  <td className="py-4 px-6 text-right text-gray-600">{s.count}</td>
                                  <td className="py-4 px-6 text-right text-gray-600">{fmtK(s.tme)}</td>
                                  <td className="py-4 px-6 text-right text-gray-400">{fmtK(s.cons)}</td>
                                  <td className="py-4 px-6 text-right font-medium text-gray-900">{s.margin.toFixed(1)}%</td>
                                  <td className="py-4 px-6 text-right font-sans font-semibold tracking-tight text-[14px] text-gray-900">{fmtK(s.cob)}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             );
          })()}

          {page === 'anomalias' && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-y-auto pr-4 h-full relative border border-gray-200 bg-white rounded-xl p-8">
                <header className="flex justify-between items-end mb-8">
                   <h2 className="text-3xl font-sans font-semibold tracking-tight tracking-wide">Monitoramento de Anomalias</h2>
                   <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Cortesias e Alto Consumível</span>
                </header>
                <div className="space-y-6">
                   {allTxs.filter(tx => tx.cob === 0 || (tx.cob > 0 && tx.cons / tx.cob > 0.4)).length === 0 ? (
                     <div className="text-gray-500 text-xs uppercase tracking-widest">Nenhuma anomalia detectada.</div>
                   ) : allTxs.filter(tx => tx.cob === 0 || (tx.cob > 0 && tx.cons / tx.cob > 0.4)).map((tx, i) => (
                     <div key={i} onClick={() => onOpenCrm(tx.paciente)} className="bg-gray-50 border border-red-500/20 rounded-xl p-5 flex items-center justify-between cursor-pointer hover:border-red-500/50 hover:bg-red-50/10 transition-colors group">
                       <div>
                         <div className="font-sans font-semibold tracking-tight text-[16px] text-red-600 group-hover:text-red-700">{tx.paciente}</div>
                         <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">{tx.proc}</div>
                         <div className="text-[10px] uppercase tracking-widest text-red-500 mt-1">
                           {tx.cob === 0 ? "CORTESIA NÃO IDENTIFICADA" : "ALTO CUSTO DE CONSUMÍVEL (>40%)"}
                         </div>
                       </div>
                       <div className="text-right">
                         <div className="text-gray-600 font-sans font-semibold tracking-tight text-[14px]">Cobrado: {fmtK(tx.cob || 0)}</div>
                         <div className="text-gray-600 font-sans font-semibold tracking-tight text-[14px]">Consumível: {fmtK(tx.cons || 0)}</div>
                       </div>
                     </div>
                   ))}
                </div>
             </div>
          )}

          {page === 'plano' && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-y-auto pr-4 h-full">
                <header className="flex justify-between items-end mb-8">
                   <h2 className="text-3xl font-sans font-semibold tracking-tight tracking-wide">Próximos Passos</h2>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <label className="bg-white border border-[#115EA3]/20 rounded-xl p-8 flex flex-col items-start gap-4 hover:border-[#115EA3] transition-colors cursor-pointer w-full relative">
                      {role !== "crm" && <input type="file" multiple accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} disabled={isSyncing} />}
{role === "crm" && <div className="absolute inset-0 z-10" onClick={(e) => { e.preventDefault(); alert("Acesso negado: Usuário CRM não pode importar ou exportar planilhas."); }}></div>}
                      <div className="text-[#115EA3]"><Target size={24} className={isSyncing ? "animate-spin" : ""} /></div>
                      <h3 className="font-sans font-semibold tracking-tight text-xl">{isSyncing ? "Processando..." : "Importar Base de Dados (Mesclar Arquivos)"}</h3>
                      <p className="text-xs text-gray-600 leading-relaxed uppercase tracking-widest">
                         Selecione uma ou múltiplas planilhas de fontes diferentes para combinar em uma única base de dados. Registros duplicados serão identificados e removidos automaticamente.
                      </p>
                   </label>
                   <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 flex flex-col items-start gap-4 hover:border-gray-300 transition-colors cursor-pointer" onClick={() => setPage('pacientes')}>
                      <div className="text-gray-600"><Users size={24} /></div>
                      <h3 className="font-sans font-semibold tracking-tight text-xl">Acompanhamento de Recorrência</h3>
                      <p className="text-xs text-gray-600 leading-relaxed uppercase tracking-widest">
                         Focar os esforços em clientes Tier A (LTV &gt; 50k) que não retornam há mais de 6 meses. Clique para ver.
                      </p>
                   </div>
                   <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 flex flex-col items-start gap-4 hover:border-gray-300 transition-colors cursor-pointer" onClick={() => setPage('kits')}>
                      <div className="text-gray-600"><Grid size={24} /></div>
                      <h3 className="font-sans font-semibold tracking-tight text-xl">Expansão Lifting Premium</h3>
                      <p className="text-xs text-gray-600 leading-relaxed uppercase tracking-widest">
                         Analisar campanhas para conversão de pacientes "Pele & Rejuvenescimento" em tickets maiores. Clique para ver categorias.
                      </p>
                   </div>
                </div>
             </div>
          )}
        </div>
        
        <footer className="h-12 bg-white border-t border-gray-200 px-10 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-gray-400 shrink-0">
          <div>Unified Architecture v1.0.4</div>
          <div>System Encrypted & Secured</div>
        </footer>
      </main>
    </div>
  );
}
