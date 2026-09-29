import { useState, useEffect } from 'react';
import { Activity, Users, FileText, Target, Shield } from 'lucide-react';
import { DashboardView } from './views/DashboardView';
import { CrmView } from './views/CrmView';
import { CrmOverviewView } from './views/CrmOverviewView';
import { LoginView } from './views/LoginView';
import { ProceduresView } from './views/ProceduresView';
import { db } from './lib/firebase';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firebase';
import { Patient } from './lib/data';

export type Role = 'admin' | 'crm';

export default function App() {
  const [role, setRole] = useState<Role | null>(null);
  const [view, setView] = useState<'dashboard' | 'crm_overview' | 'crm_patients' | 'crm_procedures' | 'crm_ic'>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'patients'), (snapshot) => {
      const pats: Patient[] = [];
      for (const doc of snapshot.docs) {
        const data = doc.data();
        pats.push({ ...data, id: doc.id } as Patient);
      }
      setPatients(pats);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'patients');
    });
    return unsub;
  }, []);

  const handleOpenCrm = (patientName: string) => {
    let p = patients.find(x => x.name.toLowerCase() === patientName.toLowerCase());
    if (!p) p = patients.find(x => x.name.toLowerCase().startsWith(patientName.toLowerCase().split(' ').slice(0,2).join(' ')));
    if (!p) p = patients.find(x => x.name.toLowerCase().includes(patientName.toLowerCase().split(' ')[0]));
    
    if (p) {
      setSelectedPatientId(p.id);
    }
    setView('crm_patients');
  };

  const handleLogin = (r: Role) => {
    setRole(r);
    setView(r === 'admin' ? 'dashboard' : 'crm_overview');
  };

  const handleLogout = () => {
    setRole(null);
  };

  if (!role) {
    return <LoginView onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F3F2F1]">
        <div className="w-10 h-10 border-4 border-[#115EA3] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F3F2F1] text-gray-900 font-sans">
      <aside className="w-20 bg-white border-r border-gray-200 shadow-sm flex flex-col items-center py-6 gap-6 shrink-0 z-[100]">
        <div className="w-10 h-10 bg-[#115EA3] rounded-sm flex items-center justify-center mb-2">
          <div className="w-5 h-5 border border-white/40"></div>
        </div>

        <nav className="flex flex-col gap-4 mt-2 w-full px-3 flex-1">
          {role === 'admin' && (
            <button
              onClick={() => setView('dashboard')}
              title="Dashboard Executivo"
              className={`w-14 aspect-square flex items-center justify-center rounded-sm mx-auto transition-all duration-200 ${
                view === 'dashboard' ? 'bg-[#115EA3]/10 text-[#115EA3] border border-[#115EA3]/30' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
              }`}
            >
              <Activity size={20} strokeWidth={2} />
            </button>
          )}

          <div className="w-8 border-t border-gray-200 mx-auto my-2"></div>

          <button
            onClick={() => setView('crm_overview')}
            title="Visão Geral (Vendas)"
            className={`w-14 aspect-square flex items-center justify-center rounded-sm mx-auto transition-all duration-200 ${
              view === 'crm_overview' ? 'bg-[#115EA3]/10 text-[#115EA3] border border-[#115EA3]/30' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
            }`}
          >
            <Target size={20} strokeWidth={2} />
          </button>

          <button
            onClick={() => setView('crm_patients')}
            title="Clientes (CRM)"
            className={`w-14 aspect-square flex items-center justify-center rounded-sm mx-auto transition-all duration-200 ${
              view === 'crm_patients' ? 'bg-[#115EA3]/10 text-[#115EA3] border border-[#115EA3]/30' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
            }`}
          >
            <Users size={20} strokeWidth={2} />
          </button>

          <button
            onClick={() => setView('crm_procedures')}
            title="Procedimentos"
            className={`w-14 aspect-square flex items-center justify-center rounded-sm mx-auto transition-all duration-200 ${
              view === 'crm_procedures' ? 'bg-[#115EA3]/10 text-[#115EA3] border border-[#115EA3]/30' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
            }`}
          >
            <FileText size={20} strokeWidth={2} />
          </button>

          {role === 'admin' && (
            <button
              onClick={() => setView('crm_ic')}
              title="Inteligência Comercial"
              className={`w-14 aspect-square flex items-center justify-center rounded-sm mx-auto transition-all duration-200 ${
                view === 'crm_ic' ? 'bg-[#115EA3]/10 text-[#115EA3] border border-[#115EA3]/30' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
              }`}
            >
              <Shield size={20} strokeWidth={2} />
            </button>
          )}
        </nav>

        <button 
          onClick={handleLogout}
          title="Sair"
          className="w-14 aspect-square flex flex-col items-center justify-center rounded-sm mx-auto text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors mt-auto"
        >
          <div className="text-[9px] uppercase tracking-wider font-bold">{role === 'admin' ? 'ADM' : 'CRM'}</div>
          <div className="text-[8px]">Sair</div>
        </button>
      </aside>

      <main className="flex-1 h-full overflow-hidden flex flex-col relative bg-[#F3F2F1]">
        {view === 'dashboard' && <DashboardView onOpenCrm={handleOpenCrm} patients={patients} role={role} />}
        {view === 'crm_overview' && <CrmOverviewView patients={patients} />}
        {view === 'crm_patients' && <CrmView initialPatientId={selectedPatientId} patients={patients} role={role} />}
        {view === 'crm_procedures' && <ProceduresView patients={patients} role={role} />}
        {view === 'crm_ic' && <DashboardView onOpenCrm={handleOpenCrm} patients={patients} role={role} forcePage="pacientes" />}
      </main>
    </div>
  );
}
