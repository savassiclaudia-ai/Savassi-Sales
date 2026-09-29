import re

with open('src/views/CrmView.tsx', 'r') as f:
    code = f.read()

if 'import { Download' not in code:
    code = code.replace("import { Search, Plus } from 'lucide-react';", "import { Search, Plus, Download } from 'lucide-react';")

export_btn = """          {role !== 'crm' && (
             <button onClick={() => {
                const csvContent = "data:text/csv;charset=utf-8," + 
                    "ID,Nome,LTV,Frequencia,Ultima Visita\\n" + 
                    patients.map(p => `${p.id},${p.name},${p.ltv},${p.n_tx},${p.last_visit || ''}`).join("\\n");
                const dlAnchorElem = document.createElement('a');
                dlAnchorElem.setAttribute("href", encodeURI(csvContent));
                dlAnchorElem.setAttribute("download", "pacientes.csv");
                dlAnchorElem.click();
             }} className="bg-white border border-gray-200 shadow-sm p-2 rounded-lg text-gray-500 hover:text-gray-900 transition-colors shrink-0" title="Exportar Dados">
               <Download size={20} strokeWidth={2} />
             </button>
          )}"""

if 'Download size={20}' not in code:
    code = code.replace(
        '<div className="relative flex-1">\n              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />',
        export_btn + '\n          <div className="relative flex-1">\n              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />'
    )

with open('src/views/CrmView.tsx', 'w') as f:
    f.write(code)

print("Added Export button")
