const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const hrefMatches = content.match(/href=["'](.*?)["']/g) || [];
  const hrefs = hrefMatches.map(m => m.slice(6, -1));
  const uniqueHrefs = [...new Set(hrefs)].filter(h => !h.startsWith('http') && !h.startsWith('data:') && !h.startsWith('#icon-'));
  console.log('--- ' + file + ' ---');
  console.log(uniqueHrefs);
});
