import re

with open('src/views/CrmView.tsx', 'r') as f:
    code = f.read()

handle_save = """  const handleSave = async () => {
    if (!p) return;
    setIsSaving(true);
    try {
      const ref = doc(db, 'patients', p.id);
      const cleanData: Record<string, any> = {};
      Object.entries(formData).forEach(([k, v]) => {
         if (v !== undefined) cleanData[k] = v;
      });
      await updateDoc(ref, cleanData);
      setEditMode(false);
    } catch (error) {
      console.error(error);
      alert('Error updating patient profile');
    } finally {
      setIsSaving(false);
    }
  };"""

# Find the boundaries and replace
start_str = "  const handleSave = async () => {"
end_str = "  };"
start_idx = code.find(start_str)
end_idx = code.find(end_str, start_idx)

if start_idx != -1 and end_idx != -1:
    code = code[:start_idx] + handle_save + code[end_idx + len(end_str):]
    with open('src/views/CrmView.tsx', 'w') as f:
        f.write(code)
    print("Fixed CrmView handleSave successfully")
else:
    print("Could not find handleSave boundaries")
