const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = require('./db.js');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Helper to extract authenticated user from header
function getAuthUserId(req) {
  const headerId = req.headers['x-user-id'];
  if (headerId && typeof headerId === 'string' && headerId.trim()) {
    return headerId.trim();
  }
  return 'usr-prathiksha'; // Default fallback user for seamless demo experience
}

// -------------------------------------------------------------
// BACKEND REST API ROUTES (/api/*)
// -------------------------------------------------------------

// System Health & Database Connection Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    postgresConnected: db.isPostgresConnected(),
    database: db.isPostgresConnected() ? 'PostgreSQL' : 'Local Persistence (awaiting DATABASE_URL)',
    timestamp: new Date().toISOString()
  });
});

// --- AUTHENTICATION APIS ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, location } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const newUser = await db.createUser({
      name: name || 'Pet Parent',
      email,
      password,
      phone: phone || '+91 98765 43210',
      location: location || 'Mangalore, Karnataka'
    });

    const { password_hash, ...safeUser } = newUser;
    res.status(201).json({ success: true, user: safeUser });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { password_hash, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const user = await db.findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password_hash, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.put('/api/auth/profile', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const updated = await db.updateUser(userId, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password_hash, ...safeUser } = updated;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = await db.findAdminByEmail(email);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isValid = bcrypt.compareSync(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const { password_hash, ...safeAdmin } = admin;
    res.json({ success: true, admin: safeAdmin });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Admin login failed' });
  }
});

// --- PETS APIS ---
app.get('/api/pets', async (req, res) => {
  try {
    const isAdmin = req.query.admin === 'true';
    if (isAdmin) {
      const allPets = await db.getAllPets();
      return res.json(allPets);
    }
    const userId = getAuthUserId(req);
    const pets = await db.getPetsByUserId(userId);
    res.json(pets);
  } catch (err) {
    console.error('Get pets error:', err);
    res.status(500).json({ error: 'Failed to fetch pets' });
  }
});

app.post('/api/pets', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!req.body.name) {
      return res.status(400).json({ error: 'Pet name is required' });
    }
    const newPet = await db.createPet(req.body, userId);
    res.status(201).json(newPet);
  } catch (err) {
    console.error('Create pet error:', err);
    res.status(500).json({ error: 'Failed to save pet' });
  }
});

app.put('/api/pets/:id', async (req, res) => {
  try {
    const petId = req.params.id;
    const userId = req.query.admin === 'true' ? null : getAuthUserId(req);
    const updated = await db.updatePet(petId, req.body, userId);
    if (!updated) {
      return res.status(404).json({ error: 'Pet not found or unauthorized' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Update pet error:', err);
    res.status(500).json({ error: 'Failed to update pet' });
  }
});

app.delete('/api/pets/:id', async (req, res) => {
  try {
    const petId = req.params.id;
    const userId = req.query.admin === 'true' ? null : getAuthUserId(req);
    await db.deletePet(petId, userId);
    res.json({ success: true, message: 'Pet removed' });
  } catch (err) {
    console.error('Delete pet error:', err);
    res.status(500).json({ error: 'Failed to remove pet' });
  }
});

// --- SERVICES APIS ---
app.get('/api/services', async (req, res) => {
  try {
    const onlyActive = req.query.all !== 'true';
    const services = await db.getAllServices(onlyActive);
    res.json(services);
  } catch (err) {
    console.error('Get services error:', err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ error: 'Service name is required' });
    }
    const created = await db.createService(req.body);
    res.status(201).json(created);
  } catch (err) {
    console.error('Create service error:', err);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

app.put('/api/services/:id', async (req, res) => {
  try {
    const updated = await db.updateService(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Service not found' });
    res.json(updated);
  } catch (err) {
    console.error('Update service error:', err);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    await db.deleteService(req.params.id);
    res.json({ success: true, message: 'Service removed' });
  } catch (err) {
    console.error('Delete service error:', err);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// --- BOOKINGS APIS ---
app.get('/api/bookings', async (req, res) => {
  try {
    const isAdmin = req.query.admin === 'true';
    if (isAdmin) {
      const allBookings = await db.getAllBookings();
      return res.json(allBookings);
    }
    const userId = getAuthUserId(req);
    const bookings = await db.getBookingsByUserId(userId);
    res.json(bookings);
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const booking = await db.createBooking(req.body, userId);
    res.status(201).json(booking);
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Failed to book service' });
  }
});

app.put('/api/bookings/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });
    const updated = await db.updateBookingStatus(req.params.id, status, notes);
    if (!updated) return res.status(404).json({ error: 'Booking not found' });
    res.json(updated);
  } catch (err) {
    console.error('Update booking status error:', err);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// --- REVIEWS APIS ---
app.get('/api/reviews', async (req, res) => {
  try {
    const onlyApproved = req.query.admin !== 'true';
    const reviews = await db.getAllReviews(onlyApproved);
    res.json(reviews);
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!req.body.comment) {
      return res.status(400).json({ error: 'Comment is required' });
    }
    const created = await db.createReview(req.body, userId);
    res.status(201).json(created);
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ error: 'Failed to save review' });
  }
});

app.put('/api/reviews/:id', async (req, res) => {
  try {
    const updated = await db.updateReview(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Review not found' });
    res.json(updated);
  } catch (err) {
    console.error('Update review error:', err);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

app.delete('/api/reviews/:id', async (req, res) => {
  try {
    await db.deleteReview(req.params.id);
    res.json({ success: true, message: 'Review removed' });
  } catch (err) {
    console.error('Delete review error:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// --- MESSAGES / INQUIRIES APIS ---
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await db.getAllMessages();
    res.json(messages);
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!req.body.message || !req.body.name) {
      return res.status(400).json({ error: 'Name and message are required' });
    }
    const created = await db.createMessage(req.body, userId);
    res.status(201).json(created);
  } catch (err) {
    console.error('Create message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.post('/api/messages/:id/reply', async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply) return res.status(400).json({ error: 'Reply text is required' });
    const updated = await db.replyMessage(req.params.id, reply);
    if (!updated) return res.status(404).json({ error: 'Message not found' });
    res.json(updated);
  } catch (err) {
    console.error('Reply message error:', err);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

// --- ADMIN STATS, USERS & SETTINGS ---
app.get('/api/admin/stats', async (req, res) => {
  try {
    const stats = await db.getAdminStats();
    res.json(stats);
  } catch (err) {
    console.error('Get admin stats error:', err);
    res.status(500).json({ error: 'Failed to calculate statistics' });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error('Get admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/admin/settings', async (req, res) => {
  try {
    const settings = await db.getAdminSettings();
    res.json(settings);
  } catch (err) {
    console.error('Get admin settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/admin/settings', async (req, res) => {
  try {
    const saved = await db.saveAdminSettings(req.body);
    res.json(saved);
  } catch (err) {
    console.error('Save admin settings error:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// -------------------------------------------------------------
// FRONTEND STATIC FILES & PAGE ROUTING
// -------------------------------------------------------------
const PAGE_ROUTES = {
  '/': 'home.html',
  '/home': 'home.html',
  '/login': 'index.html',
  '/register': 'register.html',
  '/forgot-password': 'forgot-password.html',
  '/dashboard': 'dashboard.html',
  '/my-pets': 'my-pets.html',
  '/services': 'services.html',
  '/book-service': 'book-service-modal.html',
  '/book-new-service': 'book-service-modal.html',
  '/book-service-modal': 'book-service-modal.html',
  '/book-service-pet': 'book-service-pet.html',
  '/book-service-schedule': 'book-service-schedule.html',
  '/book-service-review': 'book-service-review.html',
  '/booking-confirmed': 'booking-confirmed.html',
  '/my-bookings': 'my-bookings.html',
  '/bookings-pet-dashboard': 'bookings-pet-dashboard.html',
  '/profile': 'profile.html',
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

// Route specific page mappings
Object.keys(PAGE_ROUTES).forEach(route => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, PAGE_ROUTES[route]));
  });
});

// Serve static assets from workspace root (js, css, images, html)
app.use(express.static(PUBLIC_DIR, {
  extensions: ['html', 'htm']
}));

// Fallback for clean HTML routes or 404
app.use((req, res) => {
  const cleanPath = req.path.replace(/^\/+/, '');
  const candidate = path.join(PUBLIC_DIR, cleanPath + '.html');
  if (fs.existsSync(candidate)) {
    return res.sendFile(candidate);
  }
  res.status(404).sendFile(path.join(PUBLIC_DIR, 'home.html'));
});

// Boot Database & Launch Server
async function startServer() {
  await db.initDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PetPals Care Portal running at http://0.0.0.0:${PORT}`);
    console.log(`Database engine: ${db.isPostgresConnected() ? 'PostgreSQL (Cloud / Remote)' : 'Local persistence (awaiting DATABASE_URL)'}`);
  });
}

startServer().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
