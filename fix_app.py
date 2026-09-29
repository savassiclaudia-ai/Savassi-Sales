import re

with open('src/App.tsx', 'r') as f:
    code = f.read()

replacement = """import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firebase';"""
code = code.replace("import { collection, getDocs, onSnapshot } from 'firebase/firestore';", replacement)

error_handler = """    }, (error) => {
      console.error(error);
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'patients');
    });"""

code = code.replace("""    }, (error) => {
      console.error(error);
      setLoading(false);
    });""", error_handler)

with open('src/App.tsx', 'w') as f:
    f.write(code)
