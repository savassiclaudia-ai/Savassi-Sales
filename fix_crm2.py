import re

with open('src/views/CrmView.tsx', 'r') as f:
    code = f.read()

replacement = """import { db, handleFirestoreError, OperationType } from '../lib/firebase';"""
code = code.replace("import { db } from '../lib/firebase';", replacement)

catch_block = """    } catch (error) {
      console.error(error);
      alert('Erro ao salvar paciente.');
      handleFirestoreError(error, OperationType.UPDATE, 'patients/' + selectedId);
    } finally {"""
code = code.replace("""    } catch (error) {
      console.error(error);
      alert('Erro ao salvar paciente.');
    } finally {""", catch_block)

with open('src/views/CrmView.tsx', 'w') as f:
    f.write(code)
