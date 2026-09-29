import { useState } from 'react';
import { Search, Plus, Download } from 'lucide-react';
import { Patient } from '../lib/data';
import { fmtFull, fmtK, initials, monthLabel, cn } from '../lib/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

import { Role } from "../App";
export function CrmView({ initialPatientId, patients: initialPatients, role }: { initialPatientId: string | null, patients: Patient[], role?: Role }) {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortList, setSortList] = useState<'a-z' | 'z-a' | 'default'>('default');
  const [selectedId, setSelectedId] = useState<string | null>(initialPatientId || initialPatients[0]?.id || null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [isSaving, setIsSaving] = useState(false);

  const patients = initialPatients.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom || dateTo) {
      if (!p.txs || p.txs.length === 0) return false;
      const tYms = p.txs.map(t => t.ym).filter(Boolean);
      if (tYms.length === 0) return false;
      let inRange = false;
      for (const ym of tYms) {
        if (dateFrom && ym < dateFrom.substring(0, 7)) continue;
        if (dateTo && ym > dateTo.substring(0, 7)) continue;
        inRange = true;
        break;
      }
      if (!inRange) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortList === 'a-z') return a.name.localeCompare(b.name);
    if (sortList === 'z-a') return b.name.localeCompare(a.name);
    return 0; // default order
  });

  const p = initialPatients.find(x => x.id === selectedId);

  const handleEditClick = () => {
    if (!editMode && p) {
      setFormData({
        phone: p.phone,
        email: p.email,
        cpf: p.cpf,
        birth: p.birth,
        skin_type: p.skin_type,
        allergies: p.allergies
      });
    }
    setEditMode(!editMode);
  };

  const handleSave = async () => {
    if (!p) return;
    setIsSaving(true);
    try {
      const ref = doc(db, 'patients', p.id);
      const cleanData: Record<string, any> = {};
      Object.entries(formData).forEach(([k, v]) => {
         if (v !== undefined) cleanData[k] = v;
      });
      await updateDoc(ref, cleanData);
      setEditMode(false);
    } catch (error) {
      console.error(error);
      alert('Error updating patient profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F3F2F1] text-gray-900 font-sans h-full overflow-hidden">
      {/* TOPBAR */}
      <nav className="h-20 border-b border-gray-200 flex items-center justify-between px-10 bg-white shrink-0 z-50">
        <div className="flex items-center gap-6">
          <span className="text-xl tracking-[0.2em] font-sans font-semibold tracking-tight uppercase text-[#115EA3]">Pacientes</span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400 border-l border-gray-200 pl-6">Directory</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-sm text-[10px] uppercase tracking-widest text-gray-900 hover:bg-gray-50 transition-colors">
            <Plus size={14} /> Novo Paciente
          </button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-80 border-r border-gray-200 flex flex-col overflow-hidden bg-white shrink-0">
          <div className="p-6 border-b border-gray-200">
            <div className="relative mb-6 flex gap-2">
              <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} strokeWidth={2} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="PROCURAR..."
                className="w-full bg-gray-50 border border-gray-200 rounded-sm py-2.5 pl-9 pr-3 text-xs uppercase tracking-widest text-gray-900 outline-none focus:border-[#115EA3] transition-colors placeholder:text-gray-400"
              />
              </div>
              {role !== 'crm' && (
               <button onClick={() => {
                  const csvContent = "data:text/csv;charset=utf-8," + 
                      "ID,Nome,LTV,Frequencia,Ultima Visita\n" + 
                      patients.map(p => `${p.id},${p.name},${p.ltv},${p.n_tx},${p.last_visit || ''}`).join("\n");
                  const dlAnchorElem = document.createElement('a');
                  dlAnchorElem.setAttribute("href", encodeURI(csvContent));
                  dlAnchorElem.setAttribute("download", "pacientes.csv");
                  dlAnchorElem.click();
               }} className="bg-gray-50 border border-gray-200 shadow-sm p-2 rounded-sm text-gray-500 hover:text-[#115EA3] hover:border-[#115EA3] transition-colors shrink-0 flex items-center justify-center aspect-square" title="Exportar Dados">
                 <Download size={16} />
               </button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <input 
                type="month" 
                value={dateFrom} 
                onChange={e => setDateFrom(e.target.value)} 
                title="A partir de (Mês)" 
                className="bg-white border border-gray-200 rounded-sm px-2 py-1.5 text-[10px] uppercase tracking-widest text-[#115EA3] outline-none" 
              />
              <input 
                type="month" 
                value={dateTo} 
                onChange={e => setDateTo(e.target.value)} 
                title="Até (Mês)" 
                className="bg-white border border-gray-200 rounded-sm px-2 py-1.5 text-[10px] uppercase tracking-widest text-[#115EA3] outline-none" 
              />
              <button 
                onClick={() => setSortList(prev => prev === 'default' ? 'a-z' : prev === 'a-z' ? 'z-a' : 'default')}
                className="bg-white border border-gray-200 rounded-sm px-3 py-1.5 text-[10px] uppercase tracking-widest text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                title="Ordenar por Nome"
              >
                {sortList === 'a-z' ? 'A-Z ↓' : sortList === 'z-a' ? 'Z-A ↑' : 'A-Z'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {patients.map(pat => {
              const active = pat.id === selectedId;
              return (
                <div
                  key={pat.id}
                  onClick={() => setSelectedId(pat.id)}
                  className={cn(
                    "flex flex-col gap-2 p-5 border-b border-gray-200 cursor-pointer transition-all relative group",
                    active ? "bg-gray-50" : "hover:bg-white/[0.02]"
                  )}
                >
                  {active && <div className="absolute left-0 top-0 h-full w-[2px] bg-[#115EA3]" />}
                  <div className="flex justify-between items-start">
                    <div className={cn("text-sm font-sans font-semibold tracking-tight tracking-wide truncate pr-2", active ? "text-[#115EA3]" : "text-gray-900")}>
                      {pat.name}
                    </div>
                    <div className="font-mono text-[10px] text-gray-500 tracking-wider pt-0.5">{fmtK(pat.ltv)}</div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-widest">
                    <span className="text-gray-400">{pat.id}</span>
                    <div className="flex items-center gap-2">
                       <span className={cn("px-1.5 py-0.5 rounded-sm bg-gray-50 border border-gray-200 text-gray-500", pat.score === 'A' && "text-[#115EA3] border-[#115EA3]/30")}>SC: {pat.score}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        {/* MAIN PANEL */}
        <main className="flex-1 overflow-y-auto">
          {!p ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
              <p className="text-xs uppercase tracking-[0.3em]">Selecione um perfil no diretório</p>
            </div>
          ) : (
            <div className="p-10 max-w-5xl mx-auto animate-in fade-in duration-300">
              {/* HEADER */}
              <div className="flex items-end justify-between mb-10 pb-8 border-b border-gray-200">
                <div className="flex items-center gap-6">
                  <div className="w-[84px] h-[84px] rounded-sm bg-gradient-to-tr from-[#115EA3] to-[#0F5494] p-[2px] shrink-0">
                    <div className="w-full h-full bg-[#F3F2F1] flex items-center justify-center font-sans font-semibold tracking-tight text-3xl font-bold text-[#115EA3]">
                      {initials(p.name)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="font-sans font-semibold tracking-tight text-4xl text-gray-900 leading-none tracking-wide">{p.name}</div>
                    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">
                      <span>{p.id}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                      <span>INÍCIO: {monthLabel(p.first_visit)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("px-3 py-1 text-[10px] uppercase tracking-widest border rounded-sm", p?.status === 'ativo' ? "bg-[#3fb950]/10 text-[#3fb950] border-[#3fb950]/20" : "bg-gray-50 text-gray-500 border-gray-200")}>
                    {p?.status || 'N/A'}
                  </span>
                  <button onClick={handleEditClick} className="px-4 py-2 text-[10px] uppercase tracking-widest border border-gray-200 rounded-sm text-gray-900 hover:bg-gray-50 transition-colors">
                    {editMode ? 'Cancelar Edição' : 'Modificar Perfil'}
                  </button>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-4 gap-6 mb-10">
                <div className="bg-white shadow-sm border border-gray-200 rounded-sm p-6 relative group">
                  <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">LTV Total</div>
                  <div className="font-sans font-semibold tracking-tight text-3xl text-[#115EA3]">{fmtFull(p.ltv)}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">{p.n_tx} Operações</div>
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#115EA3] to-[#0F5494] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-sm p-6 relative">
                  <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Receita Líquida</div>
                  <div className="font-sans font-semibold tracking-tight text-2xl text-gray-900 mt-1">{fmtFull(p.liq)}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">{p.ltv > 0 ? Math.round(p.liq / p.ltv * 100) : 0}% Margem Global</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-sm p-6 relative">
                  <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Ticket Médio</div>
                  <div className="font-sans font-semibold tracking-tight text-2xl text-gray-900 mt-1">{fmtFull(p.ltv / (p.n_tx||1))}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">Visita Padrão</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-sm p-6 relative">
                  <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Última Operação</div>
                  <div className="font-sans font-semibold tracking-tight text-2xl text-gray-900 mt-1">{monthLabel(p.last_visit) || '—'}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">{p.kits?.length || 0} Segmentos</div>
                </div>
              </div>

              {/* RECORD GRID */}
              <div className="grid grid-cols-3 gap-10">
                <div className="col-span-1 flex flex-col gap-8">
                  <div>
                    <h3 className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-6">Identidade & Contato</h3>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-[#115EA3]">Telefone / Auth</label>
                        <div className="flex items-center gap-2">
                          <input readOnly={!editMode} value={editMode ? formData.phone || '' : p.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="N/A" className={cn("bg-transparent border-b border-gray-200 focus:border-[#115EA3] text-sm font-light py-1 outline-none font-sans flex-1", editMode ? "border-[#115EA3] text-gray-900" : "border-gray-200 text-gray-600 focus:border-gray-200 cursor-default")} />
                          {p.phone && !editMode && (
                            <a href={`https://wa.me/${p.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="bg-[#25D366] text-white px-2 py-1 rounded-sm text-[10px] uppercase tracking-wider hover:bg-[#20bd5a] transition-colors whitespace-nowrap">WhatsApp</a>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-[#115EA3]">E-mail Corporativo</label>
                        <input readOnly={!editMode} value={editMode ? formData.email || '' : p.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="N/A" className={cn("bg-transparent border-b border-gray-200 focus:border-[#115EA3] text-sm font-light py-1 outline-none font-sans", editMode ? "border-[#115EA3] text-gray-900" : "border-gray-200 text-gray-600 focus:border-gray-200 cursor-default")} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-[#115EA3]">CPF / ID</label>
                        <input readOnly={!editMode} value={editMode ? formData.cpf || '' : p.cpf || ''} onChange={e => setFormData({...formData, cpf: e.target.value})} placeholder="N/A" className={cn("bg-transparent border-b border-gray-200 focus:border-[#115EA3] text-sm font-light py-1 outline-none font-sans", editMode ? "border-[#115EA3] text-gray-900" : "border-gray-200 text-gray-600 focus:border-gray-200 cursor-default")} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-[#115EA3]">Aniversário</label>
                        <input type="date" readOnly={!editMode} value={editMode ? formData.birth || '' : p.birth || ''} onChange={e => setFormData({...formData, birth: e.target.value})} className={cn("bg-transparent border-b border-gray-200 focus:border-[#115EA3] text-sm font-light py-1 outline-none font-sans min-w-full", editMode ? "border-[#115EA3] text-gray-900 [color-scheme:light]" : "border-gray-200 text-gray-600 focus:border-gray-200 cursor-default [color-scheme:light]")} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-6">Parâmetros Biométricos</h3>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-[#115EA3]">Perfil Dermal</label>
                        <input readOnly={!editMode} value={editMode ? formData.skin_type || '' : p.skin_type || ''} onChange={e => setFormData({...formData, skin_type: e.target.value})} className={cn("bg-transparent border-b border-gray-200 focus:border-[#115EA3] text-sm font-light py-1 outline-none font-sans capitalize", editMode ? "border-[#115EA3] text-gray-900" : "border-gray-200 text-gray-600 focus:border-gray-200 cursor-default")} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-[#115EA3]">Restrições / Alergias</label>
                        <input readOnly={!editMode} value={editMode ? formData.allergies || '' : p.allergies || ''} onChange={e => setFormData({...formData, allergies: e.target.value})} placeholder="Clear" className={cn("bg-transparent border-b border-gray-200 focus:border-[#115EA3] text-sm font-light py-1 outline-none font-sans", editMode ? "border-[#115EA3] text-gray-900" : "border-gray-200 text-gray-600 focus:border-gray-200 cursor-default")} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 flex flex-col border border-gray-200 rounded-sm bg-white/[0.02]">
                  <header className="px-8 py-6 border-b border-gray-200 flex justify-between items-center bg-white">
                    <h3 className="text-sm uppercase tracking-widest text-gray-900 font-medium">Registro Operacional</h3>
                  </header>
                  <div className="p-8 flex-1">
                    <div className="space-y-6">
                      {p.txs?.map((t, idx) => (
                        <div key={idx} className="flex gap-6 border-l border-gray-200 pl-6 py-1 relative group">
                          <div className="absolute left-[-2px] inset-y-0 w-[3px] bg-[#115EA3] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="flex flex-col min-w-[70px] shrink-0">
                            <span className="text-xl font-sans font-semibold tracking-tight leading-none text-gray-900">{monthLabel(t.ym).split('/')[0]}</span>
                            <span className="text-[9px] uppercase tracking-widest opacity-40 mt-1">{monthLabel(t.ym).split('/')[1]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[13px] font-medium leading-relaxed max-w-[85%]">{t.proc}</h4>
                            <div className="flex gap-3 mt-2 items-center flex-wrap">
                              <span className="text-[9px] uppercase tracking-widest border border-gray-200 px-2 py-0.5 rounded-sm text-gray-500">{t.kit.replace(' & REJUVENESCIMENTO','')}</span>
                              {t.pg && <span className="text-[9px] uppercase tracking-widest text-gray-400">{t.pg}</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end justify-center">
                            <div className="text-[14px] font-sans font-semibold tracking-tight text-[#115EA3]">{t.cob > 0 ? fmtFull(t.cob) : 'Cortesia'}</div>
                            {t.liq > 0 && <div className="text-[10px] text-gray-400 tracking-widest uppercase mt-1">Líq: {fmtFull(t.liq)}</div>}
                          </div>
                        </div>
                      ))}
                      {!p.txs?.length && <div className="text-xs uppercase tracking-widest text-gray-400">Nenhum registro encontrado.</div>}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>

      {/* SAVE BAR */}
      {editMode && (
        <div className="sticky bottom-0 bg-white border-t border-[#115EA3]/30 px-10 py-5 flex items-center justify-between z-50">
           <span className="text-[10px] uppercase tracking-[0.2em] text-[#115EA3]">Modificação Ativa — Salve para persistir no banco</span>
           <div className="flex gap-4">
             <button onClick={() => setEditMode(false)} className="px-6 py-2.5 text-[10px] uppercase tracking-widest text-gray-900 hover:bg-gray-50 transition-colors border border-transparent">Cancelar</button>
             <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 text-[10px] uppercase tracking-widest bg-[#115EA3] text-white font-bold hover:bg-[#0F5494] transition-colors rounded-sm disabled:opacity-50">
               {isSaving ? 'Salvando...' : 'Confirmar Mudanças'}
             </button>
           </div>
        </div>
      )}
    </div>
  )
}
