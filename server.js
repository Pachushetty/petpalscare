const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const ROUTES = {
  '/': 'home.html',
  '/login': 'index.html',
  '/home': 'home.html',
  '/register': 'register.html',
  '/forgot-password': 'forgot-password.html',
  '/dashboard': 'dashboard.html',
  '/my-pets': 'my-pets.html',
  '/services': 'services.html',
  '/book-service': 'book-service-modal.html',
  '/book-service-modal': 'book-service-modal.html',
  '/book-service-pet': 'book-service-pet.html',
  '/book-service-schedule': 'book-service-schedule.html',
  '/book-service-review': 'book-service-review.html',
  '/booking-confirmed': 'booking-confirmed.html',
  '/my-bookings': 'my-bookings.html',
  '/bookings-pet-dashboard': 'bookings-pet-dashboard.html',
  '/profile': 'profile.html',
  // ADMIN PORTAL - intentionally separate from user portal
  '/admin': 'admin.html',
  '/admin/dashboard': 'admin.html',
  '/admin/bookings': 'admin.html',
  '/admin/users': 'admin.html',
  '/admin/pets': 'admin.html',
  '/admin/services': 'admin.html',
  '/admin/reviews': 'admin.html',
  '/admin/messages': 'admin.html',
  '/admin/reports': 'admin.html',
  '/admin/settings': 'admin.html',
  '/mobile-portal': 'mobile-portal.html'
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  try {
    urlPath = decodeURIComponent(urlPath);
  } catch (e) {
    // ignore decode error
  }

  let relPath = ROUTES[urlPath] || (urlPath === '/' ? 'home.html' : urlPath.replace(/^\/+/, ''));
  let filePath = path.resolve(PUBLIC_DIR, relPath);

  // Prevent path traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      // Fallback for clean URLs or 404
      const htmlPath = filePath + '.html';
      if (htmlPath.startsWith(PUBLIC_DIR) && fs.existsSync(htmlPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
        fs.createReadStream(htmlPath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      }
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`PetPals Care Portal running at http://0.0.0.0:${PORT}`);
});
