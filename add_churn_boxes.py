import re

with open('src/views/DashboardView.tsx', 'r') as f:
    code = f.read()

# Modify the top of overview
top_target = """          {page === 'overview' && (() => {
             const topActiveUsers = [...activePatients].sort((a,b) => (b.txs?.length || 0) - (a.txs?.length || 0)).slice(0, 15).map((p, i) => ({ name: p.name, frequencia: p.txs?.length || 0, rank: `#${i+1}` }));
             return ("""

top_replacement = """          {page === 'overview' && (() => {
             const topActiveUsers = [...activePatients].sort((a,b) => (b.txs?.length || 0) - (a.txs?.length || 0)).slice(0, 15).map((p, i) => ({ name: p.name, frequencia: p.txs?.length || 0, rank: `#${i+1}` }));
             const churnRiskFreq = [...activePatients]
               .filter(p => getMonthsSinceLastVisit(p.last_visit || '') >= 2)
               .sort((a,b) => (b.txs?.length || 0) - (a.txs?.length || 0))
               .slice(0, 5);
             const churnRiskLTV = [...activePatients]
               .filter(p => getMonthsSinceLastVisit(p.last_visit || '') >= 2)
               .sort((a,b) => (b.ltv || 0) - (a.ltv || 0))
               .slice(0, 5);
             return ("""

if top_target in code:
    code = code.replace(top_target, top_replacement)
    print("Replaced top part")
else:
    print("Could not find top target")

bottom_target = """                      </LineChart>
                    </ResponsiveContainer>
                 </div>
              </div>

            </div>
          ); })()}
          {page === 'termos' && (() => {"""

bottom_replacement = """                      </LineChart>
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
          {page === 'termos' && (() => {"""

if bottom_target in code:
    code = code.replace(bottom_target, bottom_replacement)
    print("Replaced bottom part")
else:
    print("Could not find bottom target")

with open('src/views/DashboardView.tsx', 'w') as f:
    f.write(code)

