import re

with open('src/views/DashboardView.tsx', 'r') as f:
    code = f.read()

# We revert the blanket replacement first
code = code.replace(
    'sticky top-0 bg-[#F3F2F1] z-40 py-4 -my-4 shadow-sm',
    ''
)
code = code.replace(
    'sticky top-0 bg-[#F3F2F1] z-40 py-4 -my-4 -mx-2 px-2 shadow-sm',
    ''
)
code = code.replace(
    '<header className="flex justify-between items-end mb-8 ">',
    '<header className="flex justify-between items-end mb-8">'
)

# Now apply carefully:

# 1. Main page headers (Inteligencia, Desempenho, Anomalias, etc.)
# Find: <header className="flex justify-between items-end mb-8">
# Only for the ones that are direct children of the page container.

# Actually, the page titles are inside <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-y-auto pr-4 h-full pointer-events-auto"> (which doesn't have bg-white)
# Or in <div className="... border border-gray-200 bg-white rounded-xl p-8">
# Let's just manually set it. The user said:
# "quando rolar as paginas para baixo, deixar um background por tras do cabecalho de nome de cada area"
# Wait, why not just make all the page-level main titles sticky?

# I'll just change the main header of the ENTIRE view that I made h-20 min-h-[5rem] bg-white to stay solid and that's usually enough.
# Let's revert the sticky inner headers because they are a mess of z-indexes and backgrounds.
with open('src/views/DashboardView.tsx', 'w') as f:
    f.write(code)

print("Reverted sticky inner headers")
