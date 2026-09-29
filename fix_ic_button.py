import re

with open('src/App.tsx', 'r') as f:
    code = f.read()

target = """          <button
            onClick={() => setView('crm_ic')}
            title="Inteligência Comercial"
            className={`w-14 aspect-square flex items-center justify-center rounded-sm mx-auto transition-all duration-200 ${
              view === 'crm_ic' ? 'bg-[#115EA3]/10 text-[#115EA3] border border-[#115EA3]/30' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
            }`}
          >
            <Shield size={20} strokeWidth={2} />
          </button>"""

replacement = """          {role === 'admin' && (
            <button
              onClick={() => setView('crm_ic')}
              title="Inteligência Comercial"
              className={`w-14 aspect-square flex items-center justify-center rounded-sm mx-auto transition-all duration-200 ${
                view === 'crm_ic' ? 'bg-[#115EA3]/10 text-[#115EA3] border border-[#115EA3]/30' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
              }`}
            >
              <Shield size={20} strokeWidth={2} />
            </button>
          )}"""

if target in code:
    code = code.replace(target, replacement)
    with open('src/App.tsx', 'w') as f:
        f.write(code)
    print("Fixed IC button visibility")
else:
    print("Target not found")
