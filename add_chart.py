import re

with open('src/views/DashboardView.tsx', 'r') as f:
    code = f.read()

# Replace import
import_target = "LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,"
import_replacement = "LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,"
code = code.replace(import_target, import_replacement)

# Replace start of overview block
overview_start_target = "          {page === 'overview' && ("
overview_start_replacement = """          {page === 'overview' && (() => {
             const topActiveUsers = [...activePatients].sort((a,b) => (b.txs?.length || 0) - (a.txs?.length || 0)).slice(0, 15).map((p, i) => ({ name: p.name, frequencia: p.txs?.length || 0, rank: `#${i+1}` }));
             return ("""
code = code.replace(overview_start_target, overview_start_replacement, 1)

# Replace end of overview block
overview_end_target = """              </div>
            </div>
          )}
          {page === 'termos' && (() => {"""

overview_end_replacement = """              </div>

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

            </div>
          ); })()}
          {page === 'termos' && (() => {"""

if overview_end_target in code:
    code = code.replace(overview_end_target, overview_end_replacement)
    with open('src/views/DashboardView.tsx', 'w') as f:
        f.write(code)
    print("Done")
else:
    print("Target not found")

