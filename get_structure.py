import re

with open('src/views/DashboardView.tsx', 'r') as f:
    code = f.read()

# find <header> inside the return statement of DashboardView
start = code.find('return (')
print(code[start:start+1000])
