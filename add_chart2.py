import re

with open('src/views/DashboardView.tsx', 'r') as f:
    code = f.read()

# Replace start of overview block
overview_start_target = "          {page === 'overview' && ("
if overview_start_target in code:
    print("Found overview start")

# we need to be careful not to replace something else.
# There's a pattern:
#               </div>
#             </div>
#           )}
#           {page === 'termos' && (() => {

overview_end_pattern = r"              </div>\s*</div>\s*\)}\s*{page === 'termos' && \(\(\) => \{"
matches = re.findall(overview_end_pattern, code)
if matches:
    print("Found overview end pattern:", len(matches))

replacement = """              </div>

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

if matches:
    code = re.sub(overview_end_pattern, replacement, code)
    with open('src/views/DashboardView.tsx', 'w') as f:
        f.write(code)
    print("Done")

