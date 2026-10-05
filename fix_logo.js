const fs = require('fs');
let content = fs.readFileSync('home.html', 'utf8');

// Find the logo img tag in the header and remove it
// The header logo area looks like:
// <div class="flex items-center gap-space-sm"><img alt="PetPals Logo" .../>
// <span class="font-headline-sm ...">PetPals</span></div>

// Replace the img tag with a material symbol paw icon
const imgRegex = /<img\s+alt="PetPals Logo"[^>]*\/>/;
const match = content.match(imgRegex);

if (match) {
  console.log('Found img:', match[0].slice(0, 80));
  // Replace with a paw icon span (no box, just the icon)
  const pawIcon = '<span class="material-symbols-outlined text-[28px] text-primary" style="font-variation-settings: \'FILL\' 1;">pets</span>';
  content = content.replace(imgRegex, pawIcon);
  fs.writeFileSync('home.html', content);
  console.log('Logo img replaced with paw icon in home.html');
} else {
  console.log('Img not found - checking...');
  const idx = content.indexOf('PetPals Logo');
  console.log('PetPals Logo at char:', idx);
  console.log('Context:', content.slice(idx - 20, idx + 200));
}
