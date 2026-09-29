import re

with open('src/views/DashboardView.tsx', 'r') as f:
    code = f.read()

# Make background color #F3F2F1
code = code.replace('bg-[#F4F5F7]', 'bg-[#F3F2F1]')

# For the inner headers that are direct children of the scrollable page view:
# 1. Inteligência Comercial (line 935)
code = code.replace(
    '<header className="flex justify-between items-end mb-8">',
    '<header className="flex justify-between items-end mb-8 sticky top-0 bg-[#F3F2F1] z-40 py-4 -my-4 shadow-sm">'
)

# For the others which already have mb-8
code = code.replace(
    '<header className="flex justify-between items-end mb-8 sticky top-0 bg-[#F3F2F1] z-40 py-4 -my-4 shadow-sm">\n                    <div>\n                      <h2 className="text-3xl font-sans font-semibold tracking-tight tracking-wide">Inteligência Comercial</h2>',
    '<header className="flex justify-between items-end mb-8 sticky top-0 bg-[#F3F2F1] z-40 py-4 -my-4 -mx-2 px-2 shadow-sm">\n                    <div>\n                      <h2 className="text-3xl font-sans font-semibold tracking-tight tracking-wide">Inteligência Comercial</h2>'
)

with open('src/views/DashboardView.tsx', 'w') as f:
    f.write(code)

print("Applied sticky headers to inner pages")
