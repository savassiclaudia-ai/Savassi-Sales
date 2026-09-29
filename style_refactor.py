import re

with open('src/views/DashboardView.tsx', 'r') as f:
    code = f.read()

# Make cards solid white instead of blurred glassmorphism
code = code.replace('bg-white/80 backdrop-blur-md border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]', 'bg-white border border-gray-200 shadow-sm')

# Reduce border radius to match Power BI
code = code.replace('rounded-3xl', 'rounded-xl')
code = code.replace('rounded-2xl', 'rounded-xl')

# The main dashboard header should be solid white to clearly mask content when scrolling
code = code.replace(
    'h-24 min-h-[6rem] bg-[#F4F5F7]/90 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-10 sticky top-0 z-50',
    'h-20 min-h-[5rem] bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-8 sticky top-0 z-50'
)

# Replace the inner headers inside pages if any are meant to be sticky
# But the main top sticky header now being solid white handles the scrolling background.

with open('src/views/DashboardView.tsx', 'w') as f:
    f.write(code)

print("Aesthetic refactored to Power BI style")
