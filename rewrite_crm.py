import re

content = """import { Patient } from '../lib/data';
import { fmtFull, fmtK } from '../lib/utils';
import { Target, TrendingUp, Users, Clock, Activity, Shield } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

export function CrmOverviewView({ patients }: { patients: Patient[] }) {
  const totalLTV = patients.reduce((acc, p) => acc + (p.ltv || 0), 0);
  const totalTxs = patients.reduce((acc, p) => acc + (p.n_tx || 0), 0);
  
  const activePatients = patients.filter(p => p.status === 'ativo');

  // Prepare data: Revenue by Month
  const monthlyMap = new Map<string, number>();
  // Prepare data: Top Procedures
  const procMap = new Map<string, number>();
  // Prepare data: Score Distribution
  const scoreMap = new Map<string, number>();

  patients.forEach(p => {
    // Score Distribution
    const score = p.score || 'C';
    scoreMap.set(score, (scoreMap.get(score) || 0) + 1);

    if (p.txs) {
      p.txs.forEach(tx => {
        // Monthly Revenue
        if (tx.ym) {
          monthlyMap.set(tx.ym, (monthlyMap.get(tx.ym) || 0) + (tx.cob || 0));
        }
        // Procedure Count
        if (tx.proc) {
          const procName = tx.proc.split('/')[0].trim().toUpperCase(); // simplify name
          procMap.set(procName, (procMap.get(procName) || 0) + 1);
        }
      });
    }
  });

  const monthlyData = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ym, cob]) => ({ ym, cob }));

  const procData = Array.from(procMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, count]) => ({ name: name.length > 20 ? name.substring(0, 20) + '...' : name, count }));

  const scoreColors: Record<string, string> = { 'A': '#115EA3', 'B': '#F59E0B', 'C': '#9CA3AF' };
  const scoreData = Array.from(scoreMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, value]) => ({ name: `Score ${name}`, value, color: scoreColors[name] || '#D1D5DB' }));

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F3F2F1] text-gray-900 font-sans">
      <header className="h-20 min-h-[5rem] bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="font-sans tracking-tight text-2xl font-extrabold text-gray-900">Visão Geral (CRM)</div>
      </header>

      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">Total Clientes</div>
              <Users className="text-[#115EA3] opacity-80" size={18} />
            </div>
            <div className="text-3xl font-bold tracking-tight text-gray-900 mt-2">{patients.length}</div>
          </div>
          
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">Clientes Ativos</div>
              <Target className="text-[#115EA3] opacity-80" size={18} />
            </div>
            <div className="text-3xl font-bold tracking-tight text-gray-900 mt-2">{activePatients.length}</div>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">Ticket Médio</div>
              <TrendingUp className="text-[#115EA3] opacity-80" size={18} />
            </div>
            <div className="text-3xl font-bold tracking-tight text-gray-900 mt-2">
              {totalTxs > 0 ? fmtFull(totalLTV / totalTxs) : 'R$ 0,00'}
            </div>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">LTV Global</div>
              <Clock className="text-[#115EA3] opacity-80" size={18} />
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#115EA3] mt-2">
              {fmtK(totalLTV)}
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 lg:col-span-2">
            <header className="mb-6 flex justify-between items-end">
              <div>
                <h3 className="text-xl font-sans font-semibold tracking-tight text-gray-900">Evolução de Receita (CRM)</h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">Histórico de Vendas por Mês</p>
              </div>
            </header>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="ym" tick={{fill: '#9CA3AF', fontSize: 10}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: '#9CA3AF', fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(v) => fmtK(v)} />
                  <Tooltip 
                     cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '3 3' }}
                     content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                           return (
                             <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-3">
                               <p className="font-semibold text-gray-900 text-sm">{payload[0].payload.ym}</p>
                               <p className="text-xs text-[#115EA3] mt-1 font-medium">{fmtFull(payload[0].payload.cob)}</p>
                             </div>
                           );
                        }
                        return null;
                     }}
                  />
                  <Line type="monotone" dataKey="cob" stroke="#115EA3" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6, fill: "#115EA3", stroke: "#fff", strokeWidth: 2 }} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 flex flex-col">
            <header className="mb-6">
              <h3 className="text-xl font-sans font-semibold tracking-tight text-gray-900">Perfil de Clientes</h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">Distribuição por Score</p>
            </header>
            <div className="h-[200px] w-full flex-1 relative flex items-center justify-center">
              {scoreData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={scoreData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                      {scoreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                       content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                             return (
                               <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-3">
                                 <p className="font-semibold text-gray-900 text-sm">{payload[0].payload.name}</p>
                                 <p className="text-xs text-gray-500 mt-1">{payload[0].payload.value} clientes</p>
                               </div>
                             );
                          }
                          return null;
                       }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-gray-400 text-xs">Sem dados</div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-gray-900">{patients.length}</span>
                <span className="text-[9px] uppercase tracking-widest text-gray-500">Total</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
               {scoreData.map((s, i) => (
                 <div key={i} className="flex items-center gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }}></div>
                   <span className="text-xs text-gray-600 font-medium">{s.name.replace('Score ', '')} <span className="text-gray-400">({s.value})</span></span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
            <header className="mb-6">
              <h3 className="text-xl font-sans font-semibold tracking-tight text-gray-900">Procedimentos Mais Buscados</h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">Top 7 por volume</p>
            </header>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={procData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F3F4F6" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{fill: '#4B5563', fontSize: 10, fontWeight: 500}} width={120} axisLine={false} tickLine={false} />
                  <Tooltip 
                     cursor={{ fill: '#F3F4F6' }}
                     content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                           return (
                             <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-3">
                               <p className="font-semibold text-gray-900 text-sm">{payload[0].payload.name}</p>
                               <p className="text-xs text-[#115EA3] mt-1">{payload[0].payload.count} procedimentos</p>
                             </div>
                           );
                        }
                        return null;
                     }}
                  />
                  <Bar dataKey="count" fill="#115EA3" radius={[0, 4, 4, 0]} barSize={24}>
                    {procData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fillOpacity={0.8 + (index * 0.05)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
             <header className="p-6 pb-4 border-b border-gray-100">
               <h3 className="text-xl font-sans font-semibold tracking-tight text-gray-900">Top Clientes em Retenção</h3>
               <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">Baseado em LTV e Frequência</p>
             </header>
             <div className="overflow-y-auto flex-1 max-h-[300px]">
               <table className="w-full text-left text-[11px] uppercase tracking-widest border-collapse">
                 <thead className="bg-gray-50 sticky top-0 z-10 before:absolute before:inset-0 before:border-b before:border-gray-200">
                   <tr className="text-gray-500">
                     <th className="py-3 px-6 font-normal">Cliente</th>
                     <th className="py-3 px-6 font-normal text-right">LTV</th>
                     <th className="py-3 px-6 font-normal text-right">Idas</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {patients.sort((a,b) => b.ltv - a.ltv).slice(0, 10).map((p, i) => (
                     <tr key={i} className="hover:bg-gray-50 transition-colors">
                       <td className="py-3 px-6 font-medium text-gray-900 max-w-[150px] truncate" title={p.name}>{p.name}</td>
                       <td className="py-3 px-6 text-right font-semibold text-[#115EA3]">{fmtK(p.ltv)}</td>
                       <td className="py-3 px-6 text-right text-gray-500">{p.n_tx}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
"""

with open('src/views/CrmOverviewView.tsx', 'w') as f:
    f.write(content)

print("Done")
