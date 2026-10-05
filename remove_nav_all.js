const fs = require('fs');

const files = [
  'book-service-modal.html',
  'book-service-pet.html',
  'book-service-schedule.html',
  'book-service-review.html',
  'booking-confirmed.html',
  'services.html',
  'bookings-pet-dashboard.html',
  'mobile-portal.html'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Remove <nav class="hidden lg:flex ...">...</nav> pill
  const navStart = content.indexOf('<nav class="hidden lg:flex');
  if (navStart === -1) {
    console.log('No pill nav in:', file);
    return;
  }
  const navEnd = content.indexOf('</nav>', navStart) + 6;
  content = content.slice(0, navStart) + content.slice(navEnd);
  fs.writeFileSync(file, content);
  console.log('Removed nav pill from:', file);
});

console.log('Done!');
