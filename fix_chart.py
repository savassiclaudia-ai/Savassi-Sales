import re

with open('src/views/DashboardView.tsx', 'r') as f:
    code = f.read()

# Replace start of overview block
overview_start_target = "          {page === 'overview' && ("
overview_start_replacement = """          {page === 'overview' && (() => {
             const topActiveUsers = [...activePatients].sort((a,b) => (b.txs?.length || 0) - (a.txs?.length || 0)).slice(0, 15).map((p, i) => ({ name: p.name, frequencia: p.txs?.length || 0, rank: `#${i+1}` }));
             return ("""

code = code.replace(overview_start_target, overview_start_replacement, 1)

with open('src/views/DashboardView.tsx', 'w') as f:
    f.write(code)
print("Done fix")

