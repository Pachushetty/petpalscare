// PetPals PostgreSQL Database & Repository Layer
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config();

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
  avatar: 'https://lh3.googleusercontent.com/aida/AEtjO1W2uQrDJs4Vq5TYFXxKRstMqlWwR7xI1Vd89lXd1ZvB7avK7gnREQ5WOfaUosw8l-wR8L7-eAfCJuvY7Cdxkt317Wkh_wn-EKHXll2I84VoOFaioaG2l8yZtkkQGVoXM8G4qG0iUi8m9vS2hjJib1qyvdhI6AzazhdyK9EGdq-j_RpdlDJb8JyxcEVyEU7peCGUk_svquzx-8jfE0aefqTpVg7JuQ55FJTJZ-LnWWoZI1waQwUpguaERD58ZXbKt52BFZtBOSmgo_4',
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
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  created_at: new Date('2026-01-01T00:00:00Z').toISOString()
};

const DEFAULT_PETS = [
  {
    id: 'pet-bruno',
    user_id: DEFAULT_USER_ID,
    name: 'Bruno',
    species: 'Dog',
    breed: 'Golden Retriever',
    age: '2 years',
    weight: '31.0 kg',
    gender: 'Male (Neutered)',
    microchip: '985 141 002 381',
    status: 'Active',
    note: 'Last wellness check: 2 weeks ago',
    notes: 'Salmon & sweet potato kibble twice daily. Sensitive to loud air blowers.',
    photo: 'https://lh3.googleusercontent.com/aida/AEtjO1Uuc_lq8IwyBwbjSlNL1obmQxxUrnJznxdjFzSncsyQDO1-YLIUzfA26YIg8yEhskgu9bqGS8QeWYZPTGpIQD6FXUjqJOTEPL92yxV6_uo66Re6T62xuKeC1UJF5zhXDGpeUIx3UpOQOFfTvElfqK-3SvN_G681f6Is0T7pjxiMowIXYwAQiutnTNbf70J32lVHH31Pn4LZk54wkstesIfLUzUa5mtuN06jDWNkEWTtCVkamIVdAptB-t6J',
    avatar: 'https://lh3.googleusercontent.com/aida/AEtjO1Uuc_lq8IwyBwbjSlNL1obmQxxUrnJznxdjFzSncsyQDO1-YLIUzfA26YIg8yEhskgu9bqGS8QeWYZPTGpIQD6FXUjqJOTEPL92yxV6_uo66Re6T62xuKeC1UJF5zhXDGpeUIx3UpOQOFfTvElfqK-3SvN_G681f6Is0T7pjxiMowIXYwAQiutnTNbf70J32lVHH31Pn4LZk54wkstesIfLUzUa5mtuN06jDWNkEWTtCVkamIVdAptB-t6J',
    created_at: new Date('2026-01-16T10:00:00Z').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'pet-milo',
    user_id: DEFAULT_USER_ID,
    name: 'Milo',
    species: 'Cat',
    breed: 'Tabby Cat',
    age: '1 year',
    weight: '4.8 kg',
    gender: 'Male (Neutered)',
    microchip: '985 141 009 842',
    status: 'Active',
    note: 'Vaccinations fully updated',
    notes: 'Nutritious balanced formula twice daily.',
    photo: 'https://lh3.googleusercontent.com/aida/AEtjO1WT6ANlajBfAFZfy7s2ZiqXTDUYaiJGV-Hu02OGU9PgovrJw8KPqccWgiG93n2PwTxchuFVJ3ASByB6dPS4dMyMzed6GF9xPYMGkUfOw9pVQY0mIH7U4hxSFJ3vXHqSyMhnnjpwmDSD8uEEh7mB5FeOP2gk61l4gyqODvdUhL5TDs1EOSm8R69PQ2QmROFVLmTomMBxfeSAD-EuGOnPSGeQE2uRBmqA8ealfCucmUXvwTJ2HOqlPVelelg',
    avatar: 'https://lh3.googleusercontent.com/aida/AEtjO1WT6ANlajBfAFZfy7s2ZiqXTDUYaiJGV-Hu02OGU9PgovrJw8KPqccWgiG93n2PwTxchuFVJ3ASByB6dPS4dMyMzed6GF9xPYMGkUfOw9pVQY0mIH7U4hxSFJ3vXHqSyMhnnjpwmDSD8uEEh7mB5FeOP2gk61l4gyqODvdUhL5TDs1EOSm8R69PQ2QmROFVLmTomMBxfeSAD-EuGOnPSGeQE2uRBmqA8ealfCucmUXvwTJ2HOqlPVelelg',
    created_at: new Date('2026-02-01T12:00:00Z').toISOString(),
    updated_at: new Date().toISOString()
  }
];

const DEFAULT_SERVICES = [
  { id: 'srv-1', name: 'Grooming & Spa Experience', category: 'grooming', price: '$65.00', price_num: 65, duration: '75 min', specialist: 'Sarah Jenkins', active: true, description: 'Botanical hydrobath, blueberry facial, breed scissor trim, and paw massage.', badge: 'Most Popular', rating: 4.9, reviews_count: 142 },
  { id: 'srv-2', name: 'Veterinary Comprehensive Exam', category: 'medical', price: '$85.00', price_num: 85, duration: '45 min', specialist: 'Dr. Emily Chen, DVM', active: true, description: 'Full physical examination, vitals, dental inspection, and vaccination check.', badge: 'Recommended', rating: 5.0, reviews_count: 98 },
  { id: 'srv-3', name: 'Luxury Sanctuary Boarding', category: 'boarding', price: '$75.00', price_num: 75, duration: 'Per Night', specialist: 'Care Sanctuary Team', active: true, description: 'Private suite with orthopaedic bedding, webcam access, and 3 daily play sessions.', badge: 'Premium', rating: 4.8, reviews_count: 76 },
  { id: 'srv-4', name: 'Canine Adventure Walking', category: 'training', price: '$30.00', price_num: 30, duration: '60 min', specialist: 'Alex Rivera', active: true, description: 'Solo or small pack enrichment walk through nature reserve trails with GPS tracking.', badge: '', rating: 4.9, reviews_count: 64 },
  { id: 'srv-5', name: 'Gentle Dental Hygiene Polish', category: 'medical', price: '$95.00', price_num: 95, duration: '50 min', specialist: 'Dr. Emily Chen, DVM', active: true, description: 'Ultrasonic scaling, antiseptic irrigation, and breath freshening enzyme coat.', badge: '', rating: 4.7, reviews_count: 53 },
  { id: 'srv-6', name: 'Puppy & Companion Socialization', category: 'training', price: '$45.00', price_num: 45, duration: '60 min', specialist: 'Marcus Vance', active: true, description: 'Certified trainer-led positive reinforcement and manners development.', badge: '', rating: 5.0, reviews_count: 39 }
];

const DEFAULT_BOOKINGS = [
  {
    id: 'PP-84920',
    user_id: DEFAULT_USER_ID,
    pet_id: 'pet-bruno',
    service_id: 'srv-1',
    service_name: 'Grooming & Spa Experience',
    service_category: 'grooming',
    service_price: '$65.00',
    duration: '75 min',
    pet_name: 'Bruno',
    booking_date: 'Tomorrow, Oct 6',
    booking_time: '10:30 AM',
    provider: 'Sarah Jenkins',
    status: 'Confirmed',
    notes: 'Sensitive to loud air blowers. Use organic aloe wash.',
    address: 'PetPals Main Sanctuary • Studio 4',
    created_at: new Date('2026-10-04T11:00:00Z').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'PP-84921',
    user_id: DEFAULT_USER_ID,
    pet_id: 'pet-milo',
    service_id: 'srv-2',
    service_name: 'Veterinary Comprehensive Exam',
    service_category: 'medical',
    service_price: '$85.00',
    duration: '45 min',
    pet_name: 'Milo',
    booking_date: 'Thu, Oct 15',
    booking_time: '02:00 PM',
    provider: 'Dr. Emily Chen, DVM',
    status: 'Confirmed',
    notes: 'Annual booster & feline wellness routine.',
    address: 'PetPals Clinical Suite A',
    created_at: new Date('2026-10-04T12:00:00Z').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'PP-83110',
    user_id: DEFAULT_USER_ID,
    pet_id: 'pet-bruno',
    service_id: 'srv-4',
    service_name: 'Canine Adventure Walking',
    service_category: 'training',
    service_price: '$30.00',
    duration: '60 min',
    pet_name: 'Bruno',
    booking_date: '28 Sep 2026',
    booking_time: '09:00 AM',
    provider: 'Alex Rivera',
    status: 'Completed',
    notes: 'Lake trail route completed happily.',
    address: 'Sanctuary Reserve Trailhead',
    created_at: new Date('2026-09-25T14:00:00Z').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'PP-81204',
    user_id: DEFAULT_USER_ID,
    pet_id: 'pet-bruno',
    service_id: 'srv-1',
    service_name: 'Grooming & Spa Experience',
    service_category: 'grooming',
    service_price: '$65.00',
    duration: '75 min',
    pet_name: 'Bruno',
    booking_date: '14 Sep 2026',
    booking_time: '11:00 AM',
    provider: 'Sarah Jenkins',
    status: 'Completed',
    notes: 'Clean scissor clip and dental freshening.',
    address: 'PetPals Main Sanctuary • Studio 4',
    created_at: new Date('2026-09-10T10:00:00Z').toISOString(),
    updated_at: new Date().toISOString()
  }
];

const DEFAULT_REVIEWS = [
  { id: 'rev-1', user_id: DEFAULT_USER_ID, user_name: 'Prathiksha Shetty', user_avatar: DEFAULT_USER.avatar, pet: 'Bruno (Golden Retriever)', rating: 5, service_name: 'Grooming & Spa Experience', status: 'Approved', featured: true, comment: 'Sarah took incredible care of Bruno! He came home so clean, soft, and completely stress-free. The report card was wonderful.', created_at: new Date('2026-10-02T14:00:00Z').toISOString() },
  { id: 'rev-2', user_id: null, user_name: 'Sneha R.', user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', pet: 'Simba (Spitz)', rating: 5, service_name: 'Veterinary Comprehensive Exam', status: 'Approved', featured: false, comment: 'Dr. Emily Chen was so gentle and thorough. The online records access makes tracking vaccinations effortless.', created_at: new Date('2026-09-28T10:00:00Z').toISOString() },
  { id: 'rev-3', user_id: null, user_name: 'Arjun T.', user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', pet: 'Charlie (Beagle)', rating: 4, service_name: 'Canine Adventure Walking', status: 'Approved', featured: false, comment: 'Alex is great with high-energy dogs. Charlie had a blast and slept like a log afterwards!', created_at: new Date('2026-09-25T11:00:00Z').toISOString() },
  { id: 'rev-4', user_id: DEFAULT_USER_ID, user_name: 'Prathiksha Shetty', user_avatar: DEFAULT_USER.avatar, pet: 'Milo (Cat)', rating: 5, service_name: 'Luxury Sanctuary Boarding', status: 'Pending', featured: false, comment: 'Leaving Milo for 3 days was hard, but the daily video check-ins put our minds completely at ease.', created_at: new Date('2026-09-20T16:00:00Z').toISOString() }
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
  pets: [...DEFAULT_PETS],
  services: [...DEFAULT_SERVICES],
  bookings: [...DEFAULT_BOOKINGS],
  reviews: [...DEFAULT_REVIEWS],
  messages: [...DEFAULT_MESSAGES],
  settings: { ...DEFAULT_SETTINGS }
};

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
        duration VARCHAR(50),
        pet_name VARCHAR(255),
        booking_date VARCHAR(100) NOT NULL,
        booking_time VARCHAR(100) NOT NULL,
        provider VARCHAR(255) DEFAULT 'Dr. Aris Thorne',
        status VARCHAR(50) DEFAULT 'Confirmed',
        notes TEXT,
        address TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Reviews Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        user_name VARCHAR(255) NOT NULL,
        user_avatar TEXT,
        pet VARCHAR(255),
        service_id VARCHAR(64),
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

    // Seed default Pets if empty
    const petsCheck = await client.query('SELECT COUNT(*) FROM pets');
    if (parseInt(petsCheck.rows[0].count, 10) === 0) {
      for (const p of DEFAULT_PETS) {
        await client.query(
          `INSERT INTO pets (id, user_id, name, species, breed, age, weight, gender, microchip, status, note, notes, photo, avatar)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [p.id, p.user_id, p.name, p.species, p.breed, p.age, p.weight, p.gender, p.microchip, p.status, p.note, p.notes, p.photo, p.avatar]
        );
      }
    }

    // Seed default Services if empty
    const srvCheck = await client.query('SELECT COUNT(*) FROM services');
    if (parseInt(srvCheck.rows[0].count, 10) === 0) {
      for (const s of DEFAULT_SERVICES) {
        await client.query(
          `INSERT INTO services (id, name, category, price, price_num, duration, specialist, description, badge, rating, reviews_count, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [s.id, s.name, s.category, s.price, s.price_num, s.duration, s.specialist, s.description, s.badge, s.rating, s.reviews_count, s.active]
        );
      }
    }

    // Seed default Bookings if empty
    const bkgCheck = await client.query('SELECT COUNT(*) FROM bookings');
    if (parseInt(bkgCheck.rows[0].count, 10) === 0) {
      for (const b of DEFAULT_BOOKINGS) {
        await client.query(
          `INSERT INTO bookings (id, user_id, pet_id, service_id, service_name, service_category, service_price, duration, pet_name, booking_date, booking_time, provider, status, notes, address)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [b.id, b.user_id, b.pet_id, b.service_id, b.service_name, b.service_category, b.service_price, b.duration, b.pet_name, b.booking_date, b.booking_time, b.provider, b.status, b.notes, b.address]
        );
      }
    }

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

async function createUser(data) {
  const id = data.id || 'usr-' + Date.now();
  const firstName = data.firstName || (data.name ? data.name.split(' ')[0] : 'Member');
  const passwordHash = data.password
    ? (isBcryptHash(data.password) ? data.password : bcrypt.hashSync(String(data.password), 10))
    : (data.password_hash || bcrypt.hashSync('petpals123', 10));

  const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

  const user = {
    id,
    name: (data.name || '').trim() || 'Pet Parent',
    first_name: firstName,
    email: data.email.toLowerCase().trim(),
    password_hash: passwordHash,
    phone: (data.phone || '').trim(),
    location: (data.location || '').trim(),
    avatar: data.avatar || defaultAvatar,
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

  const name = data.name !== undefined ? data.name : existing.name;
  const firstName = data.firstName !== undefined ? data.firstName : (data.name ? data.name.split(' ')[0] : existing.first_name);
  const email = data.email !== undefined ? data.email.toLowerCase().trim() : existing.email;
  const phone = data.phone !== undefined ? data.phone : existing.phone;
  const location = data.location !== undefined ? data.location : (data.address !== undefined ? data.address : existing.location);
  const avatar = data.avatar !== undefined ? data.avatar : existing.avatar;
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
    } catch (err) {
      console.warn('[PostgreSQL] updateUser failed, updating local store:', err.message);
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
             COALESCE(STRING_AGG(DISTINCT p.name, ', '), '') as pets_list
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
      avatar: r.avatar,
      petsCount: parseInt(r.pets_count, 10) || 0,
      bookingsCount: parseInt(r.bookings_count, 10) || 0,
      petsList: r.pets_list || 'None',
      joinedDate: new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Active',
      totalSpent: '$' + ((parseInt(r.bookings_count, 10) || 0) * 65)
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
      avatar: u.avatar,
      petsCount: userPets.length,
      bookingsCount: userBookings.length,
      petsList: userPets.map(p => p.name).join(', ') || 'None',
      joinedDate: new Date(u.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Active',
      totalSpent: '$' + (userBookings.length * 65)
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
    await pool.query(sql, params);
    return true;
  }

  localStore.pets = localStore.pets.filter(p => !(p.id === id && (!userId || p.user_id === userId)));
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
    price: typeof s.price === 'number' ? `$${s.price.toFixed(2)}` : (s.price || `$${s.price_num || 50}`),
    priceNum: parseFloat(s.price_num) || parseFloat(String(s.price).replace(/[^0-9.]/g, '')) || 50,
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
  const priceNum = parseFloat(String(data.price).replace(/[^0-9.]/g, '')) || 50;
  const priceStr = typeof data.price === 'string' && data.price.startsWith('$') ? data.price : `$${priceNum.toFixed(2)}`;

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
    const priceNum = data.price !== undefined ? (parseFloat(String(data.price).replace(/[^0-9.]/g, '')) || existing.price_num) : existing.price_num;
    const priceStr = data.price !== undefined ? (typeof data.price === 'string' && data.price.startsWith('$') ? data.price : `$${priceNum.toFixed(2)}`) : existing.price;
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
    const priceNum = data.price !== undefined ? (parseFloat(String(data.price).replace(/[^0-9.]/g, '')) || s.price_num) : s.price_num;
    localStore.services[idx] = {
      ...s,
      name: data.name !== undefined ? data.name : s.name,
      category: data.category !== undefined ? data.category : s.category,
      price: data.price !== undefined ? (typeof data.price === 'string' && data.price.startsWith('$') ? data.price : `$${priceNum.toFixed(2)}`) : s.price,
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

// --- BOOKINGS OPERATIONS ---
async function getBookingsByUserId(userId) {
  if (!userId) return [];
  if (isPostgres && pool) {
    const res = await pool.query('SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return res.rows.map(mapBookingRow);
  }
  return (localStore.bookings || []).filter(b => b.user_id === userId).map(mapBookingRow);
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
      userEmail: user ? user.email : '',
      userPhone: user ? user.phone : '',
      petBreed: pet ? pet.breed : '',
      petPhoto: pet ? pet.photo : ''
    };
  });
}

function mapBookingRow(b) {
  return {
    id: b.id,
    userId: b.user_id,
    user_id: b.user_id,
    petId: b.pet_id,
    pet_id: b.pet_id,
    serviceId: b.service_id,
    service_id: b.service_id,
    service: b.service_name || b.service,
    serviceName: b.service_name || b.service,
    service_name: b.service_name || b.service,
    serviceCategory: b.service_category,
    servicePrice: b.service_price,
    duration: b.duration,
    petName: b.pet_name,
    pet_name: b.pet_name,
    date: b.booking_date,
    booking_date: b.booking_date,
    time: b.booking_time,
    booking_time: b.booking_time,
    provider: b.provider || 'Care Specialist',
    status: b.status || 'Confirmed',
    notes: b.notes || '',
    address: b.address || 'PetPals Flagship Spa & Sanctuary',
    createdAt: b.created_at
  };
}

async function createBooking(data, userId) {
  const id = data.id || 'PP-' + Math.floor(10000 + Math.random() * 89999);
  const finalUserId = userId || data.user_id;

  if (!finalUserId) {
    throw new Error('User ID is required to create a booking');
  }

  const serviceName = data.service || data.serviceName || data.service_name || 'Grooming & Spa Experience';
  const serviceCategory = data.serviceCategory || data.service_category || 'grooming';
  const servicePrice = data.servicePrice || data.service_price || '$65.00';
  const duration = data.duration || '60 min';
  const petName = data.petName || data.pet_name || 'Companion';
  const date = data.date || data.booking_date || 'Upcoming';
  const time = data.time || data.booking_time || '10:00 AM';
  const provider = data.provider || 'Care Specialist';
  const status = data.status || 'Confirmed';
  const notes = data.notes || '';
  const address = data.address || 'PetPals Main Sanctuary';

  if (isPostgres && pool) {
    const res = await pool.query(
      `INSERT INTO bookings (id, user_id, pet_id, service_id, service_name, service_category, service_price, duration, pet_name, booking_date, booking_time, provider, status, notes, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [id, finalUserId, data.petId || data.pet_id || null, data.serviceId || data.service_id || null, serviceName, serviceCategory, servicePrice, duration, petName, date, time, provider, status, notes, address]
    );
    return mapBookingRow(res.rows[0]);
  }

  const b = {
    id,
    user_id: finalUserId,
    pet_id: data.petId || data.pet_id || null,
    service_id: data.serviceId || data.service_id || null,
    service_name: serviceName,
    service_category: serviceCategory,
    service_price: servicePrice,
    duration,
    pet_name: petName,
    booking_date: date,
    booking_time: time,
    provider,
    status,
    notes,
    address,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  localStore.bookings = localStore.bookings || [];
  localStore.bookings.unshift(b);
  saveLocalStore(localStore);
  return mapBookingRow(b);
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

async function createReview(data, userId) {
  const id = data.id || 'rev-' + Date.now();
  const userName = data.userName || data.user || 'Prathiksha Shetty';
  const userAvatar = data.userAvatar || data.avatar || DEFAULT_USER.avatar;

  if (isPostgres && pool) {
    const res = await pool.query(
      `INSERT INTO reviews (id, user_id, user_name, user_avatar, pet, service_name, rating, comment, status, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [id, userId || null, userName, userAvatar, data.pet || 'Companion', data.service || data.serviceName || 'Pet Care Experience', parseInt(data.rating, 10) || 5, data.comment, 'Approved', Boolean(data.featured)]
    );
    return mapReviewRow(res.rows[0]);
  }

  const r = {
    id,
    user_id: userId || null,
    user_name: userName,
    user_avatar: userAvatar,
    pet: data.pet || 'Companion',
    service_name: data.service || data.serviceName || 'Pet Care Experience',
    rating: parseInt(data.rating, 10) || 5,
    comment: data.comment,
    status: 'Approved',
    featured: Boolean(data.featured),
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
      pool.query("SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(service_price, '$', ''), ',', '') AS NUMERIC)), 0) as total FROM bookings WHERE status != 'Cancelled'")
    ]);

    return {
      totalUsers: parseInt(usersRes.rows[0].count, 10),
      activePets: parseInt(petsRes.rows[0].count, 10),
      completedBookings: parseInt(bookingsRes.rows[0].count, 10),
      pendingReviews: parseInt(reviewsRes.rows[0].count, 10),
      revenue: '$' + Math.round(parseFloat(revenueRes.rows[0].total) || 12450).toLocaleString()
    };
  }

  const totalUsers = localStore.users.length;
  const activePets = localStore.pets.filter(p => p.status === 'Active').length;
  const completedBookings = localStore.bookings.filter(b => b.status === 'Completed').length;
  const pendingReviews = localStore.reviews.filter(r => r.status === 'Pending').length;
  const revenueNum = localStore.bookings
    .filter(b => b.status !== 'Cancelled')
    .reduce((sum, b) => sum + (parseFloat(String(b.service_price).replace(/[^0-9.]/g, '')) || 65), 0);

  return {
    totalUsers,
    activePets,
    completedBookings,
    pendingReviews,
    revenue: '$' + Math.round(revenueNum || 12450).toLocaleString()
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
  createUser,
  updateUser,
  getAllUsers,
  findAdminByEmail,
  getPetsByUserId,
  getAllPets,
  createPet,
  updatePet,
  deletePet,
  getAllServices,
  createService,
  updateService,
  deleteService,
  getBookingsByUserId,
  getAllBookings,
  createBooking,
  updateBookingStatus,
  getAllReviews,
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
