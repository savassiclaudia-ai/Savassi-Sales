import re

with open('src/views/DashboardView.tsx', 'r') as f:
    code = f.read()

# export function DashboardView({ onOpenCrm, patients }: { onOpenCrm: (name: string) => void, patients: Patient[] }) {
code = code.replace(
    'export function DashboardView({ onOpenCrm, patients }: { onOpenCrm: (name: string) => void, patients: Patient[] }) {',
    'export function DashboardView({ onOpenCrm, patients, role, forcePage }: { onOpenCrm: (name: string) => void, patients: Patient[], role?: "admin" | "crm", forcePage?: string }) {'
)

code = code.replace(
    'const [page, setPage] = useState(\'overview\');',
    'const [page, setPage] = useState(forcePage || \'overview\');'
)

# For the export restriction:
# I see the input type="file" inside page === 'plano'.
code = code.replace(
    '<input type="file" multiple accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} disabled={isSyncing} />',
    '{role !== "crm" && <input type="file" multiple accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} disabled={isSyncing} />}\n{role === "crm" && <div className="absolute inset-0 z-10" onClick={(e) => { e.preventDefault(); alert("Acesso negado: Usuário CRM não pode importar ou exportar planilhas."); }}></div>}'
)

# Also disable the upload visually if role == 'crm'
code = code.replace(
    'disabled={isSyncing}',
    'disabled={isSyncing || role === "crm"}'
)

with open('src/views/DashboardView.tsx', 'w') as f:
    f.write(code)

print("Updated DashboardView props")
