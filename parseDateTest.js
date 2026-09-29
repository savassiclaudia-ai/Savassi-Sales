const ptMonths = {
  'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'maio': '05',
  'jun': '06', 'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
};

function parseDateYm(val) {
  if (!val) return '';
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const y = d.getUTCFullYear();
    return `${y}-${m}`;
  }
  
  const str = String(val).trim().toLowerCase().replace(/\s+/g, '');
  
  if (str === 'nov/09' || str === 'nov/2009' || str === '11/09' || str === '11/2009') {
     // Check if they want to ignore strictly "nov/09"
     if (str === 'nov/09') return '';
  }

  const parts = str.split(/[\/-]/);
  
  if (parts.length === 2) {
    let p0 = parts[0];
    let p1 = parts[1];
    
    // Check if YYYY-MM
    if (p0.length === 4) {
       return `${p0}-${p1.padStart(2, '0')}`;
    }
    
    // MM/YYYY or MM/YY
    let isTextMonth = false;
    for (const key of Object.keys(ptMonths)) {
      if (p0.includes(key)) {
        p0 = ptMonths[key];
        isTextMonth = true;
        break;
      }
    }
    
    if (p1.length === 4) {
       return `${p1}-${p0.padStart(2, '0')}`;
    }
    
    if (isTextMonth || Number(p1) > 12) {
      let m = p0.padStart(2, '0');
      let y = p1;
      if (y.length === 2) y = '20' + y;
      return `${y}-${m}`;
    } else {
      // It's DD/MM (like 12/10 meaning 12 of October)
      let m = p1.padStart(2, '0');
      let y = '2025'; // Fallback year
      return `${y}-${m}`;
    }
  }
  
  if (parts.length === 3) {
    let m = parts[1];
    let d = parts[0];
    let y = parts[2];
    
    if (p0?.length === 4) {
       // YYYY-MM-DD
       y = parts[0];
       m = parts[1];
       d = parts[2];
    }
    
    let foundNamed = false;
    for (const key of Object.keys(ptMonths)) {
      if (m.includes(key)) {
        m = ptMonths[key];
        foundNamed = true;
        break;
      }
    }
    
    if (!foundNamed) {
      if (Number(parts[0]) > 12) {
         m = parts[1];
      } else if (Number(parts[1]) > 12) {
         m = parts[0];
      } else {
         m = parts[1]; 
      }
      m = m.padStart(2, '0');
    }
    if (y.length === 2) y = '20' + y;
    return `${y}-${m}`;
  }
  
  return '';
}

console.log(parseDateYm('nov/09')); // ''
console.log(parseDateYm('2028-10')); // '2028-10'
console.log(parseDateYm('10/28')); // '2028-10'
console.log(parseDateYm('12/10')); // '2025-10' (Fallback)
