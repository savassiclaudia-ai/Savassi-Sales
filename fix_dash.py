import re

with open('src/views/DashboardView.tsx', 'r') as f:
    code = f.read()

replacement = """import { db, handleFirestoreError, OperationType } from '../lib/firebase';"""
code = code.replace("import { db } from '../lib/firebase';", replacement)

catch_block = """    } catch (err) {
        console.error(err);
        alert('Erro ao sincronizar.');
        handleFirestoreError(err, OperationType.WRITE, 'patients');
    } finally {"""
code = code.replace("""    } catch (err) {
        console.error(err);
        alert('Erro ao sincronizar.');
    } finally {""", catch_block)

with open('src/views/DashboardView.tsx', 'w') as f:
    f.write(code)
