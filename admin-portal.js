// PetPals Admin Portal Controller & Section Router
(function(window) {
  'use strict';

  const STORAGE_KEYS = {
    SERVICES: 'petpals_admin_services',
    REVIEWS: 'petpals_admin_reviews',
    MESSAGES: 'petpals_admin_messages',
    SETTINGS: 'petpals_admin_settings',
    USERS: 'petpals_admin_users',
    SPECIALISTS: 'petpals_admin_specialists',
    BOOKINGS: 'petpals_admin_bookings'
  };

  const DEFAULT_PROFILE_AVATAR = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="#e8ded4"/><circle cx="32" cy="23" r="11" fill="#8c6246"/><path d="M10 60c1-15 10-23 22-23s21 8 22 23" fill="#8c6246"/></svg>'
  );

  const DEFAULT_SERVICES = [
    { id: 'srv-1', name: 'Grooming & Spa Experience', category: 'grooming', price: 6300, duration: '75 min', specialist: 'Sarah Jenkins', active: true, description: 'Botanical hydrobath, blueberry facial, breed scissor trim, and paw massage.' },
    { id: 'srv-2', name: 'Veterinary Comprehensive Exam', category: 'medical', price: 8250, duration: '45 min', specialist: 'Dr. Emily Chen, DVM', active: true, description: 'Full physical examination, vitals, dental inspection, and vaccination check.' },
    { id: 'srv-3', name: 'Luxury Sanctuary Boarding', category: 'boarding', price: 7300, duration: 'Per Night', specialist: 'Care Sanctuary Team', active: true, description: 'Private suite with orthopaedic bedding, webcam access, and 3 daily play sessions.' },
    { id: 'srv-4', name: 'Canine Adventure Walking', category: 'training', price: 2900, duration: '60 min', specialist: 'Alex Rivera', active: true, description: 'Solo or small pack enrichment walk through nature reserve trails with GPS tracking.' },
    { id: 'srv-5', name: 'Gentle Dental Hygiene Polish', category: 'medical', price: 9200, duration: '50 min', specialist: 'Dr. Emily Chen, DVM', active: true, description: 'Ultrasonic scaling, antiseptic irrigation, and breath freshening enzyme coat.' },
    { id: 'srv-6', name: 'Puppy & Companion Socialization', category: 'training', price: 4350, duration: '60 min', specialist: 'Marcus Vance', active: true, description: 'Certified trainer-led positive reinforcement and manners development.' }
  ];

  const DEFAULT_REVIEWS = [
    { id: 'rev-1', user: 'Prathiksha Shetty', pet: 'Bruno (Golden Retriever)', rating: 5, date: '02 Oct 2026', service: 'Grooming & Spa Experience', status: 'Approved', featured: true, comment: 'Sarah took incredible care of Bruno! He came home so clean, soft, and completely stress-free. The report card was wonderful.' },
    { id: 'rev-2', user: 'Sneha R.', pet: 'Simba (Spitz)', rating: 5, date: '28 Sep 2026', service: 'Veterinary Comprehensive Exam', status: 'Approved', featured: false, comment: 'Dr. Emily Chen was so gentle and thorough. The online records access makes tracking vaccinations effortless.' },
    { id: 'rev-3', user: 'Arjun T.', pet: 'Charlie (Beagle)', rating: 4, date: '25 Sep 2026', service: 'Canine Adventure Walking', status: 'Approved', featured: false, comment: 'Alex is great with high-energy dogs. Charlie had a blast and slept like a log afterwards!' },
    { id: 'rev-4', user: 'Priya K.', pet: 'Milo (Cat)', rating: 5, date: '20 Sep 2026', service: 'Luxury Sanctuary Boarding', status: 'Pending', featured: false, comment: 'Leaving Milo for 3 days was hard, but the daily video check-ins put our minds completely at ease.' }
  ];

  const DEFAULT_MESSAGES = [
    { id: 'msg-1', name: 'Prathiksha Shetty', email: 'prathiksha@gmail.com', phone: '+91 98765 43210', date: 'Today, 10:15 AM', subject: 'Inquiry: Holiday Boarding Suite for Bruno', message: 'Hello PetPals team! We are planning a 4-day trip in November. Does the luxury suite include specialized dietary meal prep for Bruno (grain-free)?', status: 'Unread', reply: '' },
    { id: 'msg-2', name: 'Sneha Rao', email: 'sneha.rao@gmail.com', phone: '+91 98451 22334', date: 'Yesterday, 4:20 PM', subject: 'Booster Vaccination Schedule', message: 'Hi! Could Dr. Emily confirm if Milo needs his Rabies booster before next month or if the current certificate is still valid?', status: 'Replied', reply: 'Certificate is valid through Nov 2027! No action needed at this time.' },
    { id: 'msg-3', name: 'Arjun Talwar', email: 'arjun.t@outlook.com', phone: '+91 99120 44556', date: '04 Oct 2026', subject: 'Weekend Walk Availability', message: 'Hi team, do you have an opening for an individual walk this Saturday morning at 9 AM for Charlie?', status: 'Resolved', reply: 'Booked and confirmed for Saturday 9:00 AM with Alex.' }
  ];

  const DEFAULT_ADMIN_SETTINGS = {
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

  const AdminDataStore = {
    getServices() {
      try {
        const val = localStorage.getItem(STORAGE_KEYS.SERVICES);
        if (val) {
          const services = JSON.parse(val);
          let migrated = false;
          services.forEach(service => {
            if (Number(service.price) > 0 && Number(service.price) < 1000) {
              service.price = Math.round(Number(service.price) * 97 / 50) * 50;
              migrated = true;
            }
          });
          if (migrated) localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
          return services;
        }
      } catch(e) {}
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
      return [...DEFAULT_SERVICES];
    },
    saveServices(srvs) {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(srvs));
      window.dispatchEvent(new CustomEvent('petpals:admin-services-updated'));
    },
    addService(service) {
      const srvs = this.getServices();
      const newService = {
        id: service.id || ('srv-' + Date.now()),
        name: service.name || 'New Care Service',
        category: service.category || 'grooming',
        price: parseFloat(service.price) || 6300,
        duration: service.duration || '60 min',
        specialist: service.specialist || 'Pet Care Specialist',
        active: service.active !== false,
        description: service.description || 'Professional pet care service.'
      };
      srvs.push(newService);
      this.saveServices(srvs);

      // Sync to PostgreSQL backend
      fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService)
      }).catch(err => console.warn('Failed to save service to backend:', err));

      return newService;
    },
    updateService(id, updated) {
      const srvs = this.getServices();
      const idx = srvs.findIndex(s => s.id === id);
      if (idx !== -1) {
        srvs[idx] = { ...srvs[idx], ...updated };
        this.saveServices(srvs);

        // Sync to PostgreSQL backend
        fetch('/api/services/' + encodeURIComponent(id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        }).catch(err => console.warn('Failed to update service in backend:', err));

        return srvs[idx];
      }
      return null;
    },
    deleteService(id) {
      const srvs = this.getServices().filter(s => s.id !== id);
      this.saveServices(srvs);

      // Sync to PostgreSQL backend
      fetch('/api/services/' + encodeURIComponent(id), {
        method: 'DELETE'
      }).catch(err => console.warn('Failed to delete service from backend:', err));

      return srvs;
    },

    getReviews() {
      try {
        const val = localStorage.getItem(STORAGE_KEYS.REVIEWS);
        if (val) return JSON.parse(val);
      } catch(e) {}
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(DEFAULT_REVIEWS));
      return [...DEFAULT_REVIEWS];
    },
    saveReviews(revs) {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(revs));
      window.dispatchEvent(new CustomEvent('petpals:admin-reviews-updated'));
    },
    updateReviewStatus(id, status, featured) {
      const revs = this.getReviews();
      const idx = revs.findIndex(r => r.id === id);
      if (idx !== -1) {
        if (status !== undefined) revs[idx].status = status;
        if (featured !== undefined) revs[idx].featured = featured;
        this.saveReviews(revs);

        // Sync to PostgreSQL backend
        fetch('/api/reviews/' + encodeURIComponent(id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, featured })
        }).catch(err => console.warn('Failed to update review in backend:', err));

        return revs[idx];
      }
      return null;
    },
    deleteReview(id) {
      const revs = this.getReviews().filter(r => r.id !== id);
      this.saveReviews(revs);

      // Sync to PostgreSQL backend
      fetch('/api/reviews/' + encodeURIComponent(id), {
        method: 'DELETE'
      }).catch(err => console.warn('Failed to delete review from backend:', err));

      return revs;
    },

    getMessages() {
      try {
        const val = localStorage.getItem(STORAGE_KEYS.MESSAGES);
        if (val) return JSON.parse(val);
      } catch(e) {}
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(DEFAULT_MESSAGES));
      return [...DEFAULT_MESSAGES];
    },
    saveMessages(msgs) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(msgs));
      window.dispatchEvent(new CustomEvent('petpals:admin-messages-updated'));
    },
    replyToMessage(id, replyText) {
      const msgs = this.getMessages();
      const idx = msgs.findIndex(m => m.id === id);
      if (idx !== -1) {
        msgs[idx].reply = replyText;
        msgs[idx].status = 'Replied';
        msgs[idx].repliedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.saveMessages(msgs);

        // Sync to PostgreSQL backend
        fetch('/api/messages/' + encodeURIComponent(id) + '/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reply: replyText })
        }).catch(err => console.warn('Failed to reply to message in backend:', err));

        return msgs[idx];
      }
      return null;
    },
    updateMessageStatus(id, status) {
      const msgs = this.getMessages();
      const idx = msgs.findIndex(m => m.id === id);
      if (idx !== -1) {
        msgs[idx].status = status;
        this.saveMessages(msgs);
        return msgs[idx];
      }
      return null;
    },

    getSettings() {
      try {
        const val = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (val) return JSON.parse(val);
      } catch(e) {}
      return { ...DEFAULT_ADMIN_SETTINGS };
    },
    saveSettings(sets) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(sets));
      window.dispatchEvent(new CustomEvent('petpals:admin-settings-updated'));

      // Sync to PostgreSQL backend
      fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sets)
      }).catch(err => console.warn('Failed to save settings to backend:', err));
    },

    async syncFromBackend() {
      try {
        const [services, reviews, messages, users, settings, stats, specialists, bookings] = await Promise.all([
          fetch('/api/services?all=true').then(r => r.ok ? r.json() : null),
          fetch('/api/reviews?admin=true').then(r => r.ok ? r.json() : null),
          fetch('/api/messages').then(r => r.ok ? r.json() : null),
          fetch('/api/admin/users').then(r => r.ok ? r.json() : null),
          fetch('/api/admin/settings').then(r => r.ok ? r.json() : null),
          fetch('/api/admin/stats').then(r => r.ok ? r.json() : null),
          fetch('/api/specialists?all=true').then(r => r.ok ? r.json() : null),
          fetch('/api/bookings?admin=true').then(r => r.ok ? r.json() : null)
        ]);

        if (Array.isArray(services)) {
          localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
        }
        if (Array.isArray(reviews)) {
          localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
        }
        if (Array.isArray(messages)) {
          localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
        }
        if (Array.isArray(users)) {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }
        if (Array.isArray(specialists)) localStorage.setItem(STORAGE_KEYS.SPECIALISTS, JSON.stringify(specialists));
        if (Array.isArray(bookings)) this.saveBookings(bookings);
        if (settings && typeof settings === 'object') {
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        }
        if (stats) {
          window.PetPalsAdminStats = stats;
        }
        window.PetPalsAdminSynced = true;
        window.PetPalsAdminSyncFailed = false;
      } catch (err) {
        window.PetPalsAdminSynced = false;
        window.PetPalsAdminSyncFailed = true;
        localStorage.removeItem(STORAGE_KEYS.USERS);
        console.warn('Admin backend sync failed:', err);
      }
    },

    getUsers() {
      try {
        const val = localStorage.getItem(STORAGE_KEYS.USERS);
        if (val) {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch(e) {}

      return [];
    },
    saveUsers(users) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      window.dispatchEvent(new CustomEvent('petpals:admin-users-updated'));
    },
    deleteUser(id) {
      const users = this.getUsers().filter(u => u.id !== id);
      this.saveUsers(users);
      return users;
    },
    getSpecialists() {
      try {
        const records = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIALISTS) || '[]');
        return Array.isArray(records) ? records : [];
      } catch (e) { return []; }
    },
    saveSpecialists(records) {
      localStorage.setItem(STORAGE_KEYS.SPECIALISTS, JSON.stringify(records));
    },
    getBookings() {
      try {
        const records = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) || '[]');
        return Array.isArray(records) ? records : [];
      } catch (e) { return []; }
    },
    saveBookings(records) {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(Array.isArray(records) ? records : []));
    }
  };

  // Helper escape
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  function renderDashboardAnalytics(bookings) {
    const chart = document.getElementById('dashboard-bookings-chart');
    if (chart) {
      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
      const counts = Array(7).fill(0);
      bookings.forEach(booking => {
        if (!booking.date) return;
        const match = String(booking.date).match(/^(\d{4})-(\d{2})-(\d{2})/);
        const date = match
          ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
          : new Date(booking.date);
        if (Number.isNaN(date.getTime())) return;
        const dayOffset = Math.round((date.setHours(0, 0, 0, 0) - weekStart.getTime()) / 86400000);
        if (dayOffset >= 0 && dayOffset < 7) counts[dayOffset] += 1;
      });

      const maxCount = Math.max(...counts);
      const tickStep = Math.max(1, Math.ceil(maxCount / 4));
      const axisMax = tickStep * 4;
      const xPoints = [50, 125, 195, 270, 345, 420, 495];
      const yPoints = counts.map(count => 195 - (count / axisMax) * 175);
      const linePath = xPoints.slice(1).reduce((path, x, index) => {
        const startX = xPoints[index];
        const endY = yPoints[index + 1].toFixed(1);
        const startY = yPoints[index].toFixed(1);
        const controlOffset = (x - startX) / 3;
        return `${path} C ${(startX + controlOffset).toFixed(1)} ${startY}, ${(x - controlOffset).toFixed(1)} ${endY}, ${x} ${endY}`;
      }, `M ${xPoints[0]} ${yPoints[0].toFixed(1)}`);
      const areaPath = `${linePath} L 495 195 L 50 195 Z`;
      chart.querySelector('path[fill="url(#areaGradient)"]')?.setAttribute('d', areaPath);
      chart.querySelector('path[fill="none"]')?.setAttribute('d', linePath);
      chart.querySelectorAll('circle').forEach((point, index) => {
        if (index < xPoints.length) {
          point.setAttribute('cx', xPoints[index]);
          point.setAttribute('cy', yPoints[index].toFixed(1));
        }
      });
      chart.querySelectorAll('g text').forEach((label, index) => {
        if (index < 5) label.textContent = String(axisMax - tickStep * index);
      });
    }

    const legend = document.getElementById('dashboard-service-legend');
    const segments = document.querySelectorAll('.donut-segment');
    if (!legend || !segments.length) return;

    const countsByService = new Map();
    bookings.forEach(booking => {
      const name = String(booking.serviceName || booking.service || 'Other service').trim() || 'Other service';
      countsByService.set(name, (countsByService.get(name) || 0) + 1);
    });
    const sorted = [...countsByService.entries()].sort((a, b) => b[1] - a[1]);
    const topServices = sorted.slice(0, 4);
    const remainder = sorted.slice(4).reduce((sum, [, count]) => sum + count, 0);
    if (remainder) topServices.push(['Other services', remainder]);
    if (!topServices.length) topServices.push(['No bookings yet', 0]);

    const colors = ['#5c3d28', '#8c6246', '#b68d6c', '#d4b89b', '#e8d8c8'];
    const total = bookings.length;
    const circumference = 2 * Math.PI * 58;
    const mixTotal = document.getElementById('dashboard-bookings-mix-total');
    if (mixTotal) mixTotal.textContent = total ? '100%' : '0%';
    let offset = 0;
    segments.forEach((segment, index) => {
      const entry = topServices[index];
      const count = entry ? entry[1] : 0;
      const length = total ? (count / total) * circumference : (index === 0 ? circumference : 0);
      segment.setAttribute('stroke', total ? (colors[index] || colors[colors.length - 1]) : colors[colors.length - 1]);
      segment.setAttribute('stroke-dasharray', `${length.toFixed(2)} ${(circumference - length).toFixed(2)}`);
      segment.setAttribute('stroke-dashoffset', `${-offset.toFixed(2)}`);
      segment.style.display = entry ? '' : 'none';
      offset += length;
    });

    legend.innerHTML = topServices.map(([name, count], index) => `
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-start gap-2 min-w-0">
          <span class="w-3 h-3 mt-0.5 rounded-full shrink-0" style="background-color:${total ? (colors[index] || colors[colors.length - 1]) : colors[colors.length - 1]}"></span>
          <span class="font-medium text-brand-dark">${escapeHtml(name)}</span>
        </div>
        <span class="font-semibold text-brand-muted shrink-0">${total ? Math.round(count / total * 100) : 0}%</span>
      </div>
    `).join('');
  }

  function renderDashboardActivity(bookings) {
    const list = document.getElementById('admin-recent-activity-list');
    if (!list) return;
    if (!window.PetPalsAdminSynced) {
      list.innerHTML = `<p class="text-[11px] text-brand-muted">${window.PetPalsAdminSyncFailed ? 'Recent activity is unavailable.' : 'Loading recent activity…'}</p>`;
      return;
    }
    if (!bookings.length) {
      list.innerHTML = '<p class="text-[11px] text-brand-muted">No recent activity yet.</p>';
      return;
    }

    list.innerHTML = bookings.slice(0, 4).map(booking => {
      const details = [booking.serviceName || booking.service || 'Service', booking.petName || 'No companion'].join(' · ');
      const schedule = [booking.date, booking.time].filter(Boolean).join(' · ') || 'Schedule not set';
      return `
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-status-greenBg text-status-green flex items-center justify-center shrink-0 mt-0.5">
            <svg class="w-4 h-4 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
              <rect height="18" rx="2" ry="2" width="18" x="3" y="4"></rect>
              <line x1="16" x2="16" y1="2" y2="6"></line>
              <line x1="8" x2="8" y1="2" y2="6"></line>
              <line x1="3" x2="21" y1="10" y2="10"></line>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-brand-dark">Booking received</p>
            <p class="text-[11px] text-brand-muted truncate">${escapeHtml(details)}</p>
          </div>
          <span class="text-[10px] text-brand-muted shrink-0">${escapeHtml(schedule)}</span>
        </div>
      `;
    }).join('');
  }

  // Admin Portal UI Manager
  const AdminPortal = {
    currentSection: 'dashboard',

    init() {
      window.PetPalsAdminSynced = false;
      window.PetPalsAdminSyncFailed = false;
      this.initAdminIdentityMenu();
      this.initRouting();
      // Avoid rendering cached directory records before PostgreSQL refresh completes.
      localStorage.removeItem(STORAGE_KEYS.USERS);
      localStorage.removeItem(STORAGE_KEYS.SPECIALISTS);
      this.updateBadges();
      this.renderCurrentSection();

      // Sync latest data from PostgreSQL backend
      AdminDataStore.syncFromBackend().then(() => {
        this.updateBadges();
        this.renderCurrentSection();
      });

      // Listen for updates from other tabs or actions
      window.addEventListener('storage', () => {
        this.updateBadges();
        this.renderCurrentSection();
      });
      window.addEventListener('petpals:bookings-updated', () => {
        this.updateBadges();
        if (this.currentSection === 'bookings' || this.currentSection === 'dashboard') {
          this.renderCurrentSection();
        }
      });
      window.addEventListener('petpals:pets-updated', () => {
        this.updateBadges();
        if (this.currentSection === 'pets' || this.currentSection === 'dashboard') {
          this.renderCurrentSection();
        }
      });
    },

    initAdminIdentityMenu() {
      const toggle = document.getElementById('admin-profile-toggle');
      const menu = document.getElementById('admin-profile-menu');
      const name = document.getElementById('admin-header-name');
      const email = document.getElementById('admin-header-email');
      const avatar = document.getElementById('admin-header-avatar');
      const fallbackAvatar = DEFAULT_PROFILE_AVATAR;
      fetch('/api/admin/me', { credentials: 'same-origin', cache: 'no-store' })
        .then(response => response.ok ? response.json() : null)
        .then(admin => {
          if (!admin) return;
          if (name) name.textContent = 'Admin';
          if (email) email.textContent = admin.email || 'admin@petpalscare.com';
          if (avatar && admin.avatar) {
            avatar.src = admin.avatar;
            avatar.classList.remove('hidden');
            avatar.nextElementSibling?.classList.add('hidden');
          } else if (avatar) {
            avatar.src = fallbackAvatar;
            avatar.classList.add('hidden');
            avatar.nextElementSibling?.classList.remove('hidden');
          }
        })
        .catch(() => {});
      toggle?.addEventListener('click', event => {
        event.stopPropagation();
        const opening = menu?.classList.contains('hidden');
        menu?.classList.toggle('hidden', !opening);
        toggle.setAttribute('aria-expanded', String(Boolean(opening)));
      });
      document.addEventListener('click', event => {
        if (!menu?.contains(event.target) && !toggle?.contains(event.target)) {
          menu?.classList.add('hidden');
          toggle?.setAttribute('aria-expanded', 'false');
        }
      });
      document.getElementById('admin-sign-out')?.addEventListener('click', async () => {
        try { await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' }); } catch (err) {}
        window.location.assign('/');
      });
    },

    initRouting() {
      // Determine initial section from URL pathname or hash
      let initial = 'dashboard';
      const path = window.location.pathname.replace(/^\/admin\/?/, '');
      const hash = window.location.hash.replace(/^#/, '');

      const validSections = ['dashboard', 'bookings', 'users', 'pets', 'services', 'specialists', 'reviews', 'messages', 'reports', 'settings'];
      if (validSections.includes(path)) {
        initial = path;
      } else if (validSections.includes(hash)) {
        initial = hash;
      }

      this.switchSection(initial, false);

      // Handle popstate for browser forward/back
      window.addEventListener('popstate', () => {
        const p = window.location.pathname.replace(/^\/admin\/?/, '');
        const h = window.location.hash.replace(/^#/, '');
        if (validSections.includes(p)) {
          this.switchSection(p, false);
        } else if (validSections.includes(h)) {
          this.switchSection(h, false);
        } else {
          this.switchSection('dashboard', false);
        }
      });

      // Bind all nav links inside aside and header
      document.querySelectorAll('[data-admin-route]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const route = link.getAttribute('data-admin-route');
          this.switchSection(route, true);
        });
      });

      // Bind quick action buttons
      document.querySelectorAll('button').forEach(btn => {
        const text = (btn.textContent || '').trim().toLowerCase();
        if (text.includes('manage users')) {
          btn.addEventListener('click', () => this.switchSection('users', true));
        } else if (text.includes('view all bookings') || text === 'view all') {
          btn.addEventListener('click', (e) => { e.preventDefault(); this.switchSection('bookings', true); });
        } else if (text.includes('add new service')) {
          btn.addEventListener('click', () => this.switchSection('services', true));
        } else if (text.includes('generate report')) {
          btn.addEventListener('click', () => this.switchSection('reports', true));
        } else if (text.includes('view submissions')) {
          btn.addEventListener('click', () => this.switchSection('messages', true));
        }
      });
    },

    switchSection(sectionId, pushHistory = true) {
      const valid = ['dashboard', 'bookings', 'users', 'pets', 'services', 'specialists', 'reviews', 'messages', 'reports', 'settings'];
      if (!valid.includes(sectionId)) sectionId = 'dashboard';
      this.currentSection = sectionId;

      if (pushHistory) {
        history.pushState(null, '', '/admin/' + sectionId);
      }

      // Update sidebar nav highlights
      document.querySelectorAll('[data-admin-route]').forEach(link => {
        const target = link.getAttribute('data-admin-route');
        const isActive = target === sectionId;
        const iconSvg = link.querySelector('svg');

        if (isActive) {
          link.className = 'flex items-center justify-between px-4 py-3 rounded-xl bg-brand-tan/80 text-brand-dark font-medium shadow-sm border border-brand-border transition-colors';
          if (iconSvg) {
            iconSvg.classList.add('text-brand-brown');
            iconSvg.classList.remove('text-brand-muted');
          }
        } else {
          link.className = 'flex items-center justify-between px-4 py-2.5 rounded-xl text-brand-muted hover:text-brand-dark hover:bg-brand-tan/40 transition-colors';
          if (iconSvg) {
            iconSvg.classList.remove('text-brand-brown');
            iconSvg.classList.add('text-brand-muted');
          }
        }
      });

      // Show/hide section containers
      valid.forEach(s => {
        const el = document.getElementById('section-' + s);
        if (el) {
          if (s === sectionId) {
            el.classList.remove('hidden');
          } else {
            el.classList.add('hidden');
          }
        }
      });

      // Toggle Right Sidebar (Recent Activity & Quick Actions)
      // Keep the dashboard side panel for wide screens so the main dashboard cards retain enough room.
      const rightSidebar = document.getElementById('admin-right-sidebar');
      if (rightSidebar) {
        if (sectionId === 'dashboard') {
          rightSidebar.classList.remove('2xl:hidden');
          rightSidebar.classList.add('hidden', '2xl:block');
        } else {
          rightSidebar.classList.add('hidden');
          rightSidebar.classList.remove('2xl:block');
        }
      }

      // Update document title
      const titleMap = {
        dashboard: 'PetPals - Admin Dashboard & Platform Overview',
        bookings: 'PetPals Admin - Manage All Bookings',
        users: 'PetPals Admin - Registered Users Directory',
        pets: 'PetPals Admin - Registered Pets Directory',
        services: 'PetPals Admin - Services Management',
        specialists: 'PetPals Admin - Specialists & Groomers',
        reviews: 'PetPals Admin - Customer Reviews & Moderation',
        messages: 'PetPals Admin - Client Inquiries & Messages',
        reports: 'PetPals Admin - Business & Performance Reports',
        settings: 'PetPals Admin - Platform & Facility Settings'
      };
      document.title = titleMap[sectionId] || 'PetPals Admin';

      this.renderCurrentSection();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    updateBadges() {
      const bookings = AdminDataStore.getBookings();
      const pets = (window.PetPalsStore && window.PetPalsStore.getPets()) || [];
      const users = AdminDataStore.getUsers();
      const messages = AdminDataStore.getMessages();
      const unreadCount = messages.filter(m => m.status === 'Unread').length;

      document.querySelectorAll('#badge-bookings-count').forEach(el => el.textContent = bookings.length);
      document.querySelectorAll('#badge-users-count').forEach(el => el.textContent = users.length);
      document.querySelectorAll('#badge-pets-count').forEach(el => el.textContent = pets.length);
      document.querySelectorAll('#badge-messages-count').forEach(el => el.textContent = unreadCount || '');
    },

    renderCurrentSection() {
      switch(this.currentSection) {
        case 'dashboard':
          this.renderDashboard();
          break;
        case 'bookings':
          this.renderBookings();
          break;
        case 'users':
          this.renderUsers();
          break;
        case 'pets':
          this.renderPets();
          break;
        case 'services':
          this.renderServices();
          break;
        case 'specialists':
          this.renderSpecialists();
          break;
        case 'reviews':
          this.renderReviews();
          break;
        case 'messages':
          this.renderMessages();
          break;
        case 'reports':
          this.renderReports();
          break;
        case 'settings':
          this.renderSettings();
          break;
      }
    },

    // 1. DASHBOARD
    renderDashboard() {
      const bookings = AdminDataStore.getBookings();
      const pets = (window.PetPalsStore && window.PetPalsStore.getPets()) || [];
      const users = AdminDataStore.getUsers();
      const messages = AdminDataStore.getMessages();
      const pendingBookings = bookings.filter(b => b.status === 'Pending').length;
      const unreadMsgs = messages.filter(m => m.status === 'Unread').length;

      const dashboardDate = document.getElementById('dashboard-date-display');
      if (dashboardDate) {
        dashboardDate.textContent = new Intl.DateTimeFormat(undefined, {
          month: 'short', day: 'numeric', year: 'numeric'
        }).format(new Date());
      }
      renderDashboardAnalytics(bookings);
      renderDashboardActivity(bookings);

      // Update KPI numbers
      const elKpiBookings = document.getElementById('kpi-total-bookings');
      if (elKpiBookings) elKpiBookings.textContent = bookings.length;

      const elKpiUsers = document.getElementById('kpi-total-users');
      if (elKpiUsers) elKpiUsers.textContent = users.length;

      const elKpiPets = document.getElementById('kpi-total-pets');
      if (elKpiPets) elKpiPets.textContent = pets.length;

      const elKpiPending = document.getElementById('kpi-pending-count');
      if (elKpiPending) elKpiPending.textContent = pendingBookings + unreadMsgs;

      // Recent bookings in dashboard table
      const tbody = document.getElementById('dashboard-recent-bookings-tbody');
      if (tbody) {
        const recent = bookings.slice(0, 6);
        if (recent.length === 0) {
          tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-brand-muted">No bookings registered yet.</td></tr>`;
        } else {
          tbody.innerHTML = recent.map(b => {
            let statusBadge = '';
            const st = (b.status || 'Confirmed').toLowerCase();
            if (st === 'confirmed' || st === 'upcoming') {
              statusBadge = `<span class="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-status-greenBg text-status-green">Confirmed</span>`;
            } else if (st === 'pending') {
              statusBadge = `<span class="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-status-amberBg text-status-amber">Pending</span>`;
            } else if (st === 'completed') {
              statusBadge = `<span class="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">Completed</span>`;
            } else {
              statusBadge = `<span class="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-status-redBg text-status-red">Cancelled</span>`;
            }

            const ownerName = b.ownerName || b.userName || 'Pet Parent';
            const petDisplay = b.petName
              ? `${escapeHtml(b.petName)} (${escapeHtml(b.petBreed ? b.petBreed.split(' ')[0] : 'Pet')})`
              : 'No companion';
            const dateTime = [b.date || 'Date not set', b.time || 'Time not set'].join(' - ');

            return `
              <tr class="hover:bg-brand-cream/40 transition-colors">
                <td class="py-3.5 px-3 font-medium text-brand-muted">${escapeHtml(b.id)}</td>
                <td class="py-3.5 px-3 font-semibold text-brand-dark">${escapeHtml(b.service)}</td>
                <td class="py-3.5 px-3 text-brand-muted">${petDisplay}</td>
                <td class="py-3.5 px-3">${escapeHtml(ownerName)}</td>
                <td class="py-3.5 px-3 text-brand-muted">${escapeHtml(dateTime)}</td>
                <td class="py-3.5 px-3 text-center">${statusBadge}</td>
                <td class="py-3.5 px-3">
                  <div class="flex items-center justify-center gap-2">
                    <button onclick="AdminPortal.openBookingDetailsModal(decodeURIComponent('${encodeURIComponent(String(b.id || ''))}'))" class="px-3.5 py-1 rounded-lg bg-brand-brown hover:bg-brand-brownHover text-white font-medium text-xs shadow-xs transition-colors">View</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('');
        }
      }
    },

    // 2. BOOKINGS MANAGEMENT
    renderBookings() {
      const container = document.getElementById('bookings-table-container');
      if (!container) return;

      const bookings = AdminDataStore.getBookings();
      const query = (document.getElementById('bookings-search-input')?.value || '').trim().toLowerCase();
      const filterStatus = window._currentBookingsFilter || 'all';

      // Summary counts
      const countAll = bookings.length;
      const countConfirmed = bookings.filter(b => (b.status || '').toLowerCase() === 'confirmed' || (b.status || '').toLowerCase() === 'upcoming').length;
      const countPending = bookings.filter(b => (b.status || '').toLowerCase() === 'pending').length;
      const countCompleted = bookings.filter(b => (b.status || '').toLowerCase() === 'completed').length;
      const countCancelled = bookings.filter(b => (b.status || '').toLowerCase() === 'cancelled').length;

      document.getElementById('bookings-count-all') && (document.getElementById('bookings-count-all').textContent = countAll);
      document.getElementById('bookings-count-confirmed') && (document.getElementById('bookings-count-confirmed').textContent = countConfirmed);
      document.getElementById('bookings-count-pending') && (document.getElementById('bookings-count-pending').textContent = countPending);
      document.getElementById('bookings-count-completed') && (document.getElementById('bookings-count-completed').textContent = countCompleted);
      document.getElementById('bookings-count-cancelled') && (document.getElementById('bookings-count-cancelled').textContent = countCancelled);

      // Filtered items
      let filtered = bookings.filter(b => {
        const st = (b.status || 'Confirmed').toLowerCase();
        if (filterStatus === 'confirmed' && !(st === 'confirmed' || st === 'upcoming')) return false;
        if (filterStatus === 'pending' && st !== 'pending') return false;
        if (filterStatus === 'completed' && st !== 'completed') return false;
        if (filterStatus === 'cancelled' && st !== 'cancelled') return false;

        if (query) {
          const matchId = (b.id || '').toLowerCase().includes(query);
          const matchSrv = (b.service || '').toLowerCase().includes(query);
          const matchPet = (b.petName || '').toLowerCase().includes(query);
          const matchOwner = (b.ownerName || 'Prathiksha').toLowerCase().includes(query);
          return matchId || matchSrv || matchPet || matchOwner;
        }
        return true;
      });

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="p-8 text-center bg-brand-surface rounded-2xl border border-brand-border">
            <svg class="w-12 h-12 text-brand-muted/40 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect height="18" rx="2" ry="2" width="18" x="3" y="4"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line></svg>
            <p class="font-serif font-bold text-base text-brand-dark">No bookings found</p>
            <p class="text-xs text-brand-muted mt-1">Try adjusting your search criteria or filter status.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="overflow-x-auto bg-brand-surface rounded-2xl border border-brand-border shadow-soft">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-brand-border text-brand-muted font-semibold bg-brand-cream/30">
                <th class="py-3 px-4">Booking ID</th>
                <th class="py-3 px-4">Service</th>
                <th class="py-3 px-4">Pet Details</th>
                <th class="py-3 px-4">Client / Owner</th>
                <th class="py-3 px-4">Schedule</th>
                <th class="py-3 px-4">Price</th>
                <th class="py-3 px-4 text-center">Status</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-border/60 text-brand-dark">
              ${filtered.map(b => {
                const st = (b.status || 'Confirmed').toLowerCase();
                let statusBadge = '';
                if (st === 'confirmed' || st === 'upcoming') {
                  statusBadge = `<span class="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-status-greenBg text-status-green">Confirmed</span>`;
                } else if (st === 'pending') {
                  statusBadge = `<span class="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-status-amberBg text-status-amber">Pending</span>`;
                } else if (st === 'completed') {
                  statusBadge = `<span class="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">Completed</span>`;
                } else {
                  statusBadge = `<span class="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-status-redBg text-status-red">Cancelled</span>`;
                }

                return `
                  <tr class="hover:bg-brand-cream/30 transition-colors">
                    <td class="py-4 px-4 font-mono font-medium text-brand-brown">${escapeHtml(b.id)}</td>
                    <td class="py-4 px-4">
                      <div class="font-semibold text-brand-dark">${escapeHtml(b.service)}</div>
                      <div class="text-[11px] text-brand-muted">${escapeHtml(b.duration || '60 min')} • ${escapeHtml(b.specialist || b.provider || 'Any Master Groomer')}</div>
                    </td>
                    <td class="py-4 px-4">
                      <div class="font-medium text-brand-dark flex items-center gap-1.5">
                        ${b.petName ? '<span class="w-2 h-2 rounded-full bg-brand-brown"></span>' : ''}
                        ${escapeHtml(b.petName || 'No companion')}
                      </div>
                      ${b.petName && b.petBreed ? `<div class="text-[11px] text-brand-muted pl-3.5">${escapeHtml(b.petBreed)}</div>` : ''}
                    </td>
                    <td class="py-4 px-4">
                      <div class="font-medium text-brand-dark">${escapeHtml(b.ownerName || b.userName || 'Pet Parent')}</div>
                      <div class="text-[11px] text-brand-muted">${escapeHtml(b.userPhone || 'No phone on file')}</div>
                    </td>
                    <td class="py-4 px-4">
                      <div class="font-medium text-brand-dark">${escapeHtml(b.date || 'Date not set')}</div>
                      <div class="text-[11px] text-brand-muted">${escapeHtml(b.time || 'Time not set')}</div>
                    </td>
                    <td class="py-4 px-4 font-semibold text-brand-dark">${escapeHtml(b.servicePrice || (Number(b.totalAmount) ? `₹${Number(b.totalAmount).toLocaleString('en-IN')}` : '—'))}</td>
                    <td class="py-4 px-4 text-center">${statusBadge}</td>
                    <td class="py-4 px-4 text-right">
                      <div class="inline-flex items-center gap-1.5 justify-end">
                        <select onchange="AdminPortal.changeBookingStatus(decodeURIComponent('${encodeURIComponent(String(b.id || ''))}'), this.value)" class="text-[11px] py-1 pl-2 pr-6 rounded-lg bg-brand-cream border border-brand-border text-brand-dark font-medium focus:ring-1 focus:ring-brand-brown cursor-pointer">
                          <option value="Confirmed" ${st === 'confirmed' || st === 'upcoming' ? 'selected' : ''}>Confirmed</option>
                          <option value="Pending" ${st === 'pending' ? 'selected' : ''}>Pending</option>
                          <option value="Completed" ${st === 'completed' ? 'selected' : ''}>Completed</option>
                          <option value="Cancelled" ${st === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                        <button onclick="AdminPortal.openBookingDetailsModal(decodeURIComponent('${encodeURIComponent(String(b.id || ''))}'))" class="px-2.5 py-1 rounded-lg bg-brand-brown hover:bg-brand-brownHover text-white font-medium text-xs transition-colors">
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    },

    async changeBookingStatus(id, newStatus) {
      try {
        const response = await fetch('/api/bookings/' + encodeURIComponent(id) + '/status', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus })
        });
        const updated = await response.json();
        if (!response.ok) throw new Error(updated.error || 'Unable to update booking');
        AdminDataStore.saveBookings(AdminDataStore.getBookings().map(booking => booking.id === id ? { ...booking, ...updated, ownerName: booking.ownerName, petBreed: booking.petBreed } : booking));
        this.renderBookings();
        this.updateBadges();
        this.showToast(`Booking ${id} marked as ${newStatus}`);
      } catch (error) { this.showToast(error.message || 'Unable to update booking.'); }
    },

    openBookingDetailsModal(id) {
      const bookings = AdminDataStore.getBookings();
      const booking = bookings.find(b => b.id === id);
      if (!booking) return;

      const modalEl = document.getElementById('admin-modal-container');
      if (!modalEl) return;

      modalEl.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div class="bg-brand-surface rounded-2xl max-w-lg w-full border border-brand-border shadow-2xl p-6 relative animate-in fade-in zoom-in duration-150">
            <button onclick="document.getElementById('admin-modal-container').innerHTML=''" class="absolute top-4 right-4 text-brand-muted hover:text-brand-dark p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="flex items-center gap-2 mb-4">
              <span class="w-2.5 h-2.5 rounded-full bg-brand-brown"></span>
              <span class="font-mono text-xs font-semibold text-brand-brown uppercase tracking-wider">${escapeHtml(booking.id)}</span>
            </div>
            <h3 class="font-serif font-bold text-xl text-brand-dark mb-1">${escapeHtml(booking.service)}</h3>
            <p class="text-xs text-brand-muted mb-4">${escapeHtml(booking.location || 'Location not specified')}</p>

            <div class="space-y-3 bg-brand-cream/50 p-4 rounded-xl border border-brand-border text-xs mb-5">
              <div class="flex justify-between py-1 border-b border-brand-border/60">
                <span class="text-brand-muted">Pet Name & Breed:</span>
                <span class="font-semibold text-brand-dark">${booking.petName ? `${escapeHtml(booking.petName)}${booking.petBreed ? ` (${escapeHtml(booking.petBreed)})` : ''}` : 'No companion'}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-brand-border/60">
                <span class="text-brand-muted">Owner / Pet Parent:</span>
                <span class="font-semibold text-brand-dark">${escapeHtml(booking.ownerName || booking.userName || 'Pet Parent')} (${escapeHtml(booking.userPhone || 'No phone on file')})</span>
              </div>
              <div class="flex justify-between py-1 border-b border-brand-border/60">
                <span class="text-brand-muted">Date & Time:</span>
                <span class="font-semibold text-brand-dark">${escapeHtml(booking.date || 'Date not set')} at ${escapeHtml(booking.time || 'Time not set')}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-brand-border/60">
                <span class="text-brand-muted">Specialist:</span>
                <span class="font-semibold text-brand-dark">${escapeHtml(booking.specialist || booking.provider || 'Any Master Groomer')}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-brand-border/60">
                <span class="text-brand-muted">Price:</span>
                <span class="font-bold text-brand-brown text-sm">${escapeHtml(booking.servicePrice || (Number(booking.totalAmount) ? `₹${Number(booking.totalAmount).toLocaleString('en-IN')}` : '—'))}</span>
              </div>
              <div class="flex justify-between py-1">
                <span class="text-brand-muted">Current Status:</span>
                <span class="font-semibold text-brand-dark">${escapeHtml(booking.status || 'Confirmed')}</span>
              </div>
            </div>

            ${booking.notes ? `
              <div class="mb-5 text-xs bg-amber-50/70 border border-amber-200/60 p-3 rounded-xl">
                <span class="font-semibold text-amber-900 block mb-1">Client Special Instructions:</span>
                <p class="text-amber-800">${escapeHtml(booking.notes)}</p>
              </div>
            ` : ''}

            <div class="flex items-center justify-between gap-3 pt-2">
              <div class="flex gap-2">
                <button onclick="AdminPortal.changeBookingStatus('${booking.id}', 'Confirmed'); document.getElementById('admin-modal-container').innerHTML=''" class="px-3.5 py-2 rounded-xl bg-status-greenBg hover:bg-emerald-100 text-status-green font-semibold text-xs transition-colors">
                  Confirm
                </button>
                <button onclick="AdminPortal.changeBookingStatus('${booking.id}', 'Completed'); document.getElementById('admin-modal-container').innerHTML=''" class="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors">
                  Complete
                </button>
                <button onclick="AdminPortal.changeBookingStatus('${booking.id}', 'Cancelled'); document.getElementById('admin-modal-container').innerHTML=''" class="px-3.5 py-2 rounded-xl bg-status-redBg hover:bg-red-100 text-status-red font-semibold text-xs transition-colors">
                  Cancel
                </button>
              </div>
              <button onclick="document.getElementById('admin-modal-container').innerHTML=''" class="px-4 py-2 rounded-xl bg-brand-tan/60 hover:bg-brand-tan text-brand-dark font-medium text-xs transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      `;
    },

    // 3. USERS MANAGEMENT
    renderUsers() {
      const container = document.getElementById('users-table-container');
      if (!container) return;

      const users = AdminDataStore.getUsers();
      const query = (document.getElementById('users-search-input')?.value || '').trim().toLowerCase();

      let filtered = users.filter(u => {
        if (!query) return true;
        return (u.name || '').toLowerCase().includes(query) ||
               (u.email || '').toLowerCase().includes(query) ||
               (u.phone || '').toLowerCase().includes(query) ||
               (u.location || '').toLowerCase().includes(query);
      });

      container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          ${filtered.map(u => `
            <div class="bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-soft flex flex-col justify-between hover:border-brand-brown/40 transition-all">
              <div>
                <div class="flex items-start justify-between gap-3 mb-4">
                  <div class="flex items-center gap-3">
                    <img src="${escapeHtml(u.avatar || DEFAULT_PROFILE_AVATAR)}" onerror="this.onerror=null;this.src='${DEFAULT_PROFILE_AVATAR}'" class="w-12 h-12 rounded-full object-cover border border-brand-border shadow-xs" alt="${escapeHtml(u.name)}">
                    <div>
                      <h4 class="font-serif font-bold text-base text-brand-dark leading-tight">${escapeHtml(u.name)}</h4>
                      <p class="text-[11px] text-brand-muted mt-0.5">${escapeHtml(u.location)}</p>
                    </div>
                  </div>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-status-greenBg text-status-green">Active</span>
                </div>

                <div class="space-y-1.5 text-xs text-brand-muted border-t border-brand-border/60 pt-3">
                  <div class="flex items-center gap-2">
                    <svg class="w-3.5 h-3.5 text-brand-brown shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    <span class="truncate">${escapeHtml(u.email)}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <svg class="w-3.5 h-3.5 text-brand-brown shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    <span>${escapeHtml(u.phone)}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <svg class="w-3.5 h-3.5 text-brand-brown shrink-0 fill-current" viewBox="0 0 24 24"><circle cx="8" cy="6" r="2.2"></circle><circle cx="16" cy="6" r="2.2"></circle><circle cx="4" cy="11.5" r="2"></circle><circle cx="20" cy="11.5" r="2"></circle><ellipse cx="12" cy="17" rx="5" ry="4"></ellipse></svg>
                    <span>Pets: <strong class="text-brand-dark">${escapeHtml(u.petsList || 'None')}</strong></span>
                  </div>
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-brand-border/60 flex items-center justify-between">
                <span class="text-[11px] text-brand-muted">Bookings: <strong class="text-brand-dark">${u.bookingsCount}</strong></span>
                <div class="flex items-center gap-1.5">
                  <button onclick="AdminPortal.openUserDetailsModal('${u.id}')" class="px-3 py-1 rounded-lg bg-brand-tan/70 hover:bg-brand-tan text-brand-dark font-medium text-xs transition-colors">
                    View Profile
                  </button>
                  <button onclick="AdminPortal.confirmDeleteUser('${u.id}', '${escapeHtml(u.name).replace(/'/g, "\\'")}')" class="p-1.5 rounded-lg text-brand-muted hover:text-status-red hover:bg-status-redBg border border-transparent hover:border-red-200 transition-colors" title="Delete User">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    },

    confirmDeleteUser(userId, userName) {
      const modalEl = document.getElementById('admin-modal-container');
      if (!modalEl) {
        if (confirm(`Are you sure you want to delete ${userName}?`)) {
          this.executeDeleteUser(userId, userName);
        }
        return;
      }

      modalEl.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div class="bg-brand-surface rounded-2xl max-w-sm w-full border border-brand-border shadow-2xl p-6 relative animate-in fade-in zoom-in duration-150 text-center">
            <button onclick="document.getElementById('admin-modal-container').innerHTML=''" class="absolute top-4 right-4 text-brand-muted hover:text-brand-dark p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="w-12 h-12 rounded-full bg-status-redBg text-status-red flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3 class="font-serif font-bold text-lg text-brand-dark mb-1">Delete User Account?</h3>
            <p class="text-xs text-brand-muted mb-5 leading-relaxed">
              Are you sure you want to delete <strong>${escapeHtml(userName)}</strong>?<br/>
              <span class="text-[11px] text-brand-muted mt-1 block">This action will remove the user from the registered users directory.</span>
            </p>
            <div class="flex items-center justify-center gap-3">
              <button type="button" onclick="document.getElementById('admin-modal-container').innerHTML=''" class="px-5 py-2.5 rounded-xl bg-brand-tan/60 hover:bg-brand-tan text-brand-dark font-medium text-xs transition-colors">
                No, Keep User
              </button>
              <button type="button" onclick="AdminPortal.executeDeleteUser('${userId}', '${escapeHtml(userName).replace(/'/g, "\\'")}')" class="px-5 py-2.5 rounded-xl bg-status-red hover:bg-red-700 text-white font-semibold text-xs shadow-sm transition-colors">
                Yes, Delete User
              </button>
            </div>
          </div>
        </div>
      `;
    },

    executeDeleteUser(userId, userName) {
      document.getElementById('admin-modal-container').innerHTML = '';
      AdminDataStore.deleteUser(userId);
      this.renderUsers();
      this.updateBadges();
      this.renderDashboard();
      this.renderReports();
      this.showToast(`User "${userName}" deleted successfully.`);
    },

    openUserDetailsModal(userId) {
      const users = AdminDataStore.getUsers();
      const u = users.find(x => x.id === userId) || users[0];
      const pets = (window.PetPalsStore && window.PetPalsStore.getPets()) || [];
      const bookings = AdminDataStore.getBookings();

      const modalEl = document.getElementById('admin-modal-container');
      if (!modalEl) return;

      modalEl.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div class="bg-brand-surface rounded-2xl max-w-lg w-full border border-brand-border shadow-2xl p-6 relative animate-in fade-in zoom-in duration-150">
            <button onclick="document.getElementById('admin-modal-container').innerHTML=''" class="absolute top-4 right-4 text-brand-muted hover:text-brand-dark p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="flex items-center gap-4 mb-4">
              <img src="${escapeHtml(u.avatar || DEFAULT_PROFILE_AVATAR)}" onerror="this.onerror=null;this.src='${DEFAULT_PROFILE_AVATAR}'" class="w-14 h-14 rounded-full object-cover border-2 border-brand-border shadow-sm" alt="${escapeHtml(u.name)}">
              <div>
                <h3 class="font-serif font-bold text-xl text-brand-dark">${escapeHtml(u.name)}</h3>
                <p class="text-xs text-brand-muted">${escapeHtml(u.email)} • Joined ${escapeHtml(u.joined)}</p>
                <p class="text-xs text-brand-brown font-medium mt-0.5">${escapeHtml(u.phone)} • ${escapeHtml(u.location)}</p>
              </div>
            </div>

            <h4 class="font-serif font-bold text-sm text-brand-dark mb-2 mt-4">Registered Companions (${pets.length})</h4>
            <div class="space-y-2 mb-4">
              ${pets.map(p => `
                <div class="flex items-center justify-between p-2.5 rounded-xl bg-brand-cream/60 border border-brand-border text-xs">
                  <div class="flex items-center gap-2.5">
                    <img src="${p.avatar || p.photo}" class="w-8 h-8 rounded-full object-cover">
                    <div>
                      <span class="font-bold text-brand-dark">${escapeHtml(p.name)}</span>
                      <span class="text-brand-muted text-[11px] block">${escapeHtml(p.species)} • ${escapeHtml(p.breed)} • ${escapeHtml(p.age)}</span>
                    </div>
                  </div>
                  <span class="text-[11px] font-mono text-brand-muted">Chip: ${escapeHtml(p.microchip || 'N/A')}</span>
                </div>
              `).join('')}
            </div>

            <h4 class="font-serif font-bold text-sm text-brand-dark mb-2">Recent Booking History</h4>
            <div class="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs mb-5">
              ${bookings.slice(0, 3).map(b => `
                <div class="flex items-center justify-between py-1.5 border-b border-brand-border/60">
                  <div>
                    <span class="font-medium text-brand-dark">${escapeHtml(b.service)}</span>
                    <span class="text-[11px] text-brand-muted block">${escapeHtml(b.date)} • ${escapeHtml(b.petName)}</span>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-tan/80 text-brand-brown">${escapeHtml(b.status)}</span>
                </div>
              `).join('')}
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-brand-border/60">
              <button onclick="document.getElementById('admin-modal-container').innerHTML=''; AdminPortal.confirmDeleteUser('${u.id}', '${escapeHtml(u.name).replace(/'/g, "\\'")}')" class="px-3.5 py-2 rounded-xl text-status-red hover:bg-status-redBg font-semibold text-xs transition-colors flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Delete Account
              </button>
              <button onclick="document.getElementById('admin-modal-container').innerHTML=''" class="px-5 py-2 rounded-xl bg-brand-brown hover:bg-brand-brownHover text-white font-medium text-xs transition-colors">
                Done
              </button>
            </div>
          </div>
        </div>
      `;
    },

    // 4. PETS MANAGEMENT
    renderPets() {
      const container = document.getElementById('pets-grid-container');
      if (!container) return;

      const pets = (window.PetPalsStore && window.PetPalsStore.getPets()) || [];
      const filterSpecies = window._currentPetsFilter || 'all';
      const query = (document.getElementById('pets-search-input')?.value || '').trim().toLowerCase();

      let filtered = pets.filter(p => {
        if (filterSpecies !== 'all') {
          if (filterSpecies === 'dogs' && (p.species || '').toLowerCase() !== 'dog') return false;
          if (filterSpecies === 'cats' && (p.species || '').toLowerCase() !== 'cat') return false;
          if (filterSpecies === 'other' && ((p.species || '').toLowerCase() === 'dog' || (p.species || '').toLowerCase() === 'cat')) return false;
        }
        if (query) {
          return (p.name || '').toLowerCase().includes(query) ||
                 (p.breed || '').toLowerCase().includes(query) ||
                 (p.species || '').toLowerCase().includes(query) ||
                 (p.microchip || '').toLowerCase().includes(query);
        }
        return true;
      });

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="col-span-full p-8 text-center bg-brand-surface rounded-2xl border border-brand-border">
            <p class="font-serif font-bold text-base text-brand-dark">No pets matched your filter</p>
          </div>
        `;
        return;
      }

      container.innerHTML = filtered.map(p => {
        const photo = p.avatar || p.photo || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80';
        return `
          <div class="bg-brand-surface rounded-2xl border border-brand-border shadow-soft overflow-hidden flex flex-col justify-between hover:shadow-card transition-all">
            <div>
              <div class="relative h-44 w-full bg-brand-cream overflow-hidden">
                <img src="${photo}" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105" alt="${escapeHtml(p.name)}">
                <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-surface/90 backdrop-blur-xs text-brand-dark shadow-xs border border-brand-border">
                  ${escapeHtml(p.species)}
                </span>
                <span class="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-status-greenBg text-status-green shadow-xs">
                  ${escapeHtml(p.status || 'Active')}
                </span>
              </div>
              <div class="p-5">
                <div class="flex items-center justify-between mb-1">
                  <h3 class="font-serif font-bold text-lg text-brand-dark">${escapeHtml(p.name)}</h3>
                  <span class="text-xs text-brand-muted font-medium">${escapeHtml(p.age || '2 years')}</span>
                </div>
                <p class="text-xs text-brand-muted font-medium mb-3">${escapeHtml(p.breed || 'Companion')}</p>

                <div class="grid grid-cols-2 gap-2 text-[11px] bg-brand-cream/50 p-2.5 rounded-xl border border-brand-border/60 mb-3">
                  <div>
                    <span class="text-brand-muted block text-[10px] uppercase font-semibold">Weight</span>
                    <span class="font-medium text-brand-dark">${escapeHtml(p.weight || '30 kg')}</span>
                  </div>
                  <div>
                    <span class="text-brand-muted block text-[10px] uppercase font-semibold">Gender</span>
                    <span class="font-medium text-brand-dark truncate">${escapeHtml(p.gender || 'Neutered')}</span>
                  </div>
                </div>

                <div class="text-[11px] text-brand-muted mb-2">
                  <span class="font-semibold text-brand-dark block text-[10px] uppercase tracking-wider">Health & Care Notes:</span>
                  <p class="line-clamp-2 mt-0.5">${escapeHtml(p.notes || p.note || 'Regular wellness checks up to date.')}</p>
                </div>
              </div>
            </div>

            <div class="p-5 pt-0 border-t border-brand-border/60 flex items-center justify-between">
              <span class="text-[10px] font-mono text-brand-muted truncate max-w-[140px]">ID: ${escapeHtml(p.microchip || p.id)}</span>
              <button onclick="AdminPortal.openPetDossierModal('${p.id}')" class="px-3.5 py-1.5 rounded-xl bg-brand-brown hover:bg-brand-brownHover text-white font-medium text-xs transition-colors">
                View Dossier
              </button>
            </div>
          </div>
        `;
      }).join('');
    },

    openPetDossierModal(petId) {
      const pets = (window.PetPalsStore && window.PetPalsStore.getPets()) || [];
      const p = pets.find(x => x.id === petId);
      if (!p) return;

      const modalEl = document.getElementById('admin-modal-container');
      if (!modalEl) return;

      modalEl.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div class="bg-brand-surface rounded-2xl max-w-lg w-full border border-brand-border shadow-2xl p-6 relative animate-in fade-in zoom-in duration-150">
            <button onclick="document.getElementById('admin-modal-container').innerHTML=''" class="absolute top-4 right-4 text-brand-muted hover:text-brand-dark p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="flex items-center gap-4 mb-4">
              <img src="${p.avatar || p.photo}" class="w-16 h-16 rounded-2xl object-cover border border-brand-border shadow-sm">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-serif font-bold text-xl text-brand-dark">${escapeHtml(p.name)}</h3>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-status-greenBg text-status-green">${escapeHtml(p.status || 'Active')}</span>
                </div>
                <p class="text-xs text-brand-muted mt-0.5">${escapeHtml(p.species)} • ${escapeHtml(p.breed)} • ${escapeHtml(p.age)}</p>
                <p class="text-xs text-brand-brown font-mono mt-0.5">Microchip: ${escapeHtml(p.microchip || '985 141 002 381')}</p>
              </div>
            </div>

            <div class="space-y-3 bg-brand-cream/60 p-4 rounded-xl border border-brand-border text-xs mb-4">
              <div class="flex justify-between py-1 border-b border-brand-border/60">
                <span class="text-brand-muted">Weight & Vitals:</span>
                <span class="font-semibold text-brand-dark">${escapeHtml(p.weight || '31.0 kg')} (Healthy BCS)</span>
              </div>
              <div class="flex justify-between py-1 border-b border-brand-border/60">
                <span class="text-brand-muted">Sex / Status:</span>
                <span class="font-semibold text-brand-dark">${escapeHtml(p.gender || 'Male (Neutered)')}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-brand-border/60">
                <span class="text-brand-muted">Registered Pet Parent:</span>
                <span class="font-semibold text-brand-dark">Prathiksha Shetty (+91 98765 43210)</span>
              </div>
              <div class="flex justify-between py-1">
                <span class="text-brand-muted">Vaccination Records:</span>
                <span class="font-semibold text-status-green">DHPP & Rabies Current</span>
              </div>
            </div>

            <div class="text-xs mb-5">
              <span class="font-semibold text-brand-dark block mb-1">Dietary & Sensitive Care Instructions:</span>
              <div class="p-3 rounded-xl bg-brand-card border border-brand-border text-brand-dark leading-relaxed">
                ${escapeHtml(p.notes || p.note || 'Salmon & sweet potato kibble twice daily. Sensitive to loud air blowers.')}
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button onclick="document.getElementById('admin-modal-container').innerHTML=''" class="px-5 py-2 rounded-xl bg-brand-brown hover:bg-brand-brownHover text-white font-medium text-xs transition-colors">
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      `;
    },

    renderSpecialists() {
      const container = document.getElementById('specialists-grid-container');
      if (!container) return;
      const specialists = AdminDataStore.getSpecialists();
      container.innerHTML = specialists.length ? specialists.map(s => `
        <article class="bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-soft flex flex-col justify-between">
          <div class="flex items-start gap-3">
            ${s.photo ? `<img src="${escapeHtml(s.photo)}" alt="${escapeHtml(s.name)}" class="w-14 h-14 rounded-full object-cover border border-brand-border">` : `<div class="w-14 h-14 rounded-full bg-brand-tan text-brand-brown flex items-center justify-center font-serif font-bold text-lg">${escapeHtml((s.name || '?').slice(0, 1).toUpperCase())}</div>`}
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2"><h3 class="font-serif font-bold text-lg text-brand-dark">${escapeHtml(s.name)}</h3><span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.active ? 'bg-emerald-50 text-emerald-700' : 'bg-brand-tan text-brand-muted'}">${s.active ? 'Active' : 'Disabled'}</span></div>
              <p class="text-xs text-brand-muted">${escapeHtml(s.specialization)}</p>
              <p class="text-xs text-brand-brown mt-2">★ ${Number(s.rating || 0).toFixed(1)} · ${Number(s.sessions || 0).toLocaleString('en-IN')} sessions</p>
              <p class="text-xs text-brand-muted mt-1">${escapeHtml(s.availability || 'Availability to be confirmed')}</p>
            </div>
          </div>
          <div class="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-brand-border">
            <button onclick="AdminPortal.openSpecialistModal('${escapeHtml(s.id)}')" class="px-3 py-1.5 rounded-lg bg-brand-tan/70 hover:bg-brand-tan text-brand-dark font-medium text-xs">Edit</button>
            <button onclick="AdminPortal.toggleSpecialist('${escapeHtml(s.id)}', ${!s.active})" class="px-3 py-1.5 rounded-lg bg-brand-cream hover:bg-brand-tan/50 text-brand-dark font-medium text-xs">${s.active ? 'Disable' : 'Enable'}</button>
            <button onclick="AdminPortal.deleteSpecialist('${escapeHtml(s.id)}')" class="px-3 py-1.5 rounded-lg text-status-red hover:bg-status-redBg font-medium text-xs">Delete</button>
          </div>
        </article>`).join('') : '<div class="col-span-full bg-brand-surface p-8 rounded-2xl border border-brand-border text-center text-sm text-brand-muted">No specialists have been added yet.</div>';
    },

    openSpecialistModal(id) {
      const specialist = id ? AdminDataStore.getSpecialists().find(s => s.id === id) : null;
      if (id && !specialist) return;
      const modal = document.getElementById('admin-modal-container');
      if (!modal) return;
      const s = specialist || { name: '', specialization: '', rating: 5, sessions: 0, availability: '', active: true, photo: '' };
      modal.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"><div class="bg-brand-surface rounded-2xl max-w-lg w-full border border-brand-border shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
          <button onclick="document.getElementById('admin-modal-container').innerHTML=''" class="absolute top-4 right-4 text-brand-muted hover:text-brand-dark p-1">✕</button>
          <h3 class="font-serif font-bold text-xl text-brand-dark mb-1">${id ? 'Edit Specialist' : 'Add Specialist / Groomer'}</h3><p class="text-xs text-brand-muted mb-4">Set the profile and availability shown during booking.</p>
          <form id="specialist-form" class="space-y-3 text-xs" onsubmit="event.preventDefault(); AdminPortal.submitSpecialist('${id ? escapeHtml(id) : ''}')">
            <div><label class="block font-semibold text-brand-dark mb-1">Name</label><input id="specialist-name" required value="${escapeHtml(s.name)}" class="w-full px-3 py-2 rounded-xl bg-brand-cream border border-brand-border outline-none"></div>
            <div><label class="block font-semibold text-brand-dark mb-1">Specialization / Service Type</label><input id="specialist-specialization" required value="${escapeHtml(s.specialization)}" placeholder="Grooming & Spa" class="w-full px-3 py-2 rounded-xl bg-brand-cream border border-brand-border outline-none"></div>
            <div class="grid grid-cols-2 gap-3"><div><label class="block font-semibold text-brand-dark mb-1">Rating</label><input id="specialist-rating" type="number" min="0" max="5" step="0.1" value="${Number(s.rating)}" required class="w-full px-3 py-2 rounded-xl bg-brand-cream border border-brand-border outline-none"></div><div><label class="block font-semibold text-brand-dark mb-1">Sessions</label><input id="specialist-sessions" type="number" min="0" step="1" value="${Number(s.sessions)}" required class="w-full px-3 py-2 rounded-xl bg-brand-cream border border-brand-border outline-none"></div></div>
            <div><label class="block font-semibold text-brand-dark mb-1">Availability</label><input id="specialist-availability" value="${escapeHtml(s.availability)}" placeholder="Weekdays, 9 AM – 5 PM" class="w-full px-3 py-2 rounded-xl bg-brand-cream border border-brand-border outline-none"></div>
            <div><label class="block font-semibold text-brand-dark mb-1">Profile Photo</label><input id="specialist-photo-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="w-full text-xs"><input id="specialist-photo" type="hidden" value="${escapeHtml(s.photo || '')}"><img id="specialist-photo-preview" src="${escapeHtml(s.photo || DEFAULT_PROFILE_AVATAR)}" class="w-14 h-14 rounded-full object-cover mt-2"></div>
            <label class="flex items-center gap-2"><input id="specialist-active" type="checkbox" ${s.active ? 'checked' : ''}> Active and available for booking</label>
            <div class="flex justify-end gap-2 pt-3"><button type="button" onclick="document.getElementById('admin-modal-container').innerHTML=''" class="px-4 py-2 rounded-xl bg-brand-tan/60 text-brand-dark font-medium">Cancel</button><button type="submit" class="px-5 py-2 rounded-xl bg-brand-brown hover:bg-brand-brownHover text-white font-semibold">Save Specialist</button></div>
          </form>
        </div></div>`;
      document.getElementById('specialist-photo-file').addEventListener('change', event => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { this.showToast('Choose an image smaller than 5 MB.'); event.target.value = ''; return; }
        const reader = new FileReader();
        reader.onload = () => { document.getElementById('specialist-photo').value = reader.result; document.getElementById('specialist-photo-preview').src = reader.result; };
        reader.readAsDataURL(file);
      });
    },

    async submitSpecialist(id) {
      const payload = {
        name: document.getElementById('specialist-name').value.trim(),
        specialization: document.getElementById('specialist-specialization').value.trim(),
        rating: Number(document.getElementById('specialist-rating').value),
        sessions: Number(document.getElementById('specialist-sessions').value),
        availability: document.getElementById('specialist-availability').value.trim(),
        photo: document.getElementById('specialist-photo').value || null,
        active: document.getElementById('specialist-active').checked
      };
      try {
        const response = await fetch(id ? '/api/specialists/' + encodeURIComponent(id) : '/api/specialists', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to save specialist');
        const list = AdminDataStore.getSpecialists();
        const index = list.findIndex(s => s.id === result.id);
        if (index < 0) list.push(result); else list[index] = result;
        AdminDataStore.saveSpecialists(list);
        document.getElementById('admin-modal-container').innerHTML = '';
        this.renderSpecialists();
        this.showToast('Specialist saved successfully.');
      } catch (error) { this.showToast(error.message || 'Unable to save specialist.'); }
    },

    async toggleSpecialist(id, active) {
      const current = AdminDataStore.getSpecialists().find(s => s.id === id);
      if (!current) return;
      try {
        const response = await fetch('/api/specialists/' + encodeURIComponent(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to update specialist');
        AdminDataStore.saveSpecialists(AdminDataStore.getSpecialists().map(s => s.id === id ? result : s));
        this.renderSpecialists();
      } catch (error) { this.showToast(error.message || 'Unable to update specialist.'); }
    },

    async deleteSpecialist(id) {
      if (!confirm('Delete this specialist? Existing bookings will keep their saved specialist details.')) return;
      try {
        const response = await fetch('/api/specialists/' + encodeURIComponent(id), { method: 'DELETE' });
        if (!response.ok) throw new Error('Unable to delete specialist');
        AdminDataStore.saveSpecialists(AdminDataStore.getSpecialists().filter(s => s.id !== id));
        this.renderSpecialists();
        this.showToast('Specialist deleted.');
      } catch (error) { this.showToast(error.message || 'Unable to delete specialist.'); }
    },

    // 5. SERVICES MANAGEMENT
    renderServices() {
      const container = document.getElementById('services-grid-container');
      if (!container) return;

      const services = AdminDataStore.getServices();
      const filterCategory = window._currentServicesFilter || 'all';

      let filtered = services.filter(s => {
        if (filterCategory !== 'all' && (s.category || '').toLowerCase() !== filterCategory) return false;
        return true;
      });

      container.innerHTML = filtered.map(s => `
        <div class="bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-soft flex flex-col justify-between hover:border-brand-brown/40 transition-all">
          <div>
            <div class="flex items-start justify-between gap-3 mb-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${s.category === 'medical' ? 'bg-blue-50 text-blue-700' : s.category === 'grooming' ? 'bg-amber-50 text-amber-800' : 'bg-brand-tan/70 text-brand-brown'}">
                ${escapeHtml(s.category)}
              </span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" onchange="AdminPortal.toggleServiceActive('${s.id}', this.checked)" ${s.active ? 'checked' : ''} class="sr-only peer">
                <div class="w-8 h-4 bg-brand-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-brown"></div>
              </label>
            </div>
            <h4 class="font-serif font-bold text-base text-brand-dark mb-1">${escapeHtml(s.name)}</h4>
            <p class="text-xs text-brand-muted line-clamp-2 mb-3">${escapeHtml(s.description)}</p>
          </div>

          <div>
            <div class="flex items-center justify-between text-xs py-2 border-t border-brand-border/60 mb-3">
              <span class="text-brand-muted">Specialist: <strong>${escapeHtml(s.specialist)}</strong></span>
              <span class="text-brand-muted font-medium">${escapeHtml(s.duration)}</span>
            </div>
            <div class="flex items-center justify-between pt-1">
              <span class="text-xl font-bold font-serif text-brand-brown">₹${Number(s.price).toLocaleString('en-IN')}</span>
              <div class="flex items-center gap-1.5">
                <button onclick="AdminPortal.openEditServiceModal('${s.id}')" class="px-3 py-1 rounded-lg bg-brand-tan/70 hover:bg-brand-tan text-brand-dark font-medium text-xs transition-colors">Edit</button>
                <button onclick="AdminPortal.deleteService('${s.id}')" class="p-1 rounded-lg text-brand-muted hover:text-status-red transition-colors" title="Delete Service">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      `).join('');
    },

    toggleServiceActive(id, isActive) {
      AdminDataStore.updateService(id, { active: isActive });
      this.showToast(`Service ${isActive ? 'activated' : 'paused'}`);
    },

    deleteService(id) {
      if (confirm('Are you sure you want to remove this service from PetPals offerings?')) {
        AdminDataStore.deleteService(id);
        this.renderServices();
        this.showToast('Service removed successfully.');
      }
    },

    openAddServiceModal() {
      const modalEl = document.getElementById('admin-modal-container');
      if (!modalEl) return;

      modalEl.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div class="bg-brand-surface rounded-2xl max-w-md w-full border border-brand-border shadow-2xl p-6 relative animate-in fade-in zoom-in duration-150">
            <button onclick="document.getElementById('admin-modal-container').innerHTML=''" class="absolute top-4 right-4 text-brand-muted hover:text-brand-dark p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <h3 class="font-serif font-bold text-xl text-brand-dark mb-1">Add New Pet Service</h3>
            <p class="text-xs text-brand-muted mb-4">Configure a new package or wellness service for clients.</p>

            <form id="add-service-form" class="space-y-3 text-xs" onsubmit="event.preventDefault(); AdminPortal.submitAddService();">
              <div>
                <label class="block font-semibold text-brand-dark mb-1">Service Title</label>
                <input id="srv-input-name" type="text" required placeholder="e.g. Ultrasonic Dental Deep Clean" class="w-full px-3 py-2 rounded-xl bg-brand-cream border border-brand-border focus:ring-1 focus:ring-brand-brown outline-none">
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-brand-dark mb-1">Category</label>
                  <select id="srv-input-category" class="w-full px-3 py-2 rounded-xl bg-brand-cream border border-brand-border focus:ring-1 focus:ring-brand-brown outline-none">
                    <option value="grooming">Grooming & Spa</option>
                    <option value="medical">Veterinary / Medical</option>
                    <option value="boarding">Boarding & Daycare</option>
                    <option value="training">Training & Walking</option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold text-brand-dark mb-1">Fee (₹ INR)</label>
                  <input id="srv-input-price" type="number" step="50" required placeholder="6300" class="w-full px-3 py-2 rounded-xl bg-brand-cream border border-brand-border focus:ring-1 focus:ring-brand-brown outline-none">
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-brand-dark mb-1">Duration</label>
                  <input id="srv-input-duration" type="text" required placeholder="60 min" class="w-full px-3 py-2 rounded-xl bg-brand-cream border border-brand-border focus:ring-1 focus:ring-brand-brown outline-none">
                </div>
                <div>
                  <label class="block font-semibold text-brand-dark mb-1">Assigned Specialist</label>
                  <input id="srv-input-specialist" type="text" required placeholder="Sarah Jenkins" class="w-full px-3 py-2 rounded-xl bg-brand-cream border border-brand-border focus:ring-1 focus:ring-brand-brown outline-none">
                </div>
              </div>
              <div>
                <label class="block font-semibold text-brand-dark mb-1">Short Description</label>
                <textarea id="srv-input-desc" rows="3" required placeholder="Summary of what the treatment or experience provides..." class="w-full px-3 py-2 rounded-xl bg-brand-cream border border-brand-border focus:ring-1 focus:ring-brand-brown outline-none"></textarea>
              </div>

              <div class="flex justify-end gap-2 pt-3">
                <button type="button" onclick="document.getElementById('admin-modal-container').innerHTML=''" class="px-4 py-2 rounded-xl bg-brand-tan/60 hover:bg-brand-tan text-brand-dark font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" class="px-5 py-2 rounded-xl bg-brand-brown hover:bg-brand-brownHover text-white font-semibold transition-colors">
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      `;
    },

    submitAddService() {
      const name = document.getElementById('srv-input-name')?.value.trim();
      const category = document.getElementById('srv-input-category')?.value;
      const price = parseFloat(document.getElementById('srv-input-price')?.value) || 6300;
      const duration = document.getElementById('srv-input-duration')?.value.trim() || '60 min';
      const specialist = document.getElementById('srv-input-specialist')?.value.trim() || 'Care Specialist';
      const description = document.getElementById('srv-input-desc')?.value.trim() || '';

      if (!name) return;

      AdminDataStore.addService({ name, category, price, duration, specialist, description, active: true });
      document.getElementById('admin-modal-container').innerHTML = '';
      this.renderServices();
      this.showToast(`Service "${name}" created successfully!`);
    },

    openEditServiceModal(id) {
      const services = AdminDataStore.getServices();
      const s = services.find(x => x.id === id);
      if (!s) return;

      const modalEl = document.getElementById('admin-modal-container');
      if (!modalEl) return;

      modalEl.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div class="bg-brand-surface rounded-2xl max-w-md w-full border border-brand-border shadow-2xl p-6 relative animate-in fade-in zoom-in duration-150">
            <button onclick="document.getElementById('admin-modal-container').innerHTML=''" class="absolute top-4 right-4 text-brand-muted hover:text-brand-dark p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <h3 class="font-serif font-bold text-xl text-brand-dark mb-1">Edit Service</h3>
            <p class="text-xs text-brand-muted mb-4">Modify details and rates for this offering.</p>

            <form id="edit-service-form" class="space-y-3 text-xs" onsubmit="event.preventDefault(); AdminPortal.submitEditService('${s.id}');">
              <div>
                <label class="block font-semibold text-brand-dark mb-1">Service Title</label>
                <input id="edit-srv-name" type="text" value="${escapeHtml(s.name)}" required class="w-full px-3 py-2 rounded-xl bg-brand-cream border border-brand-border focus:ring-1 focus:ring-brand-brown outline-none">
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-brand-dark mb-1">Category</label>
                  <select id="edit-srv-category" class="w-full px-3 py-2 rounded-xl bg-brand-cream border border-brand-border focus:ring-1 focus:ring-brand-brown outline-none">
                    <option value="grooming" ${s.category === 'grooming' ? 'selected' : ''}>Grooming & Spa</option>
                    <option value="medical" ${s.category === 'medical' ? 'selected' : ''}>Veterinary / Medical</option>
                    <option value="boarding" ${s.category === 'boarding' ? 'selected' : ''}>Boarding & Daycare</option>
                    <option value="training" ${s.category === 'training' ? 'selected' : ''}>Training & Walking</option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold text-brand-dark mb-1">Fee (₹ INR)</label>
                  <input id="edit-srv-price" type="number" step="50" value="${s.price}" required class="w-full px-3 py-2 rounded-xl bg-brand-cream border border-brand-border focus:ring-1 focus:ring-brand-brown outline-none">
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-brand-dark mb-1">Duration</label>
                  <input id="edit-srv-duration" type="text" value="${escapeHtml(s.duration)}" required class="w-full px-3 py-2 rounded-xl bg-brand-cream border border-brand-border focus:ring-1 focus:ring-brand-brown outline-none">
                </div>
                <div>
                  <label class="block font-semibold text-brand-dark mb-1">Specialist</label>
                  <input id="edit-srv-specialist" type="text" value="${escapeHtml(s.specialist)}" required class="w-full px-3 py-2 rounded-xl bg-brand-cream border border-brand-border focus:ring-1 focus:ring-brand-brown outline-none">
                </div>
              </div>
              <div>
                <label class="block font-semibold text-brand-dark mb-1">Short Description</label>
                <textarea id="edit-srv-desc" rows="3" required class="w-full px-3 py-2 rounded-xl bg-brand-cream border border-brand-border focus:ring-1 focus:ring-brand-brown outline-none">${escapeHtml(s.description)}</textarea>
              </div>

              <div class="flex justify-end gap-2 pt-3">
                <button type="button" onclick="document.getElementById('admin-modal-container').innerHTML=''" class="px-4 py-2 rounded-xl bg-brand-tan/60 hover:bg-brand-tan text-brand-dark font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" class="px-5 py-2 rounded-xl bg-brand-brown hover:bg-brand-brownHover text-white font-semibold transition-colors">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      `;
    },

    submitEditService(id) {
      const name = document.getElementById('edit-srv-name')?.value.trim();
      const category = document.getElementById('edit-srv-category')?.value;
      const price = parseFloat(document.getElementById('edit-srv-price')?.value) || 6300;
      const duration = document.getElementById('edit-srv-duration')?.value.trim();
      const specialist = document.getElementById('edit-srv-specialist')?.value.trim();
      const description = document.getElementById('edit-srv-desc')?.value.trim();

      AdminDataStore.updateService(id, { name, category, price, duration, specialist, description });
      document.getElementById('admin-modal-container').innerHTML = '';
      this.renderServices();
      this.showToast('Service updated successfully.');
    },

    // 6. REVIEWS MODERATION
    renderReviews() {
      const container = document.getElementById('reviews-grid-container');
      if (!container) return;

      const reviews = AdminDataStore.getReviews();
      const filter = window._currentReviewsFilter || 'all';

      let filtered = reviews.filter(r => {
        if (filter === 'approved' && r.status !== 'Approved') return false;
        if (filter === 'pending' && r.status !== 'Pending') return false;
        if (filter === 'featured' && !r.featured) return false;
        return true;
      });

      container.innerHTML = filtered.map(r => `
        <div class="bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-soft flex flex-col justify-between">
          <div>
            <div class="flex items-start justify-between gap-3 mb-2">
              <div>
                <div class="flex items-center gap-1 text-amber-500 mb-1">
                  ${Array(r.rating).fill('★').join('')}
                </div>
                <h4 class="font-serif font-bold text-base text-brand-dark">${escapeHtml(r.user)}</h4>
                <p class="text-[11px] text-brand-muted">Pet: ${escapeHtml(r.pet)} • ${escapeHtml(r.service)}</p>
              </div>
              <div class="flex flex-col items-end gap-1">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${r.status === 'Approved' ? 'bg-status-greenBg text-status-green' : 'bg-status-amberBg text-status-amber'}">
                  ${escapeHtml(r.status)}
                </span>
                ${r.featured ? '<span class="px-2 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 uppercase">Featured</span>' : ''}
              </div>
            </div>

            <p class="text-xs text-brand-dark italic bg-brand-cream/40 p-3 rounded-xl border border-brand-border/60 my-3 leading-relaxed">
              "${escapeHtml(r.comment)}"
            </p>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-brand-border/60 text-xs">
            <span class="text-[11px] text-brand-muted">${escapeHtml(r.date)}</span>
            <div class="flex items-center gap-2">
              <button onclick="AdminPortal.toggleReviewStatus('${r.id}')" class="px-2.5 py-1 rounded-lg ${r.status === 'Approved' ? 'bg-status-amberBg text-status-amber' : 'bg-status-greenBg text-status-green'} font-semibold text-[11px] transition-colors">
                ${r.status === 'Approved' ? 'Set Pending' : 'Approve'}
              </button>
              <button onclick="AdminPortal.toggleReviewFeatured('${r.id}')" class="px-2.5 py-1 rounded-lg bg-brand-tan/70 hover:bg-brand-tan text-brand-dark font-medium text-[11px] transition-colors">
                ${r.featured ? 'Unfeature' : 'Feature'}
              </button>
              <button onclick="AdminPortal.deleteReview('${r.id}')" class="p-1 text-brand-muted hover:text-status-red transition-colors" title="Delete">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </div>
        </div>
      `).join('');
    },

    toggleReviewStatus(id) {
      const r = AdminDataStore.getReviews().find(x => x.id === id);
      if (!r) return;
      const nextStatus = r.status === 'Approved' ? 'Pending' : 'Approved';
      AdminDataStore.updateReviewStatus(id, nextStatus);
      this.renderReviews();
      this.showToast(`Review marked as ${nextStatus}`);
    },

    toggleReviewFeatured(id) {
      const r = AdminDataStore.getReviews().find(x => x.id === id);
      if (!r) return;
      AdminDataStore.updateReviewStatus(id, undefined, !r.featured);
      this.renderReviews();
      this.showToast(r.featured ? 'Removed from featured' : 'Added to featured reviews');
    },

    deleteReview(id) {
      if (confirm('Delete this client review permanently?')) {
        AdminDataStore.deleteReview(id);
        this.renderReviews();
        this.showToast('Review deleted.');
      }
    },

    // 7. CLIENT MESSAGES & INQUIRIES
    renderMessages() {
      const container = document.getElementById('messages-list-container');
      if (!container) return;

      const messages = AdminDataStore.getMessages();
      const filter = window._currentMessagesFilter || 'all';

      let filtered = messages.filter(m => {
        if (filter === 'unread' && m.status !== 'Unread') return false;
        if (filter === 'replied' && m.status !== 'Replied') return false;
        if (filter === 'resolved' && m.status !== 'Resolved') return false;
        return true;
      });

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="p-8 text-center bg-brand-surface rounded-2xl border border-brand-border">
            <p class="font-serif font-bold text-base text-brand-dark">No messages in this folder</p>
          </div>
        `;
        return;
      }

      container.innerHTML = filtered.map(m => `
        <div class="bg-brand-surface p-5 rounded-2xl border ${m.status === 'Unread' ? 'border-brand-brown bg-brand-cream/20' : 'border-brand-border'} shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-brown/40 transition-all">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              ${m.status === 'Unread' ? '<span class="w-2 h-2 rounded-full bg-brand-brown shrink-0"></span>' : ''}
              <span class="font-semibold text-brand-dark text-sm truncate">${escapeHtml(m.name)}</span>
              <span class="text-[11px] text-brand-muted">(${escapeHtml(m.email)})</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${m.status === 'Unread' ? 'bg-status-amberBg text-status-amber' : m.status === 'Replied' ? 'bg-status-greenBg text-status-green' : 'bg-brand-tan/60 text-brand-muted'} ml-auto sm:ml-0">
                ${escapeHtml(m.status)}
              </span>
            </div>
            <h4 class="font-serif font-bold text-sm text-brand-dark mb-1 truncate">${escapeHtml(m.subject)}</h4>
            <p class="text-xs text-brand-muted line-clamp-1">${escapeHtml(m.message)}</p>
            ${m.reply ? `<p class="text-[11px] text-status-green font-medium mt-1 truncate">↳ Reply: "${escapeHtml(m.reply)}"</p>` : ''}
          </div>

          <div class="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
            <span class="text-[11px] text-brand-muted">${escapeHtml(m.date)}</span>
            <button onclick="AdminPortal.openMessageModal('${m.id}')" class="px-3.5 py-1.5 rounded-xl bg-brand-brown hover:bg-brand-brownHover text-white font-medium text-xs transition-colors">
              ${m.status === 'Replied' ? 'View Thread' : 'Reply'}
            </button>
          </div>
        </div>
      `).join('');
    },

    openMessageModal(msgId) {
      const messages = AdminDataStore.getMessages();
      const m = messages.find(x => x.id === msgId);
      if (!m) return;

      const modalEl = document.getElementById('admin-modal-container');
      if (!modalEl) return;

      modalEl.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div class="bg-brand-surface rounded-2xl max-w-lg w-full border border-brand-border shadow-2xl p-6 relative animate-in fade-in zoom-in duration-150">
            <button onclick="document.getElementById('admin-modal-container').innerHTML=''" class="absolute top-4 right-4 text-brand-muted hover:text-brand-dark p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${m.status === 'Unread' ? 'bg-status-amberBg text-status-amber' : 'bg-status-greenBg text-status-green'}">
                ${escapeHtml(m.status)}
              </span>
              <span class="text-xs text-brand-muted">${escapeHtml(m.date)}</span>
            </div>
            <h3 class="font-serif font-bold text-lg text-brand-dark mb-1">${escapeHtml(m.subject)}</h3>
            <p class="text-xs text-brand-muted mb-4">From: <strong class="text-brand-dark">${escapeHtml(m.name)}</strong> (${escapeHtml(m.email)} • ${escapeHtml(m.phone)})</p>

            <div class="p-3.5 rounded-xl bg-brand-cream/60 border border-brand-border text-xs text-brand-dark mb-4 leading-relaxed whitespace-pre-wrap">
              ${escapeHtml(m.message)}
            </div>

            ${m.reply ? `
              <div class="p-3.5 rounded-xl bg-status-greenBg/50 border border-status-green/30 text-xs text-status-green mb-4">
                <span class="font-bold block mb-1">Sent Reply:</span>
                <p class="text-brand-dark">${escapeHtml(m.reply)}</p>
              </div>
            ` : ''}

            <form onsubmit="event.preventDefault(); AdminPortal.submitMessageReply('${m.id}');" class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-brand-dark mb-1">Write Official Response</label>
                <textarea id="admin-reply-textarea" rows="3" placeholder="Type your response to send to the client..." required class="w-full p-3 rounded-xl bg-brand-cream border border-brand-border text-xs focus:ring-1 focus:ring-brand-brown outline-none"></textarea>
              </div>
              <div class="flex justify-between items-center pt-1">
                <button type="button" onclick="AdminPortal.markMessageResolved('${m.id}')" class="text-xs text-brand-muted hover:text-brand-dark font-medium underline">
                  Mark as Resolved
                </button>
                <div class="flex gap-2">
                  <button type="button" onclick="document.getElementById('admin-modal-container').innerHTML=''" class="px-4 py-2 rounded-xl bg-brand-tan/60 hover:bg-brand-tan text-brand-dark font-medium text-xs">
                    Close
                  </button>
                  <button type="submit" class="px-5 py-2 rounded-xl bg-brand-brown hover:bg-brand-brownHover text-white font-semibold text-xs shadow-sm">
                    Send Reply
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      `;
    },

    submitMessageReply(id) {
      const text = document.getElementById('admin-reply-textarea')?.value.trim();
      if (!text) return;

      AdminDataStore.replyToMessage(id, text);
      document.getElementById('admin-modal-container').innerHTML = '';
      this.renderMessages();
      this.updateBadges();
      this.showToast('Reply dispatched to client.');
    },

    markMessageResolved(id) {
      AdminDataStore.updateMessageStatus(id, 'Resolved');
      document.getElementById('admin-modal-container').innerHTML = '';
      this.renderMessages();
      this.updateBadges();
      this.showToast('Inquiry marked as resolved.');
    },

    // 8. REPORTS & ANALYTICS
    renderReports() {
      const bookings = AdminDataStore.getBookings();
      const pets = (window.PetPalsStore && window.PetPalsStore.getPets()) || [];
      const users = AdminDataStore.getUsers();

      // Calculate total revenue from all bookings
      let totalRevenue = 0;
      bookings.forEach(b => {
        const val = parseFloat(String(b.servicePrice || '6300').replace(/[^0-9.]/g, '')) || 6300;
        totalRevenue += val;
      });

      const confirmedCount = bookings.filter(b => (b.status || '').toLowerCase() === 'confirmed' || (b.status || '').toLowerCase() === 'upcoming').length;
      const completedCount = bookings.filter(b => (b.status || '').toLowerCase() === 'completed').length;
      const completionRate = bookings.length ? Math.round((completedCount / bookings.length) * 100) : 75;

      document.getElementById('report-stat-revenue') && (document.getElementById('report-stat-revenue').textContent = '₹' + totalRevenue.toLocaleString('en-IN'));
      document.getElementById('report-stat-bookings') && (document.getElementById('report-stat-bookings').textContent = bookings.length);
      document.getElementById('report-stat-clients') && (document.getElementById('report-stat-clients').textContent = users.length);
      document.getElementById('report-stat-completion') && (document.getElementById('report-stat-completion').textContent = completionRate + '%');
    },

    exportReportCSV() {
      const bookings = AdminDataStore.getBookings();
      let csv = 'Booking ID,Service,Pet Name,Owner,Date,Time,Price,Status\n';
      const csvCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
      bookings.forEach(b => {
        const price = b.servicePrice || (Number(b.totalAmount) ? `₹${Number(b.totalAmount).toLocaleString('en-IN')}` : '');
        csv += [b.id, b.service, b.petName || 'No companion', b.ownerName || b.userName || 'Pet Parent', b.date, b.time, price, b.status || 'Confirmed'].map(csvCell).join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `petpals-bookings-report-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.showToast('CSV Report downloaded successfully!');
    },

    // 9. SETTINGS
    renderSettings() {
      const settings = AdminDataStore.getSettings();
      const form = document.getElementById('admin-settings-form');
      if (!form) return;

      const fName = document.getElementById('setting-facility-name');
      if (fName) fName.value = settings.facilityName || '';

      const fEmail = document.getElementById('setting-contact-email');
      if (fEmail) fEmail.value = settings.contactEmail || '';

      const fPhone = document.getElementById('setting-emergency-phone');
      if (fPhone) fPhone.value = settings.emergencyPhone || '';

      const fHours = document.getElementById('setting-operating-hours');
      if (fHours) fHours.value = settings.operatingHours || '';

      const fAddress = document.getElementById('setting-facility-address');
      if (fAddress) fAddress.value = settings.facilityAddress || '';

      const fAdminName = document.getElementById('setting-admin-name');
      if (fAdminName) fAdminName.value = settings.adminName || 'PetPals Administrator';

      const fAdminEmail = document.getElementById('setting-admin-email');
      if (fAdminEmail) fAdminEmail.value = settings.adminEmail || 'admin@petpalscare.com';

      const chkAuto = document.getElementById('setting-auto-confirm');
      if (chkAuto) chkAuto.checked = settings.autoConfirmBookings !== false;

      const chkEmail = document.getElementById('setting-email-alerts');
      if (chkEmail) chkEmail.checked = settings.emailAlerts !== false;

      const chkSms = document.getElementById('setting-sms-alerts');
      if (chkSms) chkSms.checked = settings.smsAlerts !== false;
    },

    saveSettingsForm() {
      const current = AdminDataStore.getSettings();
      const updated = {
        ...current,
        facilityName: document.getElementById('setting-facility-name')?.value.trim() || current.facilityName,
        contactEmail: document.getElementById('setting-contact-email')?.value.trim() || current.contactEmail,
        emergencyPhone: document.getElementById('setting-emergency-phone')?.value.trim() || current.emergencyPhone,
        operatingHours: document.getElementById('setting-operating-hours')?.value.trim() || current.operatingHours,
        facilityAddress: document.getElementById('setting-facility-address')?.value.trim() || current.facilityAddress,
        adminName: document.getElementById('setting-admin-name')?.value.trim() || current.adminName,
        adminEmail: document.getElementById('setting-admin-email')?.value.trim() || current.adminEmail,
        autoConfirmBookings: document.getElementById('setting-auto-confirm')?.checked ?? true,
        emailAlerts: document.getElementById('setting-email-alerts')?.checked ?? true,
        smsAlerts: document.getElementById('setting-sms-alerts')?.checked ?? true
      };

      AdminDataStore.saveSettings(updated);
      this.showToast('Platform & facility settings updated successfully!');
    },

    showToast(message) {
      let toast = document.getElementById('admin-quick-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'admin-quick-toast';
        toast.className = 'fixed bottom-6 right-6 bg-brand-surface border border-brand-border shadow-2xl rounded-2xl px-5 py-3.5 flex items-center gap-3 transition-all duration-300 z-[9999] text-xs font-semibold text-brand-dark opacity-0 translate-y-4 pointer-events-none';
        document.body.appendChild(toast);
      }
      toast.innerHTML = `
        <div class="w-6 h-6 rounded-full bg-status-greenBg text-status-green flex items-center justify-center shrink-0 shadow-xs">
          <svg class="w-3.5 h-3.5 stroke-current fill-none stroke-[2.5]" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <span class="text-xs font-semibold text-brand-dark font-sans leading-snug">${escapeHtml(message)}</span>
      `;
      toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
      toast.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');

      const globalToast = document.getElementById('petpals-global-toast');
      if (globalToast) {
        globalToast.classList.add('opacity-0', 'pointer-events-none');
        globalToast.classList.remove('opacity-100', 'pointer-events-auto');
      }

      clearTimeout(toast._timer);
      toast._timer = setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
        toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
      }, 3500);
    }
  };

  window.AdminDataStore = AdminDataStore;
  window.AdminPortal = AdminPortal;

  document.addEventListener('DOMContentLoaded', () => {
    AdminPortal.init();
  });

})(window);
