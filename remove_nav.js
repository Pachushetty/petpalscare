const fs = require('fs');
let content = fs.readFileSync('home.html', 'utf8');

// Remove the entire <nav class="hidden lg:flex ...">...</nav> pill block from header
const navOpenStart = content.indexOf('<nav class="hidden lg:flex');
const navClose = content.indexOf('</nav>', navOpenStart) + 6;

if (navOpenStart === -1) {
  console.log('Nav not found!');
} else {
  console.log('Removing nav from chars', navOpenStart, 'to', navClose);
  content = content.slice(0, navOpenStart) + content.slice(navClose);
  fs.writeFileSync('home.html', content);
  console.log('Nav pill removed from home.html');
}
