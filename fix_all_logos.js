const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

const pawIcon = `<span class="material-symbols-outlined text-[28px] text-primary" style="font-variation-settings: 'FILL' 1;">pets</span>`;

// Two patterns used across files:
// 1. The public logo image (aida-public URL)
const publicLogoRegex = /<img\s+alt="PetPals Logo"[^>]*\/>/g;

// 2. The dashboard sidebar logo image (aida/ URL with long alt text about brand tokens)
const dashboardLogoRegex = /<img\s+alt="Minimalist modern pet brand logo[^"]*"[^>]*\/>/g;

let count = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (publicLogoRegex.test(content)) {
    content = content.replace(/<img\s+alt="PetPals Logo"[^>]*\/>/g, pawIcon);
    changed = true;
  }

  if (dashboardLogoRegex.test(content)) {
    content = content.replace(/<img\s+alt="Minimalist modern pet brand logo[^"]*"[^>]*\/>/g, pawIcon);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed logo in:', file);
    count++;
  } else {
    console.log('No logo img found in:', file);
  }
});

console.log('\nDone! Fixed', count, 'files.');
