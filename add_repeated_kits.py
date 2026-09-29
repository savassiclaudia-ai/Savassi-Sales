import re

with open('src/views/DashboardView.tsx', 'r') as f:
    code = f.read()

target1 = """          {page === 'termos' && (() => {
             const topFreq = activePatients.sort((a,b) => (b.txs?.length || 0) - (a.txs?.length || 0)).slice(0, 8);"""

replacement1 = """          {page === 'termos' && (() => {
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
                 .slice(0, 12);"""

code = code.replace(target1, replacement1)

target2 = """                 </div>
             </div>
             
             </div>
             );
          })()}"""

replacement2 = """                 </div>
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
          })()}"""

code = code.replace(target2, replacement2)

with open('src/views/DashboardView.tsx', 'w') as f:
    f.write(code)

print("Done")
