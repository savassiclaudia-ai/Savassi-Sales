import re

with open('src/views/ProceduresView.tsx', 'r') as f:
    code = f.read()

replacement = """import { db, handleFirestoreError, OperationType } from '../lib/firebase';"""
code = code.replace("import { db } from '../lib/firebase';", replacement)

error_handler = """    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'procedures');
    });"""

code = code.replace("""    });
    return unsub;""", error_handler + "\n    return unsub;")

catch_save = """    } catch (e) {
      console.error(e);
      alert('Erro ao salvar procedimento');
      handleFirestoreError(e, OperationType.WRITE, 'procedures');
    }"""
code = code.replace("""    } catch (e) {
      console.error(e);
      alert('Erro ao salvar procedimento');
    }""", catch_save)

catch_delete = """  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este procedimento?')) {
      try {
        await deleteDoc(doc(db, 'procedures', id));
      } catch(e) {
        handleFirestoreError(e, OperationType.DELETE, 'procedures/' + id);
      }
    }
  };"""
code = re.sub(r'  const handleDelete = async \(id: string\) => \{\n    if \(confirm\(\'Tem certeza que deseja excluir este procedimento\?\'\)\) \{\n      await deleteDoc\(doc\(db, \'procedures\', id\)\);\n    \}\n  \};', catch_delete, code)

with open('src/views/ProceduresView.tsx', 'w') as f:
    f.write(code)
