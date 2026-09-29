import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { Role } from '../App';
import { fmtFull } from '../lib/utils';

export function ProceduresView({ patients, role }: { patients: any[], role?: Role }) {
  const [procedures, setProcedures] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editMode, setEditMode] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'procedures'), (snapshot) => {
      const procs: any[] = [];
      snapshot.forEach(doc => {
        procs.push({ id: doc.id, ...doc.data() });
      });
      setProcedures(procs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'procedures');
    });
    return unsub;
  }, []);

  const handleSave = async () => {
    if (!formData.name) return alert('Nome é obrigatório');
    const id = editMode === 'new' ? formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : editMode;
    if (!id) return;
    
    try {
      await setDoc(doc(db, 'procedures', id), {
        name: formData.name,
        price: Number(formData.price) || 0,
        category: formData.category || 'OUTROS',
        duration: formData.duration || '30 min',
      });
      setEditMode(null);
      setFormData({});
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar procedimento');
      handleFirestoreError(e, OperationType.WRITE, 'procedures');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este procedimento?')) {
      try {
        await deleteDoc(doc(db, 'procedures', id));
      } catch(e) {
        handleFirestoreError(e, OperationType.DELETE, 'procedures/' + id);
      }
    }
  };

  const filtered = procedures.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F3F2F1] text-gray-900 font-sans">
      <header className="h-20 min-h-[5rem] bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="font-sans tracking-tight text-2xl font-extrabold text-gray-900">Procedimentos</div>
        <button onClick={() => { setEditMode('new'); setFormData({}); }} className="flex items-center gap-2 bg-[#115EA3] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0f5494] transition-colors">
          <Plus size={16} /> Novo Procedimento
        </button>
      </header>

      <div className="p-8 h-full flex flex-col overflow-hidden max-w-7xl mx-auto w-full">
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden flex flex-col h-full">
           <header className="p-6 border-b border-gray-200 flex items-center gap-4">
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" placeholder="Buscar procedimentos..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#115EA3] transition-colors" value={search} onChange={e => setSearch(e.target.value)} />
             </div>
           </header>

           <div className="flex-1 overflow-y-auto p-0">
             <table className="w-full text-left text-sm border-collapse">
               <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 text-[10px] uppercase tracking-widest text-gray-500">
                 <tr>
                   <th className="py-4 px-6 font-normal">Nome do Procedimento</th>
                   <th className="py-4 px-6 font-normal">Categoria</th>
                   <th className="py-4 px-6 font-normal">Duração (Ref.)</th>
                   <th className="py-4 px-6 font-normal text-right">Valor Base (R$)</th>
                   <th className="py-4 px-6 font-normal text-right">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {filtered.map(p => (
                   <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                     <td className="py-4 px-6 font-medium text-gray-900">{p.name}</td>
                     <td className="py-4 px-6 text-gray-600">
                       <span className="px-2 py-1 bg-gray-100 rounded-sm text-[10px] uppercase tracking-wider">{p.category}</span>
                     </td>
                     <td className="py-4 px-6 text-gray-600">{p.duration}</td>
                     <td className="py-4 px-6 text-right text-gray-900 font-medium">{fmtFull(p.price)}</td>
                     <td className="py-4 px-6 text-right">
                       <div className="flex items-center justify-end gap-3 text-gray-400">
                         <button onClick={() => { setEditMode(p.id); setFormData(p); }} className="hover:text-[#115EA3] transition-colors"><Edit2 size={16} /></button>
                         <button onClick={() => handleDelete(p.id)} className="hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                       </div>
                     </td>
                   </tr>
                 ))}
                 {filtered.length === 0 && (
                   <tr>
                     <td colSpan={5} className="py-12 text-center text-gray-500 text-sm">Nenhum procedimento encontrado.</td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      </div>

      {editMode && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">{editMode === 'new' ? 'Novo Procedimento' : 'Editar Procedimento'}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 block">Nome</label>
                <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-[#115EA3]" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 block">Categoria (Kit)</label>
                <select className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-[#115EA3] bg-white" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="">Selecione...</option>
                  <option value="FIRMEZA & CONTORNO">FIRMEZA E CONTORNO</option>
                  <option value="PELE & REJUVENESCIMENTO">PELE E REJUVENESCIMENTO</option>
                  <option value="LIFTING PREMIUM">LIFTING PREMIUM</option>
                  <option value="INJETÁVEIS & SKINCARE">INJETÁVEIS E SKINCARE</option>
                  <option value="DEPILAÇÃO">DEPILAÇÃO</option>
                  <option value="CAPILAR">CAPILAR</option>
                  <option value="OUTROS">OUTROS</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 block">Duração</label>
                <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-[#115EA3]" placeholder="Ex: 60 min" value={formData.duration || ''} onChange={e => setFormData({...formData, duration: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1.5 block">Valor Base (R$)</label>
                <input type="number" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-[#115EA3]" value={formData.price || ''} onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setEditMode(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-[#115EA3] text-white font-semibold rounded-lg hover:bg-[#0f5494] transition-colors">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
