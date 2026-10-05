// Script to wire up navigation in all PetPals HTML files
const fs = require('fs');

// Define the navigation replacer for dashboard-style pages (with sidebar)
// These pages have sidebar nav with data-path attributes
const dashboardPages = [
  { file: 'dashboard.html', activePath: 'dashboard' },
  { file: 'my-pets.html', activePath: 'my-pets' },
  { file: 'my-bookings.html', activePath: 'my-bookings' },
  { file: 'services.html', activePath: 'services' },
  { file: 'profile.html', activePath: 'profile' },
    { file: 'bookings-pet-dashboard.html', activePath: 'bookings-pet-dashboard' },
  { file: 'book-service-modal.html', activePath: 'services' },
  { file: 'book-service-pet.html', activePath: 'services' },
  { file: 'book-service-schedule.html', activePath: 'services' },
  { file: 'book-service-review.html', activePath: 'services' },
  { file: 'booking-confirmed.html', activePath: 'services' },
];

// Navigation script to inject into dashboard pages (before </body>)
const dashboardNavScript = `
<script>
(function() {
  // Sidebar navigation routing
  const navRoutes = {
    'dashboard': '/dashboard',
    'my-bookings': '/my-bookings',
    'my-pets': '/my-pets',
    'services': '/services',
    'profile': '/profile',
    'logout': '/'
  };
  document.querySelectorAll('aside nav a[data-path]').forEach(link => {
    const path = link.getAttribute('data-path');
    if (navRoutes[path]) {
      link.href = navRoutes[path];
    }
  });
  // Logout link
  document.querySelectorAll('aside a[data-path="logout"]').forEach(link => {
    link.href = '/';
  });
  // "Book New Service" button in header
  document.querySelectorAll('header button').forEach(btn => {
    if (btn.textContent.trim().includes('Book New Service')) {
      btn.addEventListener('click', () => { window.location.href = '/book-service'; });
    }
  });
  // "View All" links -> route to relevant pages
  document.querySelectorAll('a').forEach(link => {
    const text = (link.textContent || '').trim();
    if (link.href.includes('#') || link.getAttribute('href') === '#') {
      if (text === 'View All' || text.includes('View all')) {
        // Try to figure out context from parent
        const parent = link.closest('[class]');
        const parentText = parent ? parent.textContent : '';
        if (parentText.toLowerCase().includes('booking')) link.href = '/my-bookings';
        else if (parentText.toLowerCase().includes('pet')) link.href = '/my-pets';
        else if (parentText.toLowerCase().includes('service')) link.href = '/services';
      }
    }
  });
  // Profile avatar link -> /profile
  document.querySelectorAll('header .cursor-pointer').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => { window.location.href = '/profile'; });
  });
})();
</script>`;

// Process dashboard pages
dashboardPages.forEach(({file, activePath}) => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Skip if already wired
  if (content.includes('navRoutes')) {
    console.log('Skipping (already wired):', file);
    return;
  }
  
  // Inject before </body>
  content = content.replace('</body>', dashboardNavScript + '\n</body>');
  fs.writeFileSync(file, content);
  console.log('Wired dashboard nav:', file);
});

// ---- Wire up booking flow buttons ----

// book-service-modal.html: "Continue to Pet Details" -> /book-service-pet
// book-service-pet.html: "Back to Services" -> /services, "Continue to Schedule" -> /book-service-schedule
// book-service-schedule.html: "Back to Pet Details" -> /book-service-pet, "Continue to Summary" -> /book-service-review
// book-service-review.html: "Back to Schedule" -> /book-service-schedule, "Confirm & Book" -> /booking-confirmed
// booking-confirmed.html: "Return to Pet Dashboard" -> /dashboard

const bookingFlowScript = `
<script>
(function() {
  // Booking flow navigation
  document.querySelectorAll('button, a').forEach(el => {
    const text = (el.textContent || '').trim().toLowerCase();
    if (text.includes('continue to pet detail')) {
      el.addEventListener('click', () => { window.location.href = '/book-service-pet'; });
    } else if (text.includes('back to service')) {
      el.addEventListener('click', () => { window.location.href = '/services'; });
    } else if (text.includes('continue to schedule')) {
      el.addEventListener('click', () => { window.location.href = '/book-service-schedule'; });
    } else if (text.includes('back to pet detail')) {
      el.addEventListener('click', () => { window.location.href = '/book-service-pet'; });
    } else if (text.includes('continue to summary')) {
      el.addEventListener('click', () => { window.location.href = '/book-service-review'; });
    } else if (text.includes('back to schedule')) {
      el.addEventListener('click', () => { window.location.href = '/book-service-schedule'; });
    } else if (text.includes('confirm') && text.includes('book')) {
      el.addEventListener('click', () => { window.location.href = '/booking-confirmed'; });
    } else if (text.includes('return to pet dashboard') || text.includes('return to dashboard') || text.includes('view dashboard')) {
      el.addEventListener('click', () => { window.location.href = '/dashboard'; });
      if (el.tagName === 'A') el.href = '/dashboard';
    } else if (text === 'cancel') {
      el.addEventListener('click', () => { window.location.href = '/services'; });
    }
  });
  
  // Close/X buttons -> go back
  document.querySelectorAll('button[aria-label*="Close"], button[aria-label*="close"]').forEach(btn => {
    btn.addEventListener('click', () => { history.back(); });
  });
})();
</script>`;

const bookingFlowFiles = ['book-service-modal.html', 'book-service-pet.html', 'book-service-schedule.html', 'book-service-review.html', 'booking-confirmed.html'];

bookingFlowFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('booking flow navigation')) {
    console.log('Skipping (already wired):', file);
    return;
  }
  
  content = content.replace('</body>', bookingFlowScript + '\n</body>');
  fs.writeFileSync(file, content);
  console.log('Wired booking flow:', file);
});

// ---- Wire home.html (public) ----
{
  let content = fs.readFileSync('home.html', 'utf8');
  if (!content.includes('homeNavScript')) {
    const homeNavScript = `
<script>
// homeNavScript
(function() {
  // Book Now buttons -> /book-service
  document.querySelectorAll('a[href="#"], button').forEach(el => {
    const text = (el.textContent || '').trim().toLowerCase();
    if (text.includes('book now') || text.includes('book a service')) {
      if (el.tagName === 'A') el.href = '/book-service';
      else el.addEventListener('click', () => { window.location.href = '/book-service'; });
    }
  });
  // Nav links
  document.querySelectorAll('nav a[data-path]').forEach(link => {
    const path = link.getAttribute('data-path');
    if (path === 'home') link.href = '/home';
    else if (path === 'pet-care') link.href = '/services';
    else if (path === 'pet-medical') link.href = '/services#medical';
    else if (path === 'pet-accessories') link.href = '/services#accessories';
    else if (path === 'booking') link.href = '/book-service';
  });
  // Profile icon -> /dashboard
  document.querySelectorAll('header .rounded-full.bg-primary').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => { window.location.href = '/dashboard'; });
  });
  // Logo -> /home
  document.querySelectorAll('header img').forEach(img => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => { window.location.href = '/home'; });
  });
})();
</script>`;
    content = content.replace('</body>', homeNavScript + '\n</body>');
    fs.writeFileSync('home.html', content);
    console.log('Wired home.html');
  }
}

// Wire register.html: "Sign In" link -> /login, form -> /dashboard
{
  let content = fs.readFileSync('register.html', 'utf8');
  if (!content.includes('registerNavScript')) {
    const registerNavScript = `
<script>
// registerNavScript
(function() {
  // Form submission -> go to dashboard
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = '/dashboard';
    });
  });
  // Login link fix
  document.querySelectorAll('a[href="/login"], a[href="/"]').forEach(link => {
    if ((link.textContent || '').toLowerCase().includes('sign in') || (link.textContent || '').toLowerCase().includes('log in')) {
      link.href = '/login';
    }
  });
})();
</script>`;
    content = content.replace('</body>', registerNavScript + '\n</body>');
    fs.writeFileSync('register.html', content);
    console.log('Wired register.html');
  }
}

console.log('\nAll navigation wired successfully!');
