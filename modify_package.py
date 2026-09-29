import json

with open('package.json', 'r') as f:
    pkg = json.load(f)

pkg['scripts'] = {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "clean": "rm -rf dist",
    "lint": "tsc --noEmit"
}

with open('package.json', 'w') as f:
    json.dump(pkg, f, indent=2)

print("package.json updated")
