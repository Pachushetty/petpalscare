const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = require('./db.js');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = __dirname;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Helper to set cookie properly for both standard and iframe/HTTPS contexts
function setSessionCookie(req, res, token) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie('petpals_session', token, {
    httpOnly: false,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function clearSessionCookie(req, res) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.clearCookie('petpals_session', { path: '/' });
  res.clearCookie('petpals_session', { path: '/', secure: isHttps, sameSite: isHttps ? 'none' : 'lax' });
  res.cookie('petpals_session', '', { path: '/', expires: new Date(0), maxAge: 0 });
}

function setAdminSessionCookie(req, res, token) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie('petpals_admin_session', token, {
    httpOnly: true, secure: isHttps, sameSite: isHttps ? 'none' : 'lax',
    path: '/', maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function clearAdminSessionCookie(req, res) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.clearCookie('petpals_admin_session', { path: '/', secure: isHttps, sameSite: isHttps ? 'none' : 'lax' });
}

async function getAuthAdmin(req) {
  return db.getAdminSession(req.cookies?.petpals_admin_session);
}

// Helper to extract authenticated user from session token (Cookie, Bearer header, X-Session-Token, or query)
async function getAuthUser(req) {
  const token = req.cookies?.petpals_session ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null) ||
    req.headers['x-session-token'] ||
    req.query?.session_token ||
    req.query?.token;

  if (!token) return null;
  const sessionData = await db.getSession(token);
  const sessionUser = sessionData?.user;
  if (!sessionUser?.id) return null;

  let user = await db.findUserById(sessionUser.id);
  if (!user) return null;
  if (db.isGeneratedProfileAvatar(user)) {
    try {
      const cleanedUser = await db.updateUser(user.id, { avatar: null });
      user = cleanedUser || { ...user, avatar: null };
    } catch (err) {
      console.warn('Could not clear generated profile photo:', err.message);
      user = { ...user, avatar: null };
    }
  }
  const { password_hash, ...safeUser } = user;
  safeUser.firstName = safeUser.firstName || safeUser.first_name || safeUser.name?.trim().split(/\s+/)[0] || 'Member';
  return safeUser;
}

async function getAuthUserId(req) {
  const user = await getAuthUser(req);
  return user?.id || null;
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

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existing = await db.findUserByEmail(trimmedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
    }

    const trimmedName = (name || '').trim();
    if (trimmedName.length < 2) {
      return res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
    }

    const newUser = await db.createUser({
      name: trimmedName,
      email: trimmedEmail,
      password,
      phone: (phone || '').trim(),
      location: (location || '').trim()
    });

    const { password_hash, ...safeUser } = newUser;

    res.status(201).json({
      success: true,
      user: safeUser
    });
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
    }
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await db.findUserByEmail(trimmedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password. Please check your credentials.' });
    }

    let isValid = false;
    if (user.password_hash) {
      if (typeof user.password_hash === 'string' && /^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/.test(user.password_hash)) {
        try {
          isValid = bcrypt.compareSync(password, user.password_hash);
        } catch (e) {
          isValid = false;
        }
      } else {
        isValid = user.password_hash === password;
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password. Please check your credentials.' });
    }

    const session = await db.createSession(user.id);
    const { password_hash, ...safeUser } = user;

    setSessionCookie(req, res, session.token);

    res.json({
      success: true,
      token: session.token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const tokens = [
      req.cookies?.petpals_session,
      req.headers['x-session-token'],
      req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null,
      req.body?.token
    ].filter(Boolean);

    for (const token of tokens) {
      await db.deleteSession(token);
    }
    clearSessionCookie(req, res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Failed to log out' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated. Please log in.' });
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
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated. Please log in.' });
    }
    const body = req.body || {};
    const profileData = {};
    for (const field of ['name', 'email', 'phone', 'location', 'avatar']) {
      if (Object.prototype.hasOwnProperty.call(body, field)) profileData[field] = body[field];
    }
    if (Object.prototype.hasOwnProperty.call(body, 'address') && !Object.prototype.hasOwnProperty.call(profileData, 'location')) {
      profileData.location = body.address;
    }

    if (Object.prototype.hasOwnProperty.call(profileData, 'name') &&
        (typeof profileData.name !== 'string' || !profileData.name.trim())) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    if (Object.prototype.hasOwnProperty.call(profileData, 'email')) {
      if (typeof profileData.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email.trim())) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }
      profileData.email = profileData.email.trim().toLowerCase();
      const existing = await db.findUserByEmail(profileData.email);
      if (existing && existing.id !== user.id) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }
    }

    for (const field of ['phone', 'location']) {
      if (Object.prototype.hasOwnProperty.call(profileData, field) &&
          profileData[field] !== null && typeof profileData[field] !== 'string') {
        return res.status(400).json({ error: `Invalid ${field} value.` });
      }
    }
    if (Object.prototype.hasOwnProperty.call(profileData, 'avatar') &&
        profileData.avatar !== null && typeof profileData.avatar !== 'string') {
      return res.status(400).json({ error: 'Invalid profile photo.' });
    }

    if (Object.keys(profileData).length === 0) {
      return res.status(400).json({ error: 'No profile changes were provided.' });
    }

    const updated = await db.updateUser(user.id, profileData);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password_hash, ...safeUser } = updated;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    console.error('Update profile error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
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

    const session = await db.createAdminSession(admin.id);
    setAdminSessionCookie(req, res, session.token);
    const { password_hash, ...safeAdmin } = admin;
    safeAdmin.name = 'Admin';
    res.json({ success: true, admin: safeAdmin });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Admin login failed' });
  }
});

app.get('/api/admin/me', async (req, res) => {
  try {
    const admin = await getAuthAdmin(req);
    if (!admin) return res.status(401).json({ error: 'Admin authentication required.' });
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const settings = await db.getAdminSettings();
    res.json({ id: admin.id, name: 'Admin', email: settings.adminEmail || admin.email, role: admin.role, avatar: admin.avatar || null });
  } catch (err) {
    console.error('Get admin identity error:', err);
    res.status(500).json({ error: 'Failed to load Admin identity' });
  }
});

app.post('/api/admin/logout', async (req, res) => {
  try {
    await db.deleteAdminSession(req.cookies?.petpals_admin_session);
    clearAdminSessionCookie(req, res);
    res.json({ success: true });
  } catch (err) {
    console.error('Admin logout error:', err);
    res.status(500).json({ error: 'Failed to sign out' });
  }
});

// --- PETS APIS ---
app.get('/api/pets', async (req, res) => {
  try {
    const isAdmin = req.query.admin === 'true';
    if (isAdmin) {
      if (!await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
      const allPets = await db.getAllPets();
      return res.json(allPets);
    }
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    const pets = await db.getPetsByUserId(user.id);
    res.json(pets);
  } catch (err) {
    console.error('Get pets error:', err);
    res.status(500).json({ error: 'Failed to fetch pets' });
  }
});

app.post('/api/pets', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    if (!req.body.name) {
      return res.status(400).json({ error: 'Pet name is required' });
    }
    const newPet = await db.createPet(req.body, user.id);
    res.status(201).json(newPet);
  } catch (err) {
    console.error('Create pet error:', err);
    res.status(500).json({ error: 'Failed to save pet' });
  }
});

app.put('/api/pets/:id', async (req, res) => {
  try {
    const petId = req.params.id;
    const isAdmin = req.query.admin === 'true';
    let userId = null;
    if (isAdmin) {
      if (!await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
    } else {
      const user = await getAuthUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required. Please log in.' });
      }
      userId = user.id;
    }
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
    const isAdmin = req.query.admin === 'true';
    let userId = null;
    if (isAdmin) {
      if (!await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
    } else {
      const user = await getAuthUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required. Please log in.' });
      }
      userId = user.id;
    }
    const deleted = await db.deletePet(petId, userId);
    if (!deleted) return res.status(404).json({ error: 'Pet not found or unauthorized' });
    res.json({ success: true, message: 'Pet removed' });
  } catch (err) {
    console.error('Delete pet error:', err);
    res.status(500).json({ error: 'Failed to remove pet' });
  }
});

// --- SERVICES APIS ---
app.get('/api/services', async (req, res) => {
  try {
    const includeInactive = req.query.all === 'true';
    if (includeInactive && !await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
    const onlyActive = !includeInactive;
    const services = await db.getAllServices(onlyActive);
    res.json(services);
  } catch (err) {
    console.error('Get services error:', err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    if (!await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
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
    if (!await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
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
    if (!await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
    await db.deleteService(req.params.id);
    res.json({ success: true, message: 'Service removed' });
  } catch (err) {
    console.error('Delete service error:', err);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// --- SPECIALISTS / GROOMERS APIS ---
app.get('/api/specialists', async (req, res) => {
  try {
    if (req.query.all === 'true' && !await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
    res.json(await db.getSpecialists(req.query.all !== 'true'));
  } catch (err) {
    console.error('Get specialists error:', err);
    res.status(500).json({ error: 'Failed to fetch specialists' });
  }
});

app.post('/api/specialists', async (req, res) => {
  try {
    if (!await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
    const { name, specialization, rating, sessions, availability, photo, active } = req.body || {};
    if (!String(name || '').trim() || !String(specialization || '').trim()) {
      return res.status(400).json({ error: 'Name and specialization are required' });
    }
    if (photo && (!/^data:image\/(png|jpeg|webp|gif);base64,/i.test(photo) || photo.length > 7_000_000)) {
      return res.status(400).json({ error: 'Photo must be an image smaller than 5 MB' });
    }
    const created = await db.createSpecialist({ name, specialization, rating, sessions, availability, photo, active });
    res.status(201).json(created);
  } catch (err) {
    console.error('Create specialist error:', err);
    res.status(500).json({ error: 'Failed to create specialist' });
  }
});

app.put('/api/specialists/:id', async (req, res) => {
  try {
    if (!await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
    if (req.body?.photo && (!/^data:image\/(png|jpeg|webp|gif);base64,/i.test(req.body.photo) || req.body.photo.length > 7_000_000)) {
      return res.status(400).json({ error: 'Photo must be an image smaller than 5 MB' });
    }
    const updated = await db.updateSpecialist(req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ error: 'Specialist not found' });
    res.json(updated);
  } catch (err) {
    console.error('Update specialist error:', err);
    res.status(500).json({ error: 'Failed to update specialist' });
  }
});

app.delete('/api/specialists/:id', async (req, res) => {
  try {
    if (!await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
    await db.deleteSpecialist(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete specialist error:', err);
    res.status(500).json({ error: 'Failed to delete specialist' });
  }
});

// --- BOOKINGS APIS ---
app.get('/api/bookings/availability', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required. Please log in.' });
    if (!db.isPostgresConnected()) return res.status(503).json({ error: 'Booking availability requires PostgreSQL.' });
    const date = String(req.query.date || '');
    const specialistId = req.query.specialistId ? String(req.query.specialistId) : null;
    const unavailable = await db.getUnavailableBookingTimes(date, specialistId);
    res.set('Cache-Control', 'no-store');
    res.json({ date, unavailable });
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message || 'Failed to load availability' });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const isAdmin = req.query.admin === 'true';
    if (isAdmin) {
      if (!await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
      if (!db.isPostgresConnected()) return res.status(503).json({ error: 'Booking data requires PostgreSQL.' });
      const allBookings = await db.getAllBookings();
      return res.json(allBookings);
    }
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    if (!db.isPostgresConnected()) return res.status(503).json({ error: 'Booking data requires PostgreSQL.' });
    const bookings = await db.getBookingsByUserId(user.id);
    res.json(bookings);
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    if (!db.isPostgresConnected()) return res.status(503).json({ error: 'Booking creation requires PostgreSQL.' });
    const serviceIds = Array.isArray(req.body.serviceIds) ? [...new Set(req.body.serviceIds.filter(Boolean))] : [];
    if (serviceIds.length > 1) {
      const bookings = [];
      for (let index = 0; index < serviceIds.length; index += 1) {
        bookings.push(await db.createBooking({ ...req.body, serviceId: serviceIds[index] }, user.id, { skipAvailabilityCheck: index > 0 }));
      }
      return res.status(201).json(bookings);
    }
    const booking = await db.createBooking({ ...req.body, serviceId: serviceIds[0] || req.body.serviceId }, user.id);
    res.status(201).json(booking);
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : 'Failed to book service' });
  }
});

app.put('/api/bookings/:id/status', async (req, res) => {
  try {
    if (!await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
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
    if (!onlyApproved && !await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
    const reviews = await db.getAllReviews(onlyApproved);
    res.json(reviews);
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.get('/api/reviews/mine', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    res.set('Cache-Control', 'no-store');
    res.json(await db.getReviewsByUserId(user.id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your reviews.' });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    const created = await db.createReview(req.body || {}, user.id, user);
    res.status(201).json(created);
  } catch (err) {
    console.error('Create review error:', err);
    res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : 'Failed to save review' });
  }
});

app.put('/api/reviews/:id', async (req, res) => {
  try {
    if (!await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
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
    if (!await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
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
    if (!await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
    const messages = await db.getAllMessages();
    res.json(messages);
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const userId = await getAuthUserId(req);
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
    if (!await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
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
    if (!await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
    const stats = await db.getAdminStats();
    res.json(stats);
  } catch (err) {
    console.error('Get admin stats error:', err);
    res.status(500).json({ error: 'Failed to calculate statistics' });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    if (!await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
    const users = await db.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error('Get admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/admin/settings', async (req, res) => {
  try {
    if (!await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
    const settings = await db.getAdminSettings();
    res.json(settings);
  } catch (err) {
    console.error('Get admin settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/admin/settings', async (req, res) => {
  try {
    if (!await getAuthAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' });
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
  '/admin/login': 'admin-login.html',
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

const PROTECTED_ROUTES = new Set([
  '/dashboard',
  '/my-pets',
  '/my-bookings',
  '/profile',
  '/book-service',
  '/book-new-service',
  '/book-service-modal',
  '/book-service-pet',
  '/book-service-schedule',
  '/book-service-review',
  '/booking-confirmed',
  '/bookings-pet-dashboard'
]);

const PROTECTED_HTML_FILES = new Set([
  'admin.html',
  'dashboard.html',
  'my-pets.html',
  'my-bookings.html',
  'profile.html',
  'book-service-modal.html',
  'book-service-pet.html',
  'book-service-schedule.html',
  'book-service-review.html',
  'booking-confirmed.html',
  'bookings-pet-dashboard.html'
]);

// Route specific page mappings with session protection
Object.keys(PAGE_ROUTES).forEach(route => {
  app.get(route, async (req, res) => {
    const qToken = req.query.session_token || req.query.token;
    if (qToken) {
      setSessionCookie(req, res, qToken);
    }

    if (route === '/admin/login') {
      if (await getAuthAdmin(req)) return res.redirect('/admin/dashboard');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      return res.sendFile(path.join(PUBLIC_DIR, PAGE_ROUTES[route]));
    }
    if (route === '/admin') {
      return res.redirect(await getAuthAdmin(req) ? '/admin/dashboard' : '/admin/login');
    }
    if (route.startsWith('/admin/')) {
      if (!await getAuthAdmin(req)) return res.redirect('/admin/login');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }

    if (PROTECTED_ROUTES.has(route)) {
      const user = await getAuthUser(req);
      if (!user) {
        return res.redirect('/login');
      }
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    } else if ((route === '/login' || route === '/register') && req.query.switch !== 'true') {
      const user = await getAuthUser(req);
      if (user) {
        return res.redirect('/dashboard');
      }
    }
    res.sendFile(path.join(PUBLIC_DIR, PAGE_ROUTES[route]));
  });
});

// Guard direct HTML access for protected pages before static middleware
app.use(async (req, res, next) => {
  const cleanPath = req.path.replace(/^\/+/, '');
  if (PROTECTED_HTML_FILES.has(cleanPath)) {
    if (cleanPath === 'admin.html') {
      if (!await getAuthAdmin(req)) return res.redirect('/admin/login');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      return next();
    }
    const qToken = req.query.session_token || req.query.token;
    if (qToken) {
      setSessionCookie(req, res, qToken);
    }
    const user = await getAuthUser(req);
    if (!user) {
      return res.redirect('/login');
    }
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
  next();
});

// Serve static assets from workspace root (js, css, images, html)
app.use(express.static(PUBLIC_DIR, {
  extensions: ['html', 'htm']
}));

// Fallback for clean HTML routes or 404
app.use(async (req, res) => {
  const cleanPath = req.path.replace(/^\/+/, '');
  const candidate = path.join(PUBLIC_DIR, cleanPath + '.html');
  if (fs.existsSync(candidate)) {
    if (PROTECTED_HTML_FILES.has(cleanPath + '.html')) {
      if (cleanPath + '.html' === 'admin.html') {
        if (!await getAuthAdmin(req)) return res.redirect('/admin/login');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        return res.sendFile(candidate);
      }
      const qToken = req.query.session_token || req.query.token;
      if (qToken) {
        setSessionCookie(req, res, qToken);
      }
      const user = await getAuthUser(req);
      if (!user) return res.redirect('/login');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
    return res.sendFile(candidate);
  }
  res.status(404).sendFile(path.join(PUBLIC_DIR, 'home.html'));
});

// Boot Database & Launch Server
async function startServer() {
  await db.initDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PetPals Care Portal running at http://localhost:${PORT}`);
    console.log(`Database engine: ${db.isPostgresConnected() ? 'PostgreSQL (Cloud / Remote)' : 'Local persistence (awaiting DATABASE_URL)'}`);
    if (process.env.npm_lifecycle_event === 'start') {
      const url = `http://localhost:${PORT}/`;
      const launchers = process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '', url]]
        : process.platform === 'darwin'
          ? ['open', [url]]
          : ['xdg-open', [url]];
      const browser = spawn(launchers[0], launchers[1], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });
      browser.on('error', err => console.warn('Could not open the default browser:', err.message));
      browser.unref();
    }
  });
}

startServer().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
