const fs = require('fs');
let content = fs.readFileSync('admin.html', 'utf8');

// Admin has: <div class="w-10 h-10 rounded-xl bg-brand-brown text-white flex items-center justify-center shadow-sm"><svg...></svg></div>
// followed by: <div class="flex flex-col"><span>PetPals</span>...
// We want to remove the outer box div and keep just svg + PetPals text, shown as:
// <span class="text-brand-brown text-2xl">🐾</span> PetPals

// Find and replace the boxed paw div
const boxedPawStart = content.indexOf('<div class="w-10 h-10 rounded-xl bg-brand-brown');
const boxedPawEnd = content.indexOf('</div>', boxedPawStart) + 6;

if (boxedPawStart !== -1) {
  const boxedPaw = content.slice(boxedPawStart, boxedPawEnd);
  console.log('Removing box:', boxedPaw.slice(0, 80));
  
  // Replace with an unboxed paw svg
  const cleanPaw = `<svg class="w-7 h-7 fill-current text-brand-brown" viewBox="0 0 24 24"><circle cx="8" cy="6" r="2.2"></circle><circle cx="16" cy="6" r="2.2"></circle><circle cx="4" cy="11.5" r="2"></circle><circle cx="20" cy="11.5" r="2"></circle><ellipse cx="12" cy="17" rx="5" ry="4"></ellipse></svg>`;
  
  content = content.slice(0, boxedPawStart) + cleanPaw + content.slice(boxedPawEnd);
  fs.writeFileSync('admin.html', content);
  console.log('Admin logo box removed!');
} else {
  console.log('Boxed paw not found');
}
