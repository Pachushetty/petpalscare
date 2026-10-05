const fs = require('fs');

const pawIcon = `<span class="material-symbols-outlined text-[28px] text-primary" style="font-variation-settings: 'FILL' 1;">pets</span>`;

// Fix all remaining files with any variant of the logo img tag
const files = ['admin.html', 'book-service-schedule.html', 'dashboard.html', 'index.html', 'my-pets.html'];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace ALL img tags that are logo-related (PetPals Logo or brand logo alt text)
  const before = content.length;

  content = content.replace(/<img\s+alt="PetPals Logo"[^>]*\/?>/g, () => { changed = true; return pawIcon; });
  content = content.replace(/<img\s+alt="Minimalist modern pet brand logo[^"]*"[^>]*\/?>/g, () => { changed = true; return pawIcon; });

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed logo in:', file);
  } else {
    // Try a broader match on any img with aida logo URL
    const logoImgRegex = /<img[^>]*AEtjO1UTUlVZqQO9gjtNhxbMpKlwG2LolmaOPk[^>]*\/?>/g;
    if (logoImgRegex.test(content)) {
      content = content.replace(/<img[^>]*AEtjO1UTUlVZqQO9gjtNhxbMpKlwG2LolmaOPk[^>]*\/?>/g, pawIcon);
      fs.writeFileSync(file, content);
      console.log('Fixed logo (URL match) in:', file);
    } else {
      console.log('Could not fix:', file, '- checking imgs...');
      const imgs = [...content.matchAll(/<img[^>]{0,50}/g)];
      imgs.forEach(m => console.log('  img:', m[0]));
    }
  }
});

console.log('Done!');
