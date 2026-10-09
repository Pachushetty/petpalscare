// PetPals PostgreSQL Database & Repository Layer
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const USD_TO_INR_RATE = 97;
const INR_PRICE_INCREMENT = 50;

function convertLegacyPriceToINR(value) {
  const raw = String(value ?? '').trim();
  const amount = parseFloat(raw.replace(/[^0-9.]/g, '')) || 0;
  return raw.startsWith('$')
    ? Math.round(amount * USD_TO_INR_RATE / INR_PRICE_INCREMENT) * INR_PRICE_INCREMENT
    : amount;
}

function formatINR(value) {
  const amount = convertLegacyPriceToINR(value);
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

const connectionString = process.env.DATABASE_URL;
let pool = null;
let isPostgres = false;

function isBcryptHash(str) {
  return typeof str === 'string' && /^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/.test(str);
}

// Initialize PostgreSQL Pool if a DATABASE_URL is available
if (connectionString && !connectionString.includes('your_postgresql_connection_string')) {
  try {
    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1') || connectionString.includes('sslmode=disable');
    pool = new Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 30000,
      max: 10
    });
    pool.on('error', (err) => {
      console.warn('[PostgreSQL] Unexpected error on idle client:', err.message);
    });
  } catch (e) {
    console.warn('[PostgreSQL] Error initializing connection pool:', e);
  }
}

// Fallback JSON persistence for offline/local environments before DATABASE_URL is bound
const LOCAL_DB_DIR = path.resolve(__dirname, 'data');
const LOCAL_DB_FILE = path.resolve(LOCAL_DB_DIR, 'db-store.json');

function ensureLocalDir() {
  if (!fs.existsSync(LOCAL_DB_DIR)) {
    fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
  }
}

function loadLocalStore() {
  ensureLocalDir();
  if (fs.existsSync(LOCAL_DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(LOCAL_DB_FILE, 'utf8'));
    } catch (e) {
      console.warn('Failed to parse local store file, reinitializing', e);
    }
  }
  return null;
}

function saveLocalStore(data) {
  ensureLocalDir();
  try {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write local store file', e);
  }
}

// Default Seed Records
const DEFAULT_USER_ID = 'usr-prathiksha';
const DEFAULT_USER = {
  id: DEFAULT_USER_ID,
  name: 'Prathiksha Shetty',
  first_name: 'Prathiksha',
  email: 'prathiksha@gmail.com',
  password_hash: bcrypt.hashSync('prathiksha123', 10),
  phone: '+91 98765 43210',
  location: 'Mangalore, Karnataka',
  avatar: null,
  role: 'user',
  created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
  updated_at: new Date().toISOString()
};

const DEFAULT_ADMIN = {
  id: 'admin-1',
  name: 'PetPals Administrator',
  email: 'admin@petpals.com',
  password_hash: bcrypt.hashSync('admin123', 10),
  role: 'Super Admin',
  avatar: null,
  created_at: new Date('2026-01-01T00:00:00Z').toISOString()
};

const DEFAULT_SERVICES = [
  { id: 'srv-1', name: 'Grooming & Holistic Spa', category: 'grooming', price: '₹6,300', price_num: 6300, duration: '60-90 Mins', specialist: 'Sarah Jenkins', active: true, description: 'Hypoallergenic botanical baths, gentle de-shedding, nail filing, ear care, and blueberry facial treatments in a serene environment.', badge: 'Most Popular', rating: 4.9, reviews_count: 142 },
  { id: 'srv-2', name: 'Veterinary Care & Health Checkup', category: 'medical', price: '₹8,250', price_num: 8250, duration: '45 Mins', specialist: 'Dr. Emily Chen, DVM', active: true, description: 'Comprehensive annual physical exams, vaccinations, diagnostics, blood chemistry, and preventive advice from licensed practitioners.', badge: 'Recommended', rating: 5.0, reviews_count: 98 },
  { id: 'srv-3', name: 'Dog Walking & Outdoor Adventure', category: 'training', price: '₹2,900', price_num: 2900, duration: '30 / 60 Mins', specialist: 'Alex Rivera', active: true, description: 'Energizing 30 or 60-minute neighborhood walks or nature trail pack adventures with GPS tracking and live photo check-ins.', badge: 'Popular', rating: 4.9, reviews_count: 64 },
  { id: 'srv-4', name: 'Luxury Pet Boarding & Suites', category: 'boarding', price: '₹6,800', price_num: 6800, duration: 'Overnight', specialist: 'Care Sanctuary Team', active: true, description: 'Climate-controlled private suites, orthopedic bedding, web-cam access, tailored meal plans, and four daily play sessions.', badge: 'Premium', rating: 4.8, reviews_count: 76 },
  { id: 'srv-5', name: 'Feline Care & Dental Hygiene', category: 'medical', price: '₹6,800', price_num: 6800, duration: '50 Mins', specialist: 'Dr. Emily Chen, DVM', active: true, description: 'Specialized low-stress feline dental plaque scaling, ultrasonic polish, breath freshening, and oral cavity wellness evaluation.', badge: 'Specialized', rating: 4.7, reviews_count: 53 },
  { id: 'srv-6', name: 'Positive Puppy & Companion Training', category: 'training', price: '₹8,750', price_num: 8750, duration: '60 Mins', specialist: 'Marcus Vance', active: true, description: 'Science-backed positive reinforcement training for leash manners, recall, separation anxiety, and socialization skills.', badge: 'Certified', rating: 5.0, reviews_count: 39 },
  { id: 'srv-7', name: 'Signature Grooming & Wellness Spa', category: 'grooming', price: '₹6,300', price_num: 6300, duration: '75 Mins', specialist: 'Sarah Jenkins', active: true, description: 'Deep-coat herbal bubble bath, blueberry facial massage, custom breed scissor trim, gentle ear cleansing, and soothing organic paw balm nourishment.', badge: 'Bestseller', rating: 4.9, reviews_count: 156 }
];

const DEFAULT_REVIEWS = [
  { id: 'rev-1', user_id: null, user_name: 'Prathiksha Shetty', user_avatar: DEFAULT_USER.avatar, pet: 'Bruno (Golden Retriever)', rating: 5, service_name: 'Grooming & Holistic Spa', status: 'Approved', featured: true, comment: 'Sarah took incredible care of Bruno! He came home so clean, soft, and completely stress-free. The report card was wonderful.', created_at: new Date('2026-10-02T14:00:00Z').toISOString() },
  { id: 'rev-2', user_id: null, user_name: 'Sneha R.', user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', pet: 'Simba (Spitz)', rating: 5, service_name: 'Veterinary Care & Health Checkup', status: 'Approved', featured: false, comment: 'Dr. Emily Chen was so gentle and thorough. The online records access makes tracking vaccinations effortless.', created_at: new Date('2026-09-28T10:00:00Z').toISOString() },
  { id: 'rev-3', user_id: null, user_name: 'Arjun T.', user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', pet: 'Charlie (Beagle)', rating: 4, service_name: 'Dog Walking & Outdoor Adventure', status: 'Approved', featured: false, comment: 'Alex is great with high-energy dogs. Charlie had a blast and slept like a log afterwards!', created_at: new Date('2026-09-25T11:00:00Z').toISOString() },
  { id: 'rev-4', user_id: null, user_name: 'Prathiksha Shetty', user_avatar: DEFAULT_USER.avatar, pet: 'Milo (Cat)', rating: 5, service_name: 'Luxury Pet Boarding & Suites', status: 'Pending', featured: false, comment: 'Leaving Milo for 3 days was hard, but the daily video check-ins put our minds completely at ease.', created_at: new Date('2026-09-20T16:00:00Z').toISOString() }
];

const DEFAULT_MESSAGES = [
  { id: 'msg-1', user_id: DEFAULT_USER_ID, name: 'Prathiksha Shetty', email: 'prathiksha@gmail.com', phone: '+91 98765 43210', subject: 'Inquiry: Holiday Boarding Suite for Bruno', message: 'Hello PetPals team! We are planning a 4-day trip in November. Does the luxury suite include specialized dietary meal prep for Bruno (grain-free)?', status: 'Unread', reply: '', created_at: new Date('2026-10-05T09:15:00Z').toISOString() },
  { id: 'msg-2', user_id: null, name: 'Sneha Rao', email: 'sneha.rao@gmail.com', phone: '+91 98451 22334', subject: 'Booster Vaccination Schedule', message: 'Hi! Could Dr. Emily confirm if Milo needs his Rabies booster before next month or if the current certificate is still valid?', status: 'Replied', reply: 'Certificate is valid through Nov 2027! No action needed at this time.', replied_at: 'Yesterday, 5:00 PM', created_at: new Date('2026-10-04T16:20:00Z').toISOString() },
  { id: 'msg-3', user_id: null, name: 'Arjun Talwar', email: 'arjun.t@outlook.com', phone: '+91 99120 44556', subject: 'Weekend Walk Availability', message: 'Hi team, do you have an opening for an individual walk this Saturday morning at 9 AM for Charlie?', status: 'Replied', reply: 'Booked and confirmed for Saturday 9:00 AM with Alex.', replied_at: '04 Oct 2026', created_at: new Date('2026-10-04T08:30:00Z').toISOString() }
];

const DEFAULT_SETTINGS = {
  facilityName: 'PetPals Flagship Spa & Sanctuary',
  contactEmail: 'admin@petpalscare.com',
  emergencyPhone: '+91 (080) 4122-7890',
  operatingHours: 'Monday – Sunday: 8:00 AM – 8:00 PM',
  facilityAddress: '142 Pet Haven Blvd, Sanctuary Park, Bangalore',
  autoConfirmBookings: true,
  emailAlerts: true,
  smsAlerts: true,
  maintenanceMode: false,
  adminName: 'PetPals Administrator',
  adminEmail: 'admin@petpalscare.com'
};

// In-Memory store holding data
let localStore = loadLocalStore() || {
  users: [DEFAULT_USER],
  admin_users: [DEFAULT_ADMIN],
  pets: [],
  services: [...DEFAULT_SERVICES],
  bookings: [],
  reviews: [...DEFAULT_REVIEWS],
  messages: [...DEFAULT_MESSAGES],
  settings: { ...DEFAULT_SETTINGS }
};
localStore.specialists = Array.isArray(localStore.specialists) ? localStore.specialists : [];

// Clear profile image URLs that were shared demo placeholders from every account.
let cleanedGeneratedAvatars = false;
for (const user of localStore.users || []) {
  if (isGeneratedProfileAvatar(user)) {
    user.avatar = null;
    cleanedGeneratedAvatars = true;
  }
}
let cleanedLegacyPrices = false;
for (const service of localStore.services || []) {
  if (typeof service.price === 'string' && service.price.trim().startsWith('$')) {
    service.price_num = convertLegacyPriceToINR(service.price);
    service.price = formatINR(service.price);
    cleanedLegacyPrices = true;
  }
}
for (const booking of localStore.bookings || []) {
  if (typeof booking.service_price === 'string' && booking.service_price.trim().startsWith('$')) {
    booking.service_price = formatINR(booking.service_price);
    cleanedLegacyPrices = true;
  }
}

// Synchronize services catalog with DEFAULT_SERVICES to keep names matching services.html
let syncedServices = false;
if (Array.isArray(localStore.services)) {
  for (const def of DEFAULT_SERVICES) {
    const existing = localStore.services.find(s => s.id === def.id);
    if (existing) {
      if (existing.name !== def.name || existing.price_num !== def.price_num || existing.duration !== def.duration) {
        existing.name = def.name;
        existing.category = def.category;
        existing.price = def.price;
        existing.price_num = def.price_num;
        existing.duration = def.duration;
        existing.description = def.description;
        existing.badge = def.badge;
        syncedServices = true;
      }
    } else {
      localStore.services.push({ ...def });
      syncedServices = true;
    }
  }
}

if (cleanedGeneratedAvatars) saveLocalStore(localStore);
if (cleanedLegacyPrices || syncedServices) saveLocalStore(localStore);

// Initialize Database (Tables, Constraints, Seed Data)
async function initDatabase() {
  if (!pool) {
    console.log('[Database] DATABASE_URL not configured. Running in Local High-Performance Store mode.');
    saveLocalStore(localStore);
    return;
  }

  let client;
  try {
    client = await pool.connect();
    console.log('[PostgreSQL] Connected successfully to PostgreSQL database.');

    await client.query('BEGIN');

    // Existing accounts may contain the old shared generated profile image.
    await client.query(
      `UPDATE users SET avatar = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE avatar LIKE $1 OR avatar LIKE $2 OR avatar LIKE $3 OR avatar LIKE $4 OR avatar LIKE $5`,
      [
        '%AEtjO1W2uQrDJs4Vq5TYFXxKRstMqlWw%',
        '%photo-1535713875002-d1d0cf377fde%',
        '%photo-1544005313-94ddf0286df2%',
        '%photo-1507003211169-0a1dd7228f2d%',
        '%photo-1534528741775-53994a69daeb%'
      ]
    );

    // Convert existing dollar-denominated services and bookings once, keeping
    // the conversion idempotent for subsequent application starts.
    await client.query(
      `UPDATE services
       SET price_num = ROUND((price_num * $1) / $2) * $2,
           price = '₹' || (ROUND((price_num * $1) / $2) * $2)::BIGINT::TEXT,
           updated_at = CURRENT_TIMESTAMP
       WHERE price LIKE '$%'`,
      [USD_TO_INR_RATE, INR_PRICE_INCREMENT]
    );
    await client.query(
      `UPDATE bookings
       SET service_price = '₹' || (ROUND((REGEXP_REPLACE(service_price, '[^0-9.]', '', 'g')::NUMERIC * $1) / $2) * $2)::BIGINT::TEXT,
           updated_at = CURRENT_TIMESTAMP
       WHERE service_price LIKE '$%'`,
      [USD_TO_INR_RATE, INR_PRICE_INCREMENT]
    );

    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        location VARCHAR(255),
        avatar TEXT,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Admin Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'Super Admin',
        avatar TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Pets Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pets (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        species VARCHAR(50) NOT NULL,
        breed VARCHAR(255),
        age VARCHAR(50),
        weight VARCHAR(50),
        gender VARCHAR(50),
        microchip VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Active',
        note TEXT,
        notes TEXT,
        photo TEXT,
        avatar TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Services Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price VARCHAR(50) NOT NULL,
        price_num NUMERIC(10, 2) DEFAULT 0,
        duration VARCHAR(50) NOT NULL,
        specialist VARCHAR(255) DEFAULT 'Dr. Aris Thorne',
        description TEXT,
        badge VARCHAR(100),
        rating NUMERIC(3, 2) DEFAULT 4.9,
        reviews_count INTEGER DEFAULT 120,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Specialists managed by Admin and shown to users when active.
    await client.query(`
      CREATE TABLE IF NOT EXISTS specialists (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        specialization VARCHAR(255) NOT NULL,
        rating NUMERIC(2, 1) NOT NULL DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
        sessions INTEGER NOT NULL DEFAULT 0 CHECK (sessions >= 0),
        availability TEXT NOT NULL DEFAULT 'Availability to be confirmed',
        photo TEXT,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Bookings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        pet_id VARCHAR(64) REFERENCES pets(id) ON DELETE SET NULL,
        service_id VARCHAR(64) REFERENCES services(id) ON DELETE SET NULL,
        service_name VARCHAR(255) NOT NULL,
        service_category VARCHAR(100),
        service_price VARCHAR(50),
        total_amount NUMERIC(12, 2),
        duration VARCHAR(50),
        pet_name VARCHAR(255),
        booking_date VARCHAR(100) NOT NULL,
        booking_time VARCHAR(100) NOT NULL,
        provider VARCHAR(255) DEFAULT 'Dr. Aris Thorne',
        specialist_id VARCHAR(64),
        specialist_role VARCHAR(255),
        specialist_photo TEXT,
        specialist_rating NUMERIC(2, 1),
        specialist_sessions INTEGER,
        specialist_availability TEXT,
        status VARCHAR(50) DEFAULT 'Confirmed',
        notes TEXT,
        address TEXT,
        location_type VARCHAR(32),
        selected_addons JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12, 2),
        ADD COLUMN IF NOT EXISTS specialist_id VARCHAR(64),
        ADD COLUMN IF NOT EXISTS specialist_role VARCHAR(255),
        ADD COLUMN IF NOT EXISTS specialist_photo TEXT,
        ADD COLUMN IF NOT EXISTS specialist_rating NUMERIC(2, 1),
        ADD COLUMN IF NOT EXISTS specialist_sessions INTEGER,
        ADD COLUMN IF NOT EXISTS specialist_availability TEXT,
        ADD COLUMN IF NOT EXISTS location_type VARCHAR(32),
        ADD COLUMN IF NOT EXISTS selected_addons JSONB NOT NULL DEFAULT '[]'::jsonb
    `);

    // Remove only the original demo booking seed records; preserve user-created bookings.
    await client.query(`DELETE FROM bookings WHERE id IN ('PP-84920','PP-84921','PP-83110','PP-81204')`);

    // 6. Reviews Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        user_name VARCHAR(255) NOT NULL,
        user_avatar TEXT,
        pet VARCHAR(255),
        pet_id VARCHAR(64) REFERENCES pets(id) ON DELETE SET NULL,
        service_id VARCHAR(64),
        booking_id VARCHAR(64) REFERENCES bookings(id) ON DELETE SET NULL,
        service_name VARCHAR(255),
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Approved',
        featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Messages Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Unread',
        reply TEXT,
        replied_at VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Admin Settings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id VARCHAR(64) PRIMARY KEY,
        settings_json JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 9. User Sessions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        token VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMPTZ NOT NULL
      );
    `);
    await client.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS pet_id VARCHAR(64) REFERENCES pets(id) ON DELETE SET NULL, ADD COLUMN IF NOT EXISTS booking_id VARCHAR(64) REFERENCES bookings(id) ON DELETE SET NULL`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS reviews_booking_once_idx ON reviews (user_id, booking_id) WHERE booking_id IS NOT NULL`);
    // These legacy example reviews were never submitted through user accounts.
    await client.query(`UPDATE reviews SET user_id = NULL WHERE id IN ('rev-1','rev-4')`);

    // Admin credentials and sessions are isolated from user auth state.
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        token VARCHAR(128) PRIMARY KEY,
        admin_id VARCHAR(64) REFERENCES admin_users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMPTZ NOT NULL
      );
    `);

    // Seed default User if empty
    const usersCheck = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(usersCheck.rows[0].count, 10) === 0) {
      await client.query(
        `INSERT INTO users (id, name, first_name, email, password_hash, phone, location, avatar, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [DEFAULT_USER.id, DEFAULT_USER.name, DEFAULT_USER.first_name, DEFAULT_USER.email, DEFAULT_USER.password_hash, DEFAULT_USER.phone, DEFAULT_USER.location, DEFAULT_USER.avatar, DEFAULT_USER.role]
      );
    }

    // Seed default Admin if empty
    const adminCheck = await client.query('SELECT COUNT(*) FROM admin_users');
    if (parseInt(adminCheck.rows[0].count, 10) === 0) {
      await client.query(
        `INSERT INTO admin_users (id, name, email, password_hash, role, avatar)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [DEFAULT_ADMIN.id, DEFAULT_ADMIN.name, DEFAULT_ADMIN.email, DEFAULT_ADMIN.password_hash, DEFAULT_ADMIN.role, DEFAULT_ADMIN.avatar]
      );
    }

    // Seed or synchronize default Services with DEFAULT_SERVICES to maintain consistent names with services.html
    for (const s of DEFAULT_SERVICES) {
      await client.query(
        `INSERT INTO services (id, name, category, price, price_num, duration, specialist, description, badge, rating, reviews_count, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           category = EXCLUDED.category,
           price = EXCLUDED.price,
           price_num = EXCLUDED.price_num,
           duration = EXCLUDED.duration,
           specialist = EXCLUDED.specialist,
           description = EXCLUDED.description,
           badge = EXCLUDED.badge`,
        [s.id, s.name, s.category, s.price, s.price_num, s.duration, s.specialist, s.description, s.badge, s.rating, s.reviews_count, s.active]
      );
    }

    // Update reviews and bookings service names if legacy names present
    await client.query(`UPDATE reviews SET service_name = 'Grooming & Holistic Spa' WHERE service_name = 'Grooming & Spa Experience'`);
    await client.query(`UPDATE reviews SET service_name = 'Veterinary Care & Health Checkup' WHERE service_name = 'Veterinary Comprehensive Exam'`);
    await client.query(`UPDATE reviews SET service_name = 'Dog Walking & Outdoor Adventure' WHERE service_name = 'Canine Adventure Walking'`);
    await client.query(`UPDATE reviews SET service_name = 'Luxury Pet Boarding & Suites' WHERE service_name = 'Luxury Sanctuary Boarding'`);

    await client.query(`UPDATE bookings SET service_name = 'Grooming & Holistic Spa' WHERE service_name = 'Grooming & Spa Experience'`);
    await client.query(`UPDATE bookings SET service_name = 'Veterinary Care & Health Checkup' WHERE service_name = 'Veterinary Comprehensive Exam'`);
    await client.query(`UPDATE bookings SET service_name = 'Dog Walking & Outdoor Adventure' WHERE service_name = 'Canine Adventure Walking'`);
    await client.query(`UPDATE bookings SET service_name = 'Luxury Pet Boarding & Suites' WHERE service_name = 'Luxury Sanctuary Boarding'`);

    // Seed default Reviews if empty
    const revCheck = await client.query('SELECT COUNT(*) FROM reviews');
    if (parseInt(revCheck.rows[0].count, 10) === 0) {
      for (const r of DEFAULT_REVIEWS) {
        await client.query(
          `INSERT INTO reviews (id, user_id, user_name, user_avatar, pet, service_name, rating, comment, status, featured)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [r.id, r.user_id, r.user_name, r.user_avatar, r.pet, r.service_name, r.rating, r.comment, r.status, r.featured]
        );
      }
    }

    // Seed default Messages if empty
    const msgCheck = await client.query('SELECT COUNT(*) FROM messages');
    if (parseInt(msgCheck.rows[0].count, 10) === 0) {
      for (const m of DEFAULT_MESSAGES) {
        await client.query(
          `INSERT INTO messages (id, user_id, name, email, phone, subject, message, status, reply, replied_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [m.id, m.user_id, m.name, m.email, m.phone, m.subject, m.message, m.status, m.reply, m.replied_at || '']
        );
      }
    }

    // Seed default Admin Settings if empty
    const setsCheck = await client.query('SELECT COUNT(*) FROM admin_settings WHERE id = $1', ['default']);
    if (parseInt(setsCheck.rows[0].count, 10) === 0) {
      await client.query(
        `INSERT INTO admin_settings (id, settings_json) VALUES ($1, $2)`,
        ['default', JSON.stringify(DEFAULT_SETTINGS)]
      );
    }

    await client.query('COMMIT');
    client.release();
    client = null;
    isPostgres = true;
    console.log('[PostgreSQL] Database schemas verified and ready.');
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.warn('[PostgreSQL] Schema rollback failed:', rollbackError.message);
      }
      client.release(true);
    }
    isPostgres = false;
    console.error('[PostgreSQL] Failed to initialize database schemas:', err.message);
    throw err;
  }
}

// -------------------------------------------------------------
// REPOSITORY LAYER (Parameterized Queries & Safe Fallbacks)
// -------------------------------------------------------------

// --- USER OPERATIONS ---
async function findUserByEmail(email) {
  if (!email) return null;
  const normalized = email.toLowerCase().trim();
  if (isPostgres && pool) {
    try {
      const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [normalized]);
      if (res.rows[0]) return res.rows[0];
    } catch (err) {
      console.warn('[PostgreSQL] findUserByEmail error, falling back to local store:', err.message);
    }
  }
  return (localStore.users || []).find(u => (u.email || '').toLowerCase().trim() === normalized) || null;
}

async function findUserById(id) {
  if (!id) return null;
  if (isPostgres && pool) {
    try {
      const res = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
      if (res.rows[0]) return res.rows[0];
    } catch (err) {
      console.warn('[PostgreSQL] findUserById error, falling back to local store:', err.message);
    }
  }
  return (localStore.users || []).find(u => u.id === id) || null;
}

function optionalProfileValue(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function isGeneratedProfileAvatar(user) {
  const avatar = typeof user?.avatar === 'string' ? user.avatar : '';
  return [
    'photo-1535713875002-d1d0cf377fde',
    'photo-1544005313-94ddf0286df2',
    'photo-1507003211169-0a1dd7228f2d',
    'photo-1534528741775-53994a69daeb',
    'aida/AEtjO1W2uQrDJs4Vq5TYFXxKRstMqlWw'
  ].some(marker => avatar.includes(marker));
}

async function createUser(data) {
  const id = data.id || 'usr-' + Date.now();
  const firstName = data.firstName || (data.name ? data.name.split(' ')[0] : 'Member');
  const passwordHash = data.password
    ? (isBcryptHash(data.password) ? data.password : bcrypt.hashSync(String(data.password), 10))
    : (data.password_hash || bcrypt.hashSync('petpals123', 10));

  const user = {
    id,
    name: (data.name || '').trim() || 'Pet Parent',
    first_name: firstName,
    email: data.email.toLowerCase().trim(),
    password_hash: passwordHash,
    phone: optionalProfileValue(data.phone),
    location: optionalProfileValue(data.location),
    avatar: optionalProfileValue(data.avatar),
    role: data.role || 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isPostgres && pool) {
    try {
      const res = await pool.query(
        `INSERT INTO users (id, name, first_name, email, password_hash, phone, location, avatar, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (email) DO NOTHING
         RETURNING *`,
        [user.id, user.name, user.first_name, user.email, user.password_hash, user.phone, user.location, user.avatar, user.role]
      );
      if (!res.rows[0]) {
        const duplicateError = new Error('An account with this email already exists.');
        duplicateError.code = '23505';
        throw duplicateError;
      }
      // Synchronize in localStore as well so both layers are always in sync
      const idx = (localStore.users || []).findIndex(u => (u.email || '').toLowerCase().trim() === user.email);
      if (idx !== -1) localStore.users[idx] = res.rows[0];
      else (localStore.users = localStore.users || []).push(res.rows[0]);
      saveLocalStore(localStore);
      return res.rows[0];
    } catch (err) {
      if (err.code === '23505') throw err;
      console.error('[PostgreSQL] createUser insert failed:', err.message);
      throw err;
    }
  }

  const idx = (localStore.users || []).findIndex(u => (u.email || '').toLowerCase().trim() === user.email);
  if (idx !== -1) localStore.users[idx] = user;
  else (localStore.users = localStore.users || []).push(user);
  saveLocalStore(localStore);
  return user;
}

async function updateUser(id, data) {
  const existing = await findUserById(id);
  if (!existing) return null;

  const name = data.name !== undefined ? optionalProfileValue(data.name) : existing.name;
  if (!name) throw new Error('Full name is required.');
  const firstName = data.firstName !== undefined
    ? optionalProfileValue(data.firstName)
    : (data.name !== undefined ? name.split(' ')[0] : existing.first_name);
  const email = data.email !== undefined ? String(data.email).trim().toLowerCase() : existing.email;
  const phone = data.phone !== undefined ? optionalProfileValue(data.phone) : optionalProfileValue(existing.phone);
  const location = data.location !== undefined
    ? optionalProfileValue(data.location)
    : (data.address !== undefined ? optionalProfileValue(data.address) : optionalProfileValue(existing.location));
  const avatar = data.avatar !== undefined
    ? optionalProfileValue(data.avatar)
    : (isGeneratedProfileAvatar(existing) ? null : optionalProfileValue(existing.avatar));
  const passwordHash = data.password
    ? (isBcryptHash(data.password) ? data.password : bcrypt.hashSync(String(data.password), 10))
    : (data.password_hash || existing.password_hash);

  if (isPostgres && pool) {
    try {
      const res = await pool.query(
        `UPDATE users
         SET name = $1, first_name = $2, email = $3, phone = $4, location = $5, avatar = $6, password_hash = $7, updated_at = CURRENT_TIMESTAMP
         WHERE id = $8
         RETURNING *`,
        [name, firstName, email, phone, location, avatar, passwordHash, id]
      );
      if (res.rows[0]) {
        const idx = (localStore.users || []).findIndex(u => u.id === id);
        if (idx !== -1) localStore.users[idx] = res.rows[0];
        saveLocalStore(localStore);
        return res.rows[0];
      }
      return null;
    } catch (err) {
      console.error('[PostgreSQL] updateUser failed:', err.message);
      throw err;
    }
  }

  const idx = (localStore.users || []).findIndex(u => u.id === id);
  if (idx !== -1) {
    localStore.users[idx] = {
      ...localStore.users[idx],
      name,
      first_name: firstName,
      email,
      phone,
      location,
      avatar,
      password_hash: passwordHash,
      updated_at: new Date().toISOString()
    };
    saveLocalStore(localStore);
    return localStore.users[idx];
  }
  return null;
}

async function getAllUsers() {
  if (isPostgres && pool) {
    const usersRes = await pool.query(`
      SELECT u.id, u.name, u.first_name, u.email, u.phone, u.location, u.avatar, u.role, u.created_at,
             COUNT(DISTINCT p.id) as pets_count,
             COUNT(DISTINCT b.id) as bookings_count,
             COALESCE(STRING_AGG(DISTINCT p.name, ', '), '') as pets_list,
             (SELECT COALESCE(SUM(CAST(REGEXP_REPLACE(service_price, '[^0-9.]', '', 'g') AS NUMERIC)), 0)
              FROM bookings user_bookings WHERE user_bookings.user_id = u.id AND user_bookings.status != 'Cancelled') as total_spent
      FROM users u
      LEFT JOIN pets p ON p.user_id = u.id
      LEFT JOIN bookings b ON b.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    return usersRes.rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      location: r.location,
      avatar: isGeneratedProfileAvatar(r) ? null : r.avatar,
      petsCount: parseInt(r.pets_count, 10) || 0,
      bookingsCount: parseInt(r.bookings_count, 10) || 0,
      petsList: r.pets_list || 'None',
      joinedDate: new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Active',
      totalSpent: formatINR(parseFloat(r.total_spent) || 0)
    }));
  }

  return localStore.users.map(u => {
    const userPets = localStore.pets.filter(p => p.user_id === u.id);
    const userBookings = localStore.bookings.filter(b => b.user_id === u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      location: u.location,
      avatar: isGeneratedProfileAvatar(u) ? null : u.avatar,
      petsCount: userPets.length,
      bookingsCount: userBookings.length,
      petsList: userPets.map(p => p.name).join(', ') || 'None',
      joinedDate: new Date(u.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Active',
      totalSpent: formatINR(userBookings.filter(b => b.status !== 'Cancelled').reduce((sum, b) => sum + convertLegacyPriceToINR(b.service_price || 0), 0))
    };
  });
}

// --- SESSION MANAGEMENT ---
async function createSession(userId, durationDays = 7) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  if (isPostgres && pool) {
    try {
      await pool.query(
        `INSERT INTO user_sessions (token, user_id, expires_at)
         VALUES ($1, $2, $3)`,
        [token, userId, expiresAt.toISOString()]
      );
    } catch (err) {
      console.warn('[PostgreSQL] createSession failed, falling back to local store:', err.message);
    }
  }

  localStore.sessions = localStore.sessions || [];
  localStore.sessions = localStore.sessions.filter(s => new Date(s.expires_at) > new Date());
  localStore.sessions.push({
    token,
    user_id: userId,
    created_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString()
  });
  saveLocalStore(localStore);
  return { token, userId, expiresAt };
}

async function getSession(token) {
  if (!token || typeof token !== 'string') return null;
  const cleanToken = token.trim();
  if (!cleanToken) return null;

  if (isPostgres && pool) {
    try {
      const res = await pool.query(
        `SELECT s.token, s.user_id, s.expires_at,
                u.id as uid, u.name, u.first_name, u.email, u.phone, u.location, u.avatar, u.role, u.created_at as user_created_at
         FROM user_sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token = $1 AND s.expires_at > CURRENT_TIMESTAMP
         LIMIT 1`,
        [cleanToken]
      );
      if (res.rows[0]) {
        const row = res.rows[0];
        return {
          session: {
            token: row.token,
            userId: row.user_id,
            expiresAt: row.expires_at
          },
          user: {
            id: row.uid,
            name: row.name,
            firstName: row.first_name || (row.name ? row.name.split(' ')[0] : 'Member'),
            first_name: row.first_name,
            email: row.email,
            phone: row.phone,
            location: row.location,
            avatar: row.avatar,
            role: row.role,
            createdAt: row.user_created_at
          }
        };
      }
    } catch (err) {
      console.warn('[PostgreSQL] getSession error, checking local store:', err.message);
    }
  }

  localStore.sessions = localStore.sessions || [];
  const found = localStore.sessions.find(s => s.token === cleanToken && new Date(s.expires_at) > new Date());
  if (!found) return null;
  const user = (localStore.users || []).find(u => u.id === found.user_id);
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return {
    session: {
      token: found.token,
      userId: found.user_id,
      expiresAt: found.expires_at
    },
    user: {
      ...safeUser,
      firstName: safeUser.firstName || safeUser.first_name || (safeUser.name ? safeUser.name.split(' ')[0] : 'Member')
    }
  };
}

async function deleteSession(token) {
  if (!token) return false;
  const cleanToken = typeof token === 'string' ? token.trim() : '';
  if (!cleanToken) return false;

  if (isPostgres && pool) {
    await pool.query('DELETE FROM user_sessions WHERE token = $1', [cleanToken]);
    return true;
  }
  localStore.sessions = (localStore.sessions || []).filter(s => s.token !== cleanToken);
  saveLocalStore(localStore);
  return true;
}

async function deleteUserSessions(userId) {
  if (!userId) return false;
  if (isPostgres && pool) {
    await pool.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
    return true;
  }
  localStore.sessions = (localStore.sessions || []).filter(s => s.user_id !== userId);
  saveLocalStore(localStore);
  return true;
}

// --- ADMIN AUTH ---
async function findAdminByEmail(email) {
  if (!email) return null;
  const normalized = email.toLowerCase().trim();
  if (isPostgres && pool) {
    const res = await pool.query('SELECT * FROM admin_users WHERE LOWER(email) = $1 LIMIT 1', [normalized]);
    return res.rows[0] || null;
  }
  return localStore.admin_users.find(a => a.email.toLowerCase() === normalized) || null;
}

// --- PET OPERATIONS ---
async function getPetsByUserId(userId) {
  if (!userId) return [];
  if (isPostgres && pool) {
    const res = await pool.query('SELECT * FROM pets WHERE user_id = $1 ORDER BY created_at ASC', [userId]);
    return res.rows.map(mapPetRow);
  }
  return (localStore.pets || []).filter(p => p.user_id === userId).map(mapPetRow);
}

async function getAllPets() {
  if (isPostgres && pool) {
    const res = await pool.query(`
      SELECT p.*, u.name as owner_name, u.phone as owner_phone, u.email as owner_email
      FROM pets p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);
    return res.rows.map(r => ({
      ...mapPetRow(r),
      owner: r.owner_name || 'Pet Parent',
      ownerPhone: r.owner_phone || '',
      ownerEmail: r.owner_email || ''
    }));
  }

  return (localStore.pets || []).map(p => {
    const owner = (localStore.users || []).find(u => u.id === p.user_id);
    return {
      ...mapPetRow(p),
      owner: owner ? owner.name : 'Pet Parent',
      ownerPhone: owner ? owner.phone : '',
      ownerEmail: owner ? owner.email : ''
    };
  });
}

function mapPetRow(p) {
  return {
    id: p.id,
    userId: p.user_id,
    user_id: p.user_id,
    name: p.name,
    species: p.species,
    breed: p.breed,
    age: p.age,
    weight: p.weight,
    gender: p.gender,
    microchip: p.microchip,
    status: p.status || 'Active',
    note: p.note,
    notes: p.notes || p.note,
    photo: p.photo || p.avatar,
    avatar: p.avatar || p.photo,
    createdAt: p.created_at
  };
}

async function createPet(data, userId) {
  const id = data.id || 'pet-' + Date.now();
  const normalizedSpecies = data.species ? (data.species.charAt(0).toUpperCase() + data.species.slice(1).toLowerCase()) : 'Dog';
  const defaultPhoto = normalizedSpecies === 'Cat'
    ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80'
    : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80';
  const photo = data.photo || data.avatar || defaultPhoto;
  const note = data.notes || data.note || 'Healthy and active companion.';
  const microchip = data.microchip || `${Math.floor(100 + Math.random()*899)} ${Math.floor(100 + Math.random()*899)} 002 ${Math.floor(100 + Math.random()*899)}`;
  const finalUserId = userId || data.user_id;

  if (!finalUserId) {
    throw new Error('User ID is required to link pet to an account');
  }

  if (isPostgres && pool) {
    const res = await pool.query(
      `INSERT INTO pets (id, user_id, name, species, breed, age, weight, gender, microchip, status, note, notes, photo, avatar)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [id, finalUserId, data.name, normalizedSpecies, data.breed || 'Companion', data.age || '1 year', data.weight || '5.0 kg', data.gender || 'Unknown', microchip, data.status || 'Active', note, note, photo, photo]
    );
    return mapPetRow(res.rows[0]);
  }

  const newPet = {
    id,
    user_id: finalUserId,
    name: data.name,
    species: normalizedSpecies,
    breed: data.breed || 'Companion',
    age: data.age || '1 year',
    weight: data.weight || '5.0 kg',
    gender: data.gender || 'Unknown',
    microchip,
    status: data.status || 'Active',
    note,
    notes: note,
    photo,
    avatar: photo,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  localStore.pets = localStore.pets || [];
  localStore.pets.push(newPet);
  saveLocalStore(localStore);
  return mapPetRow(newPet);
}

async function updatePet(id, data, userId) {
  if (isPostgres && pool) {
    // Check ownership if userId passed
    let checkSql = 'SELECT * FROM pets WHERE id = $1';
    const params = [id];
    if (userId) {
      checkSql += ' AND user_id = $2';
      params.push(userId);
    }
    const checkRes = await pool.query(checkSql, params);
    if (!checkRes.rows[0]) return null;
    const existing = checkRes.rows[0];

    const name = data.name !== undefined ? data.name : existing.name;
    const species = data.species !== undefined ? data.species : existing.species;
    const breed = data.breed !== undefined ? data.breed : existing.breed;
    const age = data.age !== undefined ? data.age : existing.age;
    const weight = data.weight !== undefined ? data.weight : existing.weight;
    const gender = data.gender !== undefined ? data.gender : existing.gender;
    const microchip = data.microchip !== undefined ? data.microchip : existing.microchip;
    const status = data.status !== undefined ? data.status : existing.status;
    const notes = data.notes !== undefined ? data.notes : (data.note !== undefined ? data.note : existing.notes);
    const photo = data.photo !== undefined ? data.photo : (data.avatar !== undefined ? data.avatar : existing.photo);

    const res = await pool.query(
      `UPDATE pets
       SET name = $1, species = $2, breed = $3, age = $4, weight = $5, gender = $6, microchip = $7, status = $8, notes = $9, note = $9, photo = $10, avatar = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [name, species, breed, age, weight, gender, microchip, status, notes, photo, id]
    );
    return mapPetRow(res.rows[0]);
  }

  const idx = localStore.pets.findIndex(p => p.id === id && (!userId || p.user_id === userId));
  if (idx !== -1) {
    const p = localStore.pets[idx];
    localStore.pets[idx] = {
      ...p,
      name: data.name !== undefined ? data.name : p.name,
      species: data.species !== undefined ? data.species : p.species,
      breed: data.breed !== undefined ? data.breed : p.breed,
      age: data.age !== undefined ? data.age : p.age,
      weight: data.weight !== undefined ? data.weight : p.weight,
      gender: data.gender !== undefined ? data.gender : p.gender,
      microchip: data.microchip !== undefined ? data.microchip : p.microchip,
      status: data.status !== undefined ? data.status : p.status,
      notes: data.notes !== undefined ? data.notes : (data.note !== undefined ? data.note : p.notes),
      note: data.notes !== undefined ? data.notes : (data.note !== undefined ? data.note : p.note),
      photo: data.photo !== undefined ? data.photo : (data.avatar !== undefined ? data.avatar : p.photo),
      avatar: data.avatar !== undefined ? data.avatar : (data.photo !== undefined ? data.photo : p.avatar),
      updated_at: new Date().toISOString()
    };
    saveLocalStore(localStore);
    return mapPetRow(localStore.pets[idx]);
  }
  return null;
}

async function deletePet(id, userId) {
  if (isPostgres && pool) {
    let sql = 'DELETE FROM pets WHERE id = $1';
    const params = [id];
    if (userId) {
      sql += ' AND user_id = $2';
      params.push(userId);
    }
    const result = await pool.query(`${sql} RETURNING id`, params);
    return result.rowCount > 0;
  }

  const initialCount = localStore.pets.length;
  localStore.pets = localStore.pets.filter(p => !(p.id === id && (!userId || p.user_id === userId)));
  if (localStore.pets.length === initialCount) return false;
  saveLocalStore(localStore);
  return true;
}

// --- SERVICES OPERATIONS ---
async function getAllServices(onlyActive = false) {
  if (isPostgres && pool) {
    let sql = 'SELECT * FROM services';
    if (onlyActive) sql += ' WHERE active = true';
    sql += ' ORDER BY price_num ASC, created_at ASC';
    const res = await pool.query(sql);
    return res.rows.map(mapServiceRow);
  }

  let list = localStore.services;
  if (onlyActive) list = list.filter(s => s.active !== false);
  return list.map(mapServiceRow);
}

function mapServiceRow(s) {
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    price: formatINR(s.price_num || s.price || 4350),
    priceNum: convertLegacyPriceToINR(s.price_num || s.price || 4350),
    duration: s.duration,
    specialist: s.specialist || 'Sarah Jenkins',
    description: s.description,
    badge: s.badge || '',
    rating: parseFloat(s.rating) || 4.9,
    reviewsCount: parseInt(s.reviews_count, 10) || 120,
    active: s.active !== false
  };
}

async function createService(data) {
  const id = data.id || 'srv-' + Date.now();
  const priceNum = convertLegacyPriceToINR(data.price || 4350);
  const priceStr = formatINR(priceNum);

  if (isPostgres && pool) {
    const res = await pool.query(
      `INSERT INTO services (id, name, category, price, price_num, duration, specialist, description, badge, rating, reviews_count, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [id, data.name, data.category || 'grooming', priceStr, priceNum, data.duration || '60 min', data.specialist || 'Pet Care Specialist', data.description || 'Professional pet service.', data.badge || '', 5.0, 0, data.active !== false]
    );
    return mapServiceRow(res.rows[0]);
  }

  const s = {
    id,
    name: data.name,
    category: data.category || 'grooming',
    price: priceStr,
    price_num: priceNum,
    duration: data.duration || '60 min',
    specialist: data.specialist || 'Pet Care Specialist',
    description: data.description || 'Professional pet service.',
    badge: data.badge || '',
    rating: 5.0,
    reviews_count: 0,
    active: data.active !== false
  };
  localStore.services.push(s);
  saveLocalStore(localStore);
  return mapServiceRow(s);
}

async function updateService(id, data) {
  if (isPostgres && pool) {
    const existingRes = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
    if (!existingRes.rows[0]) return null;
    const existing = existingRes.rows[0];

    const name = data.name !== undefined ? data.name : existing.name;
    const category = data.category !== undefined ? data.category : existing.category;
    const priceNum = data.price !== undefined ? (convertLegacyPriceToINR(data.price) || existing.price_num) : existing.price_num;
    const priceStr = formatINR(priceNum);
    const duration = data.duration !== undefined ? data.duration : existing.duration;
    const specialist = data.specialist !== undefined ? data.specialist : existing.specialist;
    const description = data.description !== undefined ? data.description : existing.description;
    const active = data.active !== undefined ? Boolean(data.active) : existing.active;

    const res = await pool.query(
      `UPDATE services
       SET name = $1, category = $2, price = $3, price_num = $4, duration = $5, specialist = $6, description = $7, active = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [name, category, priceStr, priceNum, duration, specialist, description, active, id]
    );
    return mapServiceRow(res.rows[0]);
  }

  const idx = localStore.services.findIndex(s => s.id === id);
  if (idx !== -1) {
    const s = localStore.services[idx];
    const priceNum = data.price !== undefined ? (convertLegacyPriceToINR(data.price) || s.price_num) : s.price_num;
    localStore.services[idx] = {
      ...s,
      name: data.name !== undefined ? data.name : s.name,
      category: data.category !== undefined ? data.category : s.category,
      price: formatINR(priceNum),
      price_num: priceNum,
      duration: data.duration !== undefined ? data.duration : s.duration,
      specialist: data.specialist !== undefined ? data.specialist : s.specialist,
      description: data.description !== undefined ? data.description : s.description,
      active: data.active !== undefined ? Boolean(data.active) : s.active
    };
    saveLocalStore(localStore);
    return mapServiceRow(localStore.services[idx]);
  }
  return null;
}

async function deleteService(id) {
  if (isPostgres && pool) {
    await pool.query('DELETE FROM services WHERE id = $1', [id]);
    return true;
  }
  localStore.services = localStore.services.filter(s => s.id !== id);
  saveLocalStore(localStore);
  return true;
}

async function createAdminSession(adminId, durationDays = 7) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  if (isPostgres && pool) {
    await pool.query(
      `INSERT INTO admin_sessions (token, admin_id, expires_at) VALUES ($1, $2, $3)`,
      [token, adminId, expiresAt.toISOString()]
    );
    return { token, adminId, expiresAt };
  }
  localStore.admin_sessions = (localStore.admin_sessions || []).filter(s => new Date(s.expires_at) > new Date());
  localStore.admin_sessions.push({ token, admin_id: adminId, created_at: new Date().toISOString(), expires_at: expiresAt.toISOString() });
  saveLocalStore(localStore);
  return { token, adminId, expiresAt };
}

async function getAdminSession(token) {
  const cleanToken = typeof token === 'string' ? token.trim() : '';
  if (!cleanToken) return null;
  if (isPostgres && pool) {
    const res = await pool.query(
      `SELECT a.id, a.name, a.email, a.role, a.avatar, s.expires_at
       FROM admin_sessions s JOIN admin_users a ON a.id = s.admin_id
       WHERE s.token = $1 AND s.expires_at > CURRENT_TIMESTAMP LIMIT 1`, [cleanToken]
    );
    return res.rows[0] || null;
  }
  const session = (localStore.admin_sessions || []).find(s => s.token === cleanToken && new Date(s.expires_at) > new Date());
  if (!session) return null;
  const admin = (localStore.admin_users || []).find(a => a.id === session.admin_id);
  if (!admin) return null;
  const { password_hash, ...safeAdmin } = admin;
  return { ...safeAdmin, expires_at: session.expires_at };
}

async function deleteAdminSession(token) {
  const cleanToken = typeof token === 'string' ? token.trim() : '';
  if (!cleanToken) return false;
  if (isPostgres && pool) {
    await pool.query('DELETE FROM admin_sessions WHERE token = $1', [cleanToken]);
    return true;
  }
  localStore.admin_sessions = (localStore.admin_sessions || []).filter(s => s.token !== cleanToken);
  saveLocalStore(localStore);
  return true;
}

function mapSpecialistRow(s) {
  return {
    id: s.id,
    name: s.name,
    specialization: s.specialization,
    rating: Number(s.rating) || 0,
    sessions: parseInt(s.sessions, 10) || 0,
    availability: s.availability || 'Availability to be confirmed',
    photo: s.photo || null,
    active: s.active !== false,
    createdAt: s.created_at,
    updatedAt: s.updated_at
  };
}

async function getSpecialists(onlyActive = true) {
  if (isPostgres && pool) {
    const res = await pool.query(
      `SELECT * FROM specialists ${onlyActive ? 'WHERE active = TRUE' : ''} ORDER BY name ASC`
    );
    return res.rows.map(mapSpecialistRow);
  }
  return (localStore.specialists || [])
    .filter(s => !onlyActive || s.active !== false)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(mapSpecialistRow);
}

async function getSpecialistById(id) {
  if (!id) return null;
  if (isPostgres && pool) {
    const res = await pool.query('SELECT * FROM specialists WHERE id = $1 LIMIT 1', [id]);
    return res.rows[0] ? mapSpecialistRow(res.rows[0]) : null;
  }
  const row = (localStore.specialists || []).find(s => s.id === id);
  return row ? mapSpecialistRow(row) : null;
}

async function createSpecialist(data) {
  const record = {
    id: data.id || `spc-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    name: String(data.name || '').trim(),
    specialization: String(data.specialization || '').trim(),
    rating: Number(data.rating ?? 5),
    sessions: parseInt(data.sessions ?? 0, 10),
    availability: String(data.availability || '').trim(),
    photo: data.photo || null,
    active: data.active !== false
  };
  if (isPostgres && pool) {
    const res = await pool.query(
      `INSERT INTO specialists (id, name, specialization, rating, sessions, availability, photo, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [record.id, record.name, record.specialization, record.rating, record.sessions, record.availability, record.photo, record.active]
    );
    return mapSpecialistRow(res.rows[0]);
  }
  record.created_at = new Date().toISOString();
  record.updated_at = record.created_at;
  localStore.specialists.push(record);
  saveLocalStore(localStore);
  return mapSpecialistRow(record);
}

async function updateSpecialist(id, data) {
  const current = await getSpecialistById(id);
  if (!current) return null;
  const next = {
    name: data.name !== undefined ? String(data.name).trim() : current.name,
    specialization: data.specialization !== undefined ? String(data.specialization).trim() : current.specialization,
    rating: data.rating !== undefined ? Number(data.rating) : current.rating,
    sessions: data.sessions !== undefined ? parseInt(data.sessions, 10) : current.sessions,
    availability: data.availability !== undefined ? String(data.availability).trim() : current.availability,
    photo: data.photo !== undefined ? data.photo || null : current.photo,
    active: data.active !== undefined ? data.active === true || data.active === 'true' : current.active
  };
  if (isPostgres && pool) {
    const res = await pool.query(
      `UPDATE specialists SET name = $1, specialization = $2, rating = $3, sessions = $4,
       availability = $5, photo = $6, active = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [next.name, next.specialization, next.rating, next.sessions, next.availability, next.photo, next.active, id]
    );
    return res.rows[0] ? mapSpecialistRow(res.rows[0]) : null;
  }
  const row = localStore.specialists.find(s => s.id === id);
  Object.assign(row, next, { updated_at: new Date().toISOString() });
  saveLocalStore(localStore);
  return mapSpecialistRow(row);
}

async function deleteSpecialist(id) {
  if (isPostgres && pool) {
    await pool.query('DELETE FROM specialists WHERE id = $1', [id]);
    return true;
  }
  localStore.specialists = (localStore.specialists || []).filter(s => s.id !== id);
  saveLocalStore(localStore);
  return true;
}

// --- BOOKINGS OPERATIONS ---
async function getBookingsByUserId(userId) {
  if (!userId) return [];
  if (isPostgres && pool) {
    const res = await pool.query(
      `SELECT b.*, p.breed AS pet_breed, COALESCE(p.photo, p.avatar) AS pet_photo
       FROM bookings b
       LEFT JOIN pets p ON p.id = b.pet_id AND p.user_id = b.user_id
       WHERE b.user_id = $1 ORDER BY b.created_at DESC`, [userId]
    );
    return res.rows.map(r => ({ ...mapBookingRow(r), petBreed: r.pet_breed || '', petPhoto: r.pet_photo || '' }));
  }
  return (localStore.bookings || []).filter(b => b.user_id === userId).map(b => {
    const pet = (localStore.pets || []).find(p => p.id === b.pet_id && p.user_id === userId);
    return { ...mapBookingRow(b), petBreed: pet?.breed || '', petPhoto: pet?.photo || pet?.avatar || '' };
  });
}

async function getAllBookings() {
  if (isPostgres && pool) {
    const res = await pool.query(`
      SELECT b.*, u.name as user_name, u.email as user_email, u.phone as user_phone,
             p.breed as pet_breed, p.photo as pet_photo
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       LEFT JOIN pets p ON b.pet_id = p.id
       ORDER BY b.created_at DESC
    `);
    return res.rows.map(r => ({
      ...mapBookingRow(r),
      userName: r.user_name || 'Pet Parent',
      ownerName: r.user_name || 'Pet Parent',
      userEmail: r.user_email || '',
      userPhone: r.user_phone || '',
      petBreed: r.pet_breed || '',
      petPhoto: r.pet_photo || ''
    }));
  }

  return (localStore.bookings || []).map(b => {
    const user = (localStore.users || []).find(u => u.id === b.user_id);
    const pet = (localStore.pets || []).find(p => p.id === b.pet_id);
    return {
      ...mapBookingRow(b),
      userName: user ? user.name : 'Pet Parent',
      ownerName: user ? user.name : 'Pet Parent',
      userEmail: user ? user.email : '',
      userPhone: user ? user.phone : '',
      petBreed: pet ? pet.breed : '',
      petPhoto: pet ? pet.photo : ''
    };
  });
}

function mapBookingRow(b) {
  const bookingTotal = Number(b.total_amount) || convertLegacyPriceToINR(b.service_price || 0);
  return {
    id: b.id,
    userId: b.user_id,
    user_id: b.user_id,
    petId: b.pet_id,
    pet_id: b.pet_id,
    companionChoice: b.pet_id ? 'pet' : 'none',
    serviceId: b.service_id,
    service_id: b.service_id,
    service: b.service_name || b.service,
    serviceName: b.service_name || b.service,
    service_name: b.service_name || b.service,
    serviceCategory: b.service_category,
    servicePrice: formatINR(bookingTotal),
    serviceBasePrice: formatINR(b.service_price || 0),
    totalAmount: bookingTotal,
    duration: b.duration,
    petName: b.pet_name,
    pet_name: b.pet_name,
    date: b.booking_date,
    booking_date: b.booking_date,
    time: b.booking_time,
    booking_time: b.booking_time,
    provider: b.provider || 'Any Master Groomer',
    specialist: b.provider || 'Any Master Groomer',
    specialistId: b.specialist_id || null,
    specialistRole: b.specialist_role || 'Any available specialist',
    specialistPhoto: b.specialist_photo || null,
    specialistRating: b.specialist_rating == null ? null : Number(b.specialist_rating),
    specialistSessions: b.specialist_sessions == null ? null : Number(b.specialist_sessions),
    specialistAvailability: b.specialist_availability || '',
    status: b.status || 'Confirmed',
    notes: b.notes || '',
    address: b.address || 'PetPals Flagship Spa & Sanctuary',
    location: b.address || 'PetPals Flagship Spa & Sanctuary',
    locationType: b.location_type || '',
    selectedAddons: Array.isArray(b.selected_addons) ? b.selected_addons : (typeof b.selected_addons === 'string' ? JSON.parse(b.selected_addons || '[]') : []),
    createdAt: b.created_at
  };
}

const BOOKING_TIME_SLOTS = ['09:30','10:30','11:15','13:30','14:45','15:30','16:30'];
function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day); date.setHours(0,0,0,0);
  const today = new Date(); today.setHours(0,0,0,0);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day && date >= today;
}

async function getUnavailableBookingTimes(date, specialistId = null) {
  if (!isIsoDate(date)) throw Object.assign(new Error('Select a valid future date'), { statusCode: 400 });
  if (isPostgres && pool) {
    const result = await pool.query(
      `SELECT booking_time FROM bookings WHERE booking_date = $1 AND LOWER(COALESCE(status,'')) <> 'cancelled'
       AND ($2::varchar IS NULL OR specialist_id = $2 OR specialist_id IS NULL)`, [date, specialistId || null]
    );
    return [...new Set(result.rows.map(row => String(row.booking_time).slice(0,5)))];
  }
  return [...new Set((localStore.bookings || []).filter(booking => booking.booking_date === date && String(booking.status).toLowerCase() !== 'cancelled'
    && (!specialistId || booking.specialist_id === specialistId || !booking.specialist_id)).map(booking => String(booking.booking_time).slice(0,5)))];
}

async function createBooking(data, userId, options = {}) {
  const id = `PP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const finalUserId = userId || data.user_id;
  if (!finalUserId) throw new Error('User ID is required to create a booking');

  const date = String(data.date || data.booking_date || '');
  if (!isIsoDate(date)) throw Object.assign(new Error('Select a valid future booking date'), { statusCode: 400 });
  const time = String(data.time || data.booking_time || '');
  if (!BOOKING_TIME_SLOTS.includes(time)) throw Object.assign(new Error('Select an available appointment time'), { statusCode: 400 });
  const nowLocal = new Date();
  const todayLocal = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth()+1).padStart(2,'0')}-${String(nowLocal.getDate()).padStart(2,'0')}`;
  if (date === todayLocal) {
    const [hour, minute] = time.split(':').map(Number);
    const now = new Date();
    if (hour * 60 + minute <= now.getHours() * 60 + now.getMinutes()) throw Object.assign(new Error('Choose a future appointment time'), { statusCode: 400 });
  }
  const locationType = data.locationType || data.location_type;
  if (!['clinic','mobile'].includes(locationType)) throw Object.assign(new Error('Select a service location'), { statusCode: 400 });

  const serviceId = data.serviceId || data.service_id;
  if (!serviceId) throw Object.assign(new Error('Select a service'), { statusCode: 400 });
  const service = (await getAllServices(true)).find(item => item.id === serviceId);
  if (!service) throw Object.assign(new Error('Selected service is unavailable'), { statusCode: 400 });

  const petId = data.petId || data.pet_id || null;
  let selectedPet = null;
  if (petId) {
    if (isPostgres && pool) {
      const petResult = await pool.query('SELECT * FROM pets WHERE id = $1 AND user_id = $2 LIMIT 1', [petId, finalUserId]);
      selectedPet = petResult.rows[0] || null;
    } else selectedPet = (localStore.pets || []).find(pet => pet.id === petId && pet.user_id === finalUserId) || null;
    if (!selectedPet) throw Object.assign(new Error('Selected companion does not belong to this account'), { statusCode: 400 });
  }

  const servicePriceNum = Number(service.priceNum);
  const servicePrice = formatINR(servicePriceNum);
  const serviceName = service.name;
  const serviceCategory = service.category;
  const duration = service.duration;
  const petName = selectedPet ? selectedPet.name : 'No companion';
  const specialistId = data.specialistId || data.specialist_id || null;
  const selectedSpecialist = specialistId ? await getSpecialistById(specialistId) : null;
  if (specialistId && (!selectedSpecialist || !selectedSpecialist.active)) {
    throw Object.assign(new Error('Selected specialist is unavailable'), { statusCode: 400 });
  }
  const provider = selectedSpecialist?.name || 'Any Master Groomer';
  const specialistRole = selectedSpecialist?.specialization || 'Any available specialist';
  const specialistPhoto = selectedSpecialist?.photo || null;
  const specialistRating = selectedSpecialist?.rating ?? null;
  const specialistSessions = selectedSpecialist?.sessions ?? null;
  const specialistAvailability = selectedSpecialist?.availability || '';
  const status = 'Confirmed';
  const notes = data.notes || '';
  const address = data.location || data.address || (locationType === 'mobile' ? 'In-Home Concierge Van' : 'PetPals Flagship Spa & Wellness Lounge • Suite 4');
  const allowedAddons = new Map([['Paw Balm & Nail Trim',1450],['Organic Teeth Brushing',950]]);
  const selectedAddons = [...new Set((Array.isArray(data.selectedAddons) ? data.selectedAddons : []).map(addon => String(addon.name || '').trim()))]
    .filter(name => allowedAddons.has(name)).map(name => ({ name, price: allowedAddons.get(name) }));
  const addonTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  const fee = servicePriceNum >= 9700 ? Math.round(servicePriceNum * 0.05) : 450;
  const tax = servicePriceNum >= 9700 ? Math.round(servicePriceNum * 0.06) : 450;
  const totalAmount = servicePriceNum + addonTotal + fee + tax;
  if (!options.skipAvailabilityCheck) {
    const unavailable = await getUnavailableBookingTimes(date, specialistId);
    if (unavailable.includes(time)) throw Object.assign(new Error('That time is no longer available. Choose another time.'), { statusCode: 409 });
  }

  if (isPostgres && pool) {
    const res = await pool.query(
      `INSERT INTO bookings (id, user_id, pet_id, service_id, service_name, service_category, service_price, total_amount, duration, pet_name, booking_date, booking_time, provider, status, notes, address, specialist_id, specialist_role, specialist_photo, specialist_rating, specialist_sessions, specialist_availability, location_type, selected_addons)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
       RETURNING *`,
      [id, finalUserId, petId, serviceId, serviceName, serviceCategory, servicePrice, totalAmount, duration, petName, date, time, provider, status, notes, address, specialistId, specialistRole, specialistPhoto, specialistRating, specialistSessions, specialistAvailability, locationType, JSON.stringify(selectedAddons)]
    );
    return mapBookingRow(res.rows[0]);
  }

  const booking = {
    id, user_id: finalUserId, pet_id: petId, service_id: serviceId, service_name: serviceName,
    service_category: serviceCategory, service_price: servicePrice, total_amount: totalAmount,
    duration, pet_name: petName, booking_date: date, booking_time: time, provider,
    specialist_id: specialistId, specialist_role: specialistRole, specialist_photo: specialistPhoto,
    specialist_rating: specialistRating, specialist_sessions: specialistSessions,
    specialist_availability: specialistAvailability, location_type: locationType,
    selected_addons: selectedAddons, status, notes, address,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  };
  localStore.bookings = localStore.bookings || [];
  localStore.bookings.unshift(booking);
  saveLocalStore(localStore);
  return mapBookingRow(booking);
}
async function updateBookingStatus(id, status, notes) {
  if (isPostgres && pool) {
    let sql = 'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP';
    const params = [status];
    if (notes !== undefined) {
      sql += ', notes = $2 WHERE id = $3';
      params.push(notes, id);
    } else {
      sql += ' WHERE id = $2';
      params.push(id);
    }
    sql += ' RETURNING *';
    const res = await pool.query(sql, params);
    return res.rows[0] ? mapBookingRow(res.rows[0]) : null;
  }

  const idx = localStore.bookings.findIndex(b => b.id === id);
  if (idx !== -1) {
    localStore.bookings[idx].status = status;
    if (notes !== undefined) localStore.bookings[idx].notes = notes;
    localStore.bookings[idx].updated_at = new Date().toISOString();
    saveLocalStore(localStore);
    return mapBookingRow(localStore.bookings[idx]);
  }
  return null;
}

// --- REVIEWS OPERATIONS ---
async function getAllReviews(onlyApproved = false) {
  if (isPostgres && pool) {
    let sql = 'SELECT * FROM reviews';
    if (onlyApproved) sql += " WHERE status = 'Approved'";
    sql += ' ORDER BY created_at DESC';
    const res = await pool.query(sql);
    return res.rows.map(mapReviewRow);
  }

  let list = localStore.reviews;
  if (onlyApproved) list = list.filter(r => r.status === 'Approved');
  return list.map(mapReviewRow);
}

function mapReviewRow(r) {
  return {
    id: r.id,
    userId: r.user_id,
    user: r.user_name || r.user,
    userName: r.user_name || r.user,
    avatar: r.user_avatar || DEFAULT_USER.avatar,
    userAvatar: r.user_avatar || DEFAULT_USER.avatar,
    pet: r.pet || 'Companion',
    petId: r.pet_id || null,
    serviceId: r.service_id || null,
    bookingId: r.booking_id || null,
    service: r.service_name || r.service,
    serviceName: r.service_name || r.service,
    rating: r.rating || 5,
    comment: r.comment,
    status: r.status || 'Approved',
    featured: Boolean(r.featured),
    date: new Date(r.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    createdAt: r.created_at
  };
}

async function getReviewsByUserId(userId) {
  if (!userId) return [];
  if (isPostgres && pool) {
    const result = await pool.query('SELECT * FROM reviews WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return result.rows.map(mapReviewRow);
  }
  return localStore.reviews.filter(review => review.user_id === userId).map(mapReviewRow);
}

async function createReview(data, userId, user) {
  if (!userId) throw Object.assign(new Error('Authentication required'), { statusCode: 401 });
  const id = 'rev-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex');
  const rating = Number(data.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !String(data.comment || '').trim() || !data.petId || !data.serviceId) {
    throw Object.assign(new Error('Pet, service, a 1–5 star rating, and review text are required'), { statusCode: 400 });
  }
  let pet, service;
  if (isPostgres && pool) {
    const [petResult, activeServices] = await Promise.all([
      pool.query('SELECT * FROM pets WHERE id = $1 AND user_id = $2 LIMIT 1', [data.petId, userId]),
      getAllServices(true)
    ]);
    pet = petResult.rows[0]; service = activeServices.find(item => String(item.id) === String(data.serviceId));
    if (data.bookingId) {
      const booking = await pool.query("SELECT id FROM bookings WHERE id = $1 AND user_id = $2 AND pet_id = $3 AND service_id = $4 AND LOWER(status) IN ('completed','complete') LIMIT 1", [data.bookingId, userId, data.petId, data.serviceId]);
      if (!booking.rows[0]) throw Object.assign(new Error('Reviews can only be added for your completed booking'), { statusCode: 400 });
      const duplicate = await pool.query('SELECT 1 FROM reviews WHERE user_id = $1 AND booking_id = $2 LIMIT 1', [userId, data.bookingId]);
      if (duplicate.rows[0]) throw Object.assign(new Error('A review has already been submitted for this booking'), { statusCode: 409 });
    }
  } else {
    pet = localStore.pets.find(item => item.id === data.petId && item.user_id === userId);
    service = localStore.services.find(item => item.id === data.serviceId && item.active !== false);
  }
  if (!pet) throw Object.assign(new Error('Selected pet does not belong to this account'), { statusCode: 400 });
  if (!service) throw Object.assign(new Error('Selected service is unavailable'), { statusCode: 400 });
  const petLabel = `${pet.name}${pet.breed ? ` (${pet.breed})` : ''}`;
  const userName = user?.name || '';
  const userAvatar = user?.avatar || null;

  if (isPostgres && pool) {
    const res = await pool.query(
      `INSERT INTO reviews (id, user_id, user_name, user_avatar, pet, pet_id, service_id, booking_id, service_name, rating, comment, status, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Pending', FALSE)
       RETURNING *`,
      [id, userId, userName, userAvatar, petLabel, pet.id, service.id, data.bookingId || null, service.name, rating, String(data.comment).trim()]
    );
    return mapReviewRow(res.rows[0]);
  }

  const r = {
    id,
    user_id: userId || null,
    user_name: userName,
    user_avatar: userAvatar,
    pet: petLabel,
    pet_id: pet.id,
    service_id: service.id,
    booking_id: data.bookingId || null,
    service_name: service.name,
    rating,
    comment: String(data.comment).trim(),
    status: 'Pending',
    featured: false,
    created_at: new Date().toISOString()
  };
  localStore.reviews.unshift(r);
  saveLocalStore(localStore);
  return mapReviewRow(r);
}

async function updateReview(id, data) {
  if (isPostgres && pool) {
    const existingRes = await pool.query('SELECT * FROM reviews WHERE id = $1', [id]);
    if (!existingRes.rows[0]) return null;
    const existing = existingRes.rows[0];

    const status = data.status !== undefined ? data.status : existing.status;
    const featured = data.featured !== undefined ? Boolean(data.featured) : existing.featured;

    const res = await pool.query(
      `UPDATE reviews SET status = $1, featured = $2 WHERE id = $3 RETURNING *`,
      [status, featured, id]
    );
    return mapReviewRow(res.rows[0]);
  }

  const idx = localStore.reviews.findIndex(r => r.id === id);
  if (idx !== -1) {
    if (data.status !== undefined) localStore.reviews[idx].status = data.status;
    if (data.featured !== undefined) localStore.reviews[idx].featured = Boolean(data.featured);
    saveLocalStore(localStore);
    return mapReviewRow(localStore.reviews[idx]);
  }
  return null;
}

async function deleteReview(id) {
  if (isPostgres && pool) {
    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
    return true;
  }
  localStore.reviews = localStore.reviews.filter(r => r.id !== id);
  saveLocalStore(localStore);
  return true;
}

// --- MESSAGES / INQUIRIES OPERATIONS ---
async function getAllMessages() {
  if (isPostgres && pool) {
    const res = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
    return res.rows.map(mapMessageRow);
  }
  return localStore.messages.map(mapMessageRow);
}

function mapMessageRow(m) {
  return {
    id: m.id,
    userId: m.user_id,
    name: m.name,
    email: m.email,
    phone: m.phone || '',
    subject: m.subject,
    message: m.message,
    status: m.status || 'Unread',
    reply: m.reply || '',
    repliedAt: m.replied_at || '',
    date: new Date(m.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    createdAt: m.created_at
  };
}

async function createMessage(data, userId) {
  const id = data.id || 'msg-' + Date.now();
  if (isPostgres && pool) {
    const res = await pool.query(
      `INSERT INTO messages (id, user_id, name, email, phone, subject, message, status, reply, replied_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [id, userId || null, data.name, data.email, data.phone || '', data.subject || 'Support Request', data.message, 'Unread', '', '']
    );
    return mapMessageRow(res.rows[0]);
  }

  const m = {
    id,
    user_id: userId || null,
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    subject: data.subject || 'Support Request',
    message: data.message,
    status: 'Unread',
    reply: '',
    replied_at: '',
    created_at: new Date().toISOString()
  };
  localStore.messages.unshift(m);
  saveLocalStore(localStore);
  return mapMessageRow(m);
}

async function replyMessage(id, replyText) {
  const repliedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

  if (isPostgres && pool) {
    const res = await pool.query(
      `UPDATE messages SET reply = $1, status = 'Replied', replied_at = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [replyText, repliedAt, id]
    );
    return res.rows[0] ? mapMessageRow(res.rows[0]) : null;
  }

  const idx = localStore.messages.findIndex(m => m.id === id);
  if (idx !== -1) {
    localStore.messages[idx].reply = replyText;
    localStore.messages[idx].status = 'Replied';
    localStore.messages[idx].replied_at = repliedAt;
    saveLocalStore(localStore);
    return mapMessageRow(localStore.messages[idx]);
  }
  return null;
}

// --- ADMIN STATS & SETTINGS ---
async function getAdminStats() {
  if (isPostgres && pool) {
    const [usersRes, petsRes, bookingsRes, reviewsRes, revenueRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query("SELECT COUNT(*) FROM pets WHERE status = 'Active'"),
      pool.query("SELECT COUNT(*) FROM bookings WHERE status = 'Completed'"),
      pool.query("SELECT COUNT(*) FROM reviews WHERE status = 'Pending'"),
      pool.query("SELECT COALESCE(SUM(CAST(REGEXP_REPLACE(service_price, '[^0-9.]', '', 'g') AS NUMERIC)), 0) as total FROM bookings WHERE status != 'Cancelled'")
    ]);

    return {
      totalUsers: parseInt(usersRes.rows[0].count, 10),
      activePets: parseInt(petsRes.rows[0].count, 10),
      completedBookings: parseInt(bookingsRes.rows[0].count, 10),
      pendingReviews: parseInt(reviewsRes.rows[0].count, 10),
      revenue: formatINR(Math.round(parseFloat(revenueRes.rows[0].total) || 12450))
    };
  }

  const totalUsers = localStore.users.length;
  const activePets = localStore.pets.filter(p => p.status === 'Active').length;
  const completedBookings = localStore.bookings.filter(b => b.status === 'Completed').length;
  const pendingReviews = localStore.reviews.filter(r => r.status === 'Pending').length;
  const revenueNum = localStore.bookings
    .filter(b => b.status !== 'Cancelled')
    .reduce((sum, b) => sum + (convertLegacyPriceToINR(b.service_price) || 6300), 0);

  return {
    totalUsers,
    activePets,
    completedBookings,
    pendingReviews,
    revenue: formatINR(Math.round(revenueNum || 12450))
  };
}

async function getAdminSettings() {
  if (isPostgres && pool) {
    const res = await pool.query('SELECT settings_json FROM admin_settings WHERE id = $1', ['default']);
    if (res.rows[0]) return res.rows[0].settings_json;
  }
  return localStore.settings || DEFAULT_SETTINGS;
}

async function saveAdminSettings(sets) {
  if (isPostgres && pool) {
    await pool.query(
      `INSERT INTO admin_settings (id, settings_json, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET settings_json = $2, updated_at = CURRENT_TIMESTAMP`,
      ['default', JSON.stringify(sets)]
    );
    return sets;
  }
  localStore.settings = { ...localStore.settings, ...sets };
  saveLocalStore(localStore);
  return localStore.settings;
}

module.exports = {
  initDatabase,
  createSession,
  getSession,
  deleteSession,
  deleteUserSessions,
  findUserByEmail,
  findUserById,
  isGeneratedProfileAvatar,
  createUser,
  updateUser,
  getAllUsers,
  findAdminByEmail,
  createAdminSession,
  getAdminSession,
  deleteAdminSession,
  getPetsByUserId,
  getAllPets,
  createPet,
  updatePet,
  deletePet,
  getAllServices,
  getSpecialists,
  getSpecialistById,
  createSpecialist,
  updateSpecialist,
  deleteSpecialist,
  createService,
  updateService,
  deleteService,
  getBookingsByUserId,
  getAllBookings,
  getUnavailableBookingTimes,
  createBooking,
  updateBookingStatus,
  getAllReviews,
  getReviewsByUserId,
  createReview,
  updateReview,
  deleteReview,
  getAllMessages,
  createMessage,
  replyMessage,
  getAdminStats,
  getAdminSettings,
  saveAdminSettings,
  isPostgresConnected: () => isPostgres
};
