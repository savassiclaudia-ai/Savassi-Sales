import re

with open('src/views/CrmView.tsx', 'r') as f:
    code = f.read()

target = '<div className="relative mb-6">'
replacement = """<div className="relative mb-6 flex gap-2">
              <div className="relative flex-1">"""

target_end = 'className="w-full bg-gray-50 border border-gray-200 rounded-sm py-2.5 pl-9 pr-3 text-xs uppercase tracking-widest text-gray-900 outline-none focus:border-[#115EA3] transition-colors placeholder:text-gray-400"\n              />\n            </div>'
replacement_end = """className="w-full bg-gray-50 border border-gray-200 rounded-sm py-2.5 pl-9 pr-3 text-xs uppercase tracking-widest text-gray-900 outline-none focus:border-[#115EA3] transition-colors placeholder:text-gray-400"
              />
              </div>
              {role !== 'crm' && (
               <button onClick={() => {
                  const csvContent = "data:text/csv;charset=utf-8," + 
                      "ID,Nome,LTV,Frequencia,Ultima Visita\\n" + 
                      patients.map(p => `${p.id},${p.name},${p.ltv},${p.n_tx},${p.last_visit || ''}`).join("\\n");
                  const dlAnchorElem = document.createElement('a');
                  dlAnchorElem.setAttribute("href", encodeURI(csvContent));
                  dlAnchorElem.setAttribute("download", "pacientes.csv");
                  dlAnchorElem.click();
               }} className="bg-gray-50 border border-gray-200 shadow-sm p-2 rounded-sm text-gray-500 hover:text-[#115EA3] hover:border-[#115EA3] transition-colors shrink-0 flex items-center justify-center aspect-square" title="Exportar Dados">
                 <Download size={16} />
               </button>
              )}
            </div>"""

if target in code and target_end in code:
    code = code.replace(target, replacement)
    code = code.replace(target_end, replacement_end)
    with open('src/views/CrmView.tsx', 'w') as f:
        f.write(code)
    print("Export button added")
else:
    print("Target not found")
