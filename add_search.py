import re

with open('src/views/DashboardView.tsx', 'r') as f:
    code = f.read()

state_target = """  const [procListSortCol, setProcListSortCol] = useState<string>('cob');
  const [procListSortAsc, setProcListSortAsc] = useState<boolean>(false);"""
state_replacement = """  const [procListSortCol, setProcListSortCol] = useState<string>('cob');
  const [procListSortAsc, setProcListSortAsc] = useState<boolean>(false);
  const [procSearchTerm, setProcSearchTerm] = useState<string>('');"""

code = code.replace(state_target, state_replacement)

search_input_target = """                   <header className="flex justify-between items-end mb-8">
                      <div>
                         <h2 className="text-3xl font-sans font-semibold tracking-tight tracking-wide">Desempenho por Procedimento</h2>
                         <p className="text-xs text-gray-500 mt-2 uppercase tracking-widest">Análise unitária de procedimentos e pacotes</p>
                      </div>
                   </header>"""

search_input_replacement = """                   <header className="flex justify-between items-end mb-8">
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
                   </header>"""

code = code.replace(search_input_target, search_input_replacement)

filter_target = """             const procData = Array.from(procMap.values()).map(s => ({
                ...s,
                tme: s.count > 0 ? s.cob / s.count : 0,
                margin: s.cob > 0 ? ((s.cob - s.cons) / s.cob) * 100 : ((s.cons > 0 && s.cob === 0) ? -100 : 0)
             }));"""

filter_replacement = """             let procData = Array.from(procMap.values()).map(s => ({
                ...s,
                tme: s.count > 0 ? s.cob / s.count : 0,
                margin: s.cob > 0 ? ((s.cob - s.cons) / s.cob) * 100 : ((s.cons > 0 && s.cob === 0) ? -100 : 0)
             }));
             
             if (procSearchTerm.trim() !== '') {
                const term = procSearchTerm.toLowerCase();
                procData = procData.filter(s => s.name.toLowerCase().includes(term));
             }"""

code = code.replace(filter_target, filter_replacement)

with open('src/views/DashboardView.tsx', 'w') as f:
    f.write(code)

print("Done")
