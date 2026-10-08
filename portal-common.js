// PetPals Shared Portal Common Utilities & State Management
(function(window) {
  'use strict';

  const STORAGE_KEYS = {
    USER: 'petpals_user',
    PETS: 'petpals_pets',
    BOOKINGS: 'petpals_bookings',
    AUTH: 'petpals_auth',
    CURRENT_UID: 'petpals_current_user_id'
  };

  const DEFAULT_USER = {
    name: 'Prathiksha Shetty',
    firstName: 'Prathiksha',
    email: 'prathiksha@gmail.com',
    phone: '+91 98765 43210',
    location: 'Mangalore, Karnataka',
    avatar: null
  };

  const PROFILE_AVATAR_PLACEHOLDER = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="#8c6246"/><circle cx="32" cy="23" r="11" fill="#fcf9f4"/><path d="M10 60c1-15 10-23 22-23s21 8 22 23" fill="#fcf9f4"/></svg>'
  );

  function getDisplayAvatar(user) {
    const avatar = typeof user?.avatar === 'string' ? user.avatar.trim() : '';
    const isAutoAssignedAvatar =
      avatar.includes('photo-1535713875002-d1d0cf377fde') ||
      avatar.includes('aida/AEtjO1W2uQrDJs4Vq5TYFXxKRstMqlWw');
    return avatar && !isAutoAssignedAvatar ? avatar : PROFILE_AVATAR_PLACEHOLDER;
  }

  const SPECIES_AVATARS = {
    'Dog': 'https://lh3.googleusercontent.com/aida/AEtjO1Uuc_lq8IwyBwbjSlNL1obmQxxUrnJznxdjFzSncsyQDO1-YLIUzfA26YIg8yEhskgu9bqGS8QeWYZPTGpIQD6FXUjqJOTEPL92yxV6_uo66Re6T62xuKeC1UJF5zhXDGpeUIx3UpOQOFfTvElfqK-3SvN_G681f6Is0T7pjxiMowIXYwAQiutnTNbf70J32lVHH31Pn4LZk54wkstesIfLUzUa5mtuN06jDWNkEWTtCVkamIVdAptB-t6J',
    'Cat': 'https://lh3.googleusercontent.com/aida/AEtjO1WT6ANlajBfAFZfy7s2ZiqXTDUYaiJGV-Hu02OGU9PgovrJw8KPqccWgiG93n2PwTxchuFVJ3ASByB6dPS4dMyMzed6GF9xPYMGkUfOw9pVQY0mIH7U4hxSFJ3vXHqSyMhnnjpwmDSD8uEEh7mB5FeOP2gk61l4gyqODvdUhL5TDs1EOSm8R69PQ2QmROFVLmTomMBxfeSAD-EuGOnPSGeQE2uRBmqA8ealfCucmUXvwTJ2HOqlPVelelg',
    'Bird': 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=400&q=80',
    'Rabbit': 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=400&q=80',
    'Other': 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&w=400&q=80'
  };

  function getStoredToken() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const qToken = urlParams.get('session_token') || urlParams.get('token');
      if (qToken) {
        localStorage.setItem('petpals_session_token', qToken);
        return qToken;
      }
      return localStorage.getItem('petpals_session_token') || '';
    } catch (e) {
      return '';
    }
  }

  function attachAuthHeaders(headers = {}) {
    const token = getStoredToken();
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
      headers['X-Session-Token'] = token;
    }
    return headers;
  }

  // Backend API Client
  const API = {
    async get(endpoint) {
      try {
        const res = await fetch(endpoint, {
          credentials: 'include',
          headers: attachAuthHeaders()
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        console.warn(`[API] GET ${endpoint} error:`, err.message);
        return null;
      }
    },
    async post(endpoint, data) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          headers: attachAuthHeaders({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        console.warn(`[API] POST ${endpoint} error:`, err.message);
        return null;
      }
    },
    async put(endpoint, data) {
      try {
        const res = await fetch(endpoint, {
          method: 'PUT',
          credentials: 'include',
          headers: attachAuthHeaders({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        console.warn(`[API] PUT ${endpoint} error:`, err.message);
        return null;
      }
    },
    async delete(endpoint) {
      try {
        const res = await fetch(endpoint, {
          method: 'DELETE',
          credentials: 'include',
          headers: attachAuthHeaders()
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        console.warn(`[API] DELETE ${endpoint} error:`, err.message);
        return null;
      }
    }
  };

  const PetPalsStore = {
    getDisplayAvatar(user = this.getUser()) {
      return getDisplayAvatar(user);
    },

    hasProfilePhoto(user = this.getUser()) {
      const avatar = typeof user?.avatar === 'string' ? user.avatar.trim() : '';
      return Boolean(avatar && getDisplayAvatar(user) === avatar);
    },

    getUser() {
      try {
        const currentUid = localStorage.getItem(STORAGE_KEYS.CURRENT_UID);
        if (currentUid) {
          const userSpecific = localStorage.getItem(`${STORAGE_KEYS.USER}_${currentUid}`);
          if (userSpecific) {
            const parsed = JSON.parse(userSpecific);
            if (parsed && (parsed.id || parsed.email)) return parsed;
          }
        }
        const data = localStorage.getItem(STORAGE_KEYS.USER);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed && (parsed.id || parsed.email)) return parsed;
        }
      } catch (e) {
        console.warn('Error reading user from localStorage', e);
      }
      return null;
    },

    async saveUser(userData) {
      if (!userData || typeof userData !== 'object') {
        throw new Error('Profile changes are missing.');
      }
      const current = this.getUser();
      if (!current?.id) {
        throw new Error('Please sign in again before updating your profile.');
      }

      const patch = {};
      for (const field of ['name', 'email', 'phone', 'location', 'avatar']) {
        if (Object.prototype.hasOwnProperty.call(userData, field)) patch[field] = userData[field];
      }
      if (Object.prototype.hasOwnProperty.call(userData, 'address') && !Object.prototype.hasOwnProperty.call(patch, 'location')) {
        patch.location = userData.address;
      }
      if (typeof patch.name === 'string') patch.name = patch.name.trim();
      if (typeof patch.email === 'string') patch.email = patch.email.trim().toLowerCase();
      for (const field of ['phone', 'location']) {
        if (Object.prototype.hasOwnProperty.call(patch, field) && typeof patch[field] === 'string') {
          patch[field] = patch[field].trim() || null;
        }
      }
      if (Object.prototype.hasOwnProperty.call(patch, 'avatar') &&
          (typeof patch.avatar !== 'string' || !patch.avatar.trim())) {
        patch.avatar = null;
      }

      const response = await API.put('/api/auth/profile', patch);
      if (!response?.success || !response.user) {
        throw new Error('Your profile could not be saved. Please try again.');
      }

      const saved = { ...current, ...response.user };
      saved.firstName = saved.first_name || saved.firstName || saved.name?.trim().split(/\s+/)[0] || 'Member';
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(saved));
      localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      localStorage.setItem(STORAGE_KEYS.CURRENT_UID, saved.id);
      localStorage.setItem(`${STORAGE_KEYS.USER}_${saved.id}`, JSON.stringify(saved));
      this.broadcast('user-updated', saved);
      return saved;
    },

    getPets() {
      const user = this.getUser();
      const userId = user?.id;
      if (!userId) return [];
      try {
        const userPets = localStorage.getItem(`${STORAGE_KEYS.PETS}_${userId}`);
        if (userPets) {
          const parsed = JSON.parse(userPets);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.warn('Error reading pets from localStorage', e);
      }
      return [];
    },

    savePets(pets) {
      try {
        const user = this.getUser();
        const userId = user?.id;
        const petsList = Array.isArray(pets) ? pets : [];
        if (userId) {
          localStorage.setItem(`${STORAGE_KEYS.PETS}_${userId}`, JSON.stringify(petsList));
        }
        this.broadcast('pets-updated', petsList);
      } catch (e) {
        console.error('Error saving pets to localStorage', e);
      }
    },

    addPet(petData) {
      const pets = this.getPets();
      const id = petData.id || ('pet-' + Date.now());
      const normalizedSpecies = petData.species ? (petData.species.charAt(0).toUpperCase() + petData.species.slice(1).toLowerCase()) : 'Dog';
      const avatar = petData.avatar || petData.photo || SPECIES_AVATARS[normalizedSpecies] || SPECIES_AVATARS['Dog'];
      const note = petData.note || petData.notes || 'Wellness check recommended';
      const microchip = petData.microchip || `${Math.floor(100 + Math.random()*899)} ${Math.floor(100 + Math.random()*899)} 002 ${Math.floor(100 + Math.random()*899)}`;
      const user = this.getUser();
      const newPet = {
        id,
        userId: user?.id || null,
        user_id: user?.id || null,
        name: petData.name || 'Pet',
        species: normalizedSpecies,
        breed: petData.breed || (normalizedSpecies === 'Cat' ? 'Domestic Shorthair' : 'Golden Retriever'),
        age: petData.age || '1 year',
        status: petData.status || 'Active',
        note: note,
        notes: note,
        weight: petData.weight || '5.0 kg',
        gender: petData.gender || 'Unknown',
        avatar: avatar,
        photo: avatar,
        microchip: microchip
      };
      pets.push(newPet);
      this.savePets(pets);

      // Persist to PostgreSQL backend API
      this.lastPetPersistence = API.post('/api/pets', newPet).then(saved => {
        if (!saved) return null;
        if (saved && saved.id && saved.id !== id) {
          newPet.id = saved.id;
          this.savePets(pets);
        }
        return newPet;
      });

      return newPet;
    },

    updatePet(id, updatedData) {
      const pets = this.getPets();
      const idx = pets.findIndex(p => p.id === id);
      if (idx !== -1) {
        pets[idx] = { ...pets[idx], ...updatedData };
        this.savePets(pets);

        // Persist to PostgreSQL backend API
        API.put('/api/pets/' + encodeURIComponent(id), updatedData).catch(err => console.warn('Failed to update pet in backend:', err));

        return pets[idx];
      }
      return null;
    },

    async deletePet(id) {
      if (!id || !this.getUser()?.id) throw new Error('Please sign in before removing a pet.');

      // Confirm the PostgreSQL delete before removing the pet from the local view.
      const result = await API.delete('/api/pets/' + encodeURIComponent(id));
      if (!result?.success) {
        throw new Error(result?.error || 'The pet could not be removed. Please try again.');
      }

      const pets = this.getPets().filter(p => String(p.id) !== String(id));
      this.savePets(pets);
      return pets;
    },

    getBookings() {
      const user = this.getUser();
      const userId = user?.id;
      if (!userId) return [];
      try {
        const userBookings = localStorage.getItem(`${STORAGE_KEYS.BOOKINGS}_${userId}`);
        if (userBookings) {
          const parsed = JSON.parse(userBookings);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.warn('Error reading bookings from localStorage', e);
      }
      return [];
    },

    saveBookings(bookings) {
      try {
        const user = this.getUser();
        const userId = user?.id;
        const bookingsList = Array.isArray(bookings) ? bookings : [];
        if (userId) {
          localStorage.setItem(`${STORAGE_KEYS.BOOKINGS}_${userId}`, JSON.stringify(bookingsList));
        }
        this.broadcast('bookings-updated', bookingsList);
      } catch (e) {
        console.error('Error saving bookings to localStorage', e);
      }
    },

    addBooking(bookingData) {
      if (!bookingData?.service || !bookingData?.servicePrice) {
        console.warn('Booking requires a selected service and price.');
        return null;
      }
      const bookings = this.getBookings();
      const id = bookingData.id || ('PP-' + Math.floor(10000 + Math.random() * 90000));
      const user = this.getUser();
      const newBooking = {
        id,
        userId: user?.id || null,
        user_id: user?.id || null,
        service: bookingData.service || '',
        serviceCategory: bookingData.serviceCategory || '',
        servicePrice: bookingData.servicePrice || '',
        duration: bookingData.duration || '',
        petId: bookingData.petId || null,
        companionChoice: bookingData.companionChoice || (bookingData.petId ? 'pet' : 'none'),
        petName: bookingData.petName || 'No companion',
        petBreed: bookingData.petBreed || '',
        petAvatar: bookingData.petAvatar || '',
        petPhoto: bookingData.petPhoto || '',
        date: bookingData.date || 'Upcoming',
        time: bookingData.time || '10:00 AM',
        specialistId: bookingData.specialistId || null,
        specialist: bookingData.specialist || 'Any Master Groomer',
        specialistRole: bookingData.specialistRole || 'Any available specialist',
        specialistPhoto: bookingData.specialistPhoto || null,
        specialistRating: bookingData.specialistRating ?? null,
        specialistSessions: bookingData.specialistSessions ?? null,
        specialistAvailability: bookingData.specialistAvailability || '',
        location: bookingData.location || 'PetPals Flagship Spa & Wellness Lounge • Suite 4',
        locationType: bookingData.locationType || 'clinic',
        selectedAddons: Array.isArray(bookingData.selectedAddons) ? bookingData.selectedAddons : [],
        status: bookingData.status || 'Upcoming',
        paid: true,
        notes: bookingData.notes || ''
      };
      bookings.unshift(newBooking);
      this.saveBookings(bookings);
      localStorage.setItem('petpals_last_confirmed', JSON.stringify(newBooking));

      // Persist to PostgreSQL backend API
      API.post('/api/bookings', newBooking).catch(err => console.warn('Failed to save booking to backend:', err));

      return newBooking;
    },

    cancelBooking(id) {
      const bookings = this.getBookings();
      const idx = bookings.findIndex(b => b.id === id);
      if (idx !== -1) {
        bookings[idx].status = 'Cancelled';
        this.saveBookings(bookings);

        // Persist to PostgreSQL backend API
        API.put('/api/bookings/' + encodeURIComponent(id) + '/status', { status: 'Cancelled' }).catch(err => console.warn('Failed to cancel booking in backend:', err));

        return bookings[idx];
      }
      return null;
    },

    rescheduleBooking(id, newDate, newTime) {
      const bookings = this.getBookings();
      const idx = bookings.findIndex(b => b.id === id);
      if (idx !== -1) {
        bookings[idx].date = newDate;
        bookings[idx].time = newTime;
        bookings[idx].status = 'Upcoming';
        this.saveBookings(bookings);

        // Persist to PostgreSQL backend API
        API.put('/api/bookings/' + encodeURIComponent(id) + '/status', { status: 'Confirmed', notes: `Rescheduled to ${newDate} at ${newTime}` }).catch(err => console.warn('Failed to reschedule in backend:', err));

        return bookings[idx];
      }
      return null;
    },

    updateBooking(id, updatedData) {
      const bookings = this.getBookings();
      const idx = bookings.findIndex(b => b.id === id);
      if (idx !== -1) {
        bookings[idx] = { ...bookings[idx], ...updatedData };
        this.saveBookings(bookings);

        if (updatedData.status) {
          API.put('/api/bookings/' + encodeURIComponent(id) + '/status', { status: updatedData.status }).catch(err => console.warn('Failed to update booking status in backend:', err));
        }

        return bookings[idx];
      }
      return null;
    },

    async syncFromBackend() {
      try {
        const user = await API.get('/api/auth/me');
        const currentPath = window.location.pathname;
        const protectedPaths = [
          '/dashboard', '/my-pets', '/my-bookings', '/profile',
          '/book-service', '/book-new-service', '/book-service-modal',
          '/book-service-pet', '/book-service-schedule', '/book-service-review',
          '/booking-confirmed', '/bookings-pet-dashboard'
        ];
        const isProtected = protectedPaths.some(p => currentPath === p || currentPath.startsWith(p + '/') || currentPath === p + '.html');

        if (!user || !user.id) {
          localStorage.clear();
          document.cookie = 'petpals_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
          if (isProtected) {
            window.location.replace('/login');
            return;
          }
          return;
        }

        const prevUid = localStorage.getItem(STORAGE_KEYS.CURRENT_UID);
        if (prevUid && prevUid !== user.id) {
          localStorage.clear();
        }

        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        localStorage.setItem(`${STORAGE_KEYS.USER}_${user.id}`, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
        localStorage.setItem(STORAGE_KEYS.CURRENT_UID, user.id);
        this.broadcast('user-updated', user);

        const [pets, bookings] = await Promise.all([
          API.get('/api/pets'),
          API.get('/api/bookings')
        ]);

        this.savePets(Array.isArray(pets) ? pets : []);

        if (Array.isArray(bookings)) {
          this.saveBookings(bookings);
        } else {
          this.saveBookings([]);
        }
      } catch (err) {
        console.warn('Backend sync error:', err);
        if (window.location.pathname === '/my-pets' || window.location.pathname === '/my-pets.html') {
          this.savePets([]);
        }
      }
    },

    getActiveBooking() {
      const user = this.getUser();
      const userId = user?.id;
      const emptyBooking = {
        service: '', serviceCategory: '', servicePrice: '', duration: '', serviceId: '',
        petId: '', petName: '', petBreed: '', date: '', time: '', status: 'Upcoming'
      };
      if (!userId) {
        return emptyBooking;
      }
      try {
        const userActive = localStorage.getItem(`petpals_active_booking_${userId}`);
        if (userActive) {
          const booking = JSON.parse(userActive);
          if (typeof booking.servicePrice === 'string' && booking.servicePrice.trim().startsWith('$')) {
            const amount = parseFloat(booking.servicePrice.replace(/[^0-9.]/g, '')) || 0;
            booking.servicePrice = `₹${(Math.round(amount * 97 / 50) * 50).toLocaleString('en-IN')}`;
            localStorage.setItem(`petpals_active_booking_${userId}`, JSON.stringify(booking));
          }
          return booking;
        }
      } catch (e) {}
      return emptyBooking;
    },

    resetActiveBooking() {
      const userId = this.getUser()?.id;
      const emptyBooking = {
        service: '', serviceCategory: '', servicePrice: '', duration: '',
        petId: null, petName: '', petBreed: '', petAge: '', petWeight: '',
        petAvatar: '', petPhoto: '', companionChoice: 'none', date: '', time: '', location: '', locationType: '', selectedAddons: [], step1Addons: [], petStepAddons: [],
        specialistId: null,
        specialist: 'Any Master Groomer', specialistRole: 'Any available specialist', specialistPhoto: null,
        specialistRating: null, specialistSessions: null, specialistAvailability: '', notes: '', status: 'Upcoming'
      };
      if (userId) localStorage.setItem(`petpals_active_booking_${userId}`, JSON.stringify(emptyBooking));
      return emptyBooking;
    },

    saveActiveBooking(bookingData) {
      try {
        const user = this.getUser();
        const userId = user?.id;
        const current = this.getActiveBooking();
        const updated = { ...current, ...bookingData };
        if (userId) {
          localStorage.setItem(`petpals_active_booking_${userId}`, JSON.stringify(updated));
        }
        return updated;
      } catch (e) {
        console.error('Error saving active booking', e);
      }
    },

    isAuthenticated() {
      try {
        const auth = localStorage.getItem(STORAGE_KEYS.AUTH);
        if (auth !== 'true') return false;
        const u = this.getUser();
        return Boolean(u && (u.id || u.email));
      } catch (e) {
        return false;
      }
    },

    setAuthenticated(status) {
      try {
        localStorage.setItem(STORAGE_KEYS.AUTH, status ? 'true' : 'false');
        if (!status) {
          localStorage.removeItem(STORAGE_KEYS.USER);
          localStorage.removeItem(STORAGE_KEYS.CURRENT_UID);
        }
        this.broadcast('auth-changed', { authenticated: Boolean(status) });
      } catch (e) {
        console.error('Error setting auth state', e);
      }
    },

    login(userData, token) {
      try {
        localStorage.clear();
        sessionStorage.clear();

        localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
        if (token) {
          localStorage.setItem('petpals_session_token', token);
          try {
            document.cookie = 'petpals_session=' + encodeURIComponent(token) + '; path=/; max-age=604800; SameSite=Lax';
          } catch (e) {}
        }
        if (userData && userData.id) {
          localStorage.setItem(STORAGE_KEYS.CURRENT_UID, userData.id);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
          localStorage.setItem(`${STORAGE_KEYS.USER}_${userData.id}`, JSON.stringify(userData));
        }
        this.broadcast('auth-changed', { authenticated: true, user: userData });
        this.broadcast('user-updated', userData);
      } catch (e) {
        console.error('Error during login', e);
      }
      return true;
    },

    async logout() {
      try {
        await API.post('/api/auth/logout', {});
      } catch (e) {}
      try {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie = 'petpals_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      } catch (e) {}
      showToast('Signed out successfully.', 'logout');
      setTimeout(() => {
        window.location.replace('/login?switch=true');
      }, 200);
    },

    broadcast(event, detail) {
      window.dispatchEvent(new CustomEvent('petpals:' + event, { detail }));
    }
  };

  // UI Toast notification
  function showToast(message, typeOrIcon = 'check_circle') {
    let icon = 'check_circle';
    let textColor = 'text-primary';
    if (typeOrIcon === 'success') {
      icon = 'check_circle';
      textColor = 'text-[#2D5A3A]';
    } else if (typeOrIcon === 'error') {
      icon = 'error';
      textColor = 'text-[#ba1a1a]';
    } else if (typeOrIcon === 'info') {
      icon = 'info';
      textColor = 'text-primary';
    } else if (typeof typeOrIcon === 'string' && typeOrIcon.length > 0) {
      icon = typeOrIcon;
    }

    let toast = document.getElementById('petpals-global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'petpals-global-toast';
      toast.className = 'fixed bottom-6 right-6 bg-surface-container-lowest border border-outline-variant/60 shadow-xl rounded-2xl px-5 py-3.5 flex items-center gap-3 transition-all duration-300 translate-y-20 opacity-0 pointer-events-none z-[9999]';
      document.body.appendChild(toast);
    }
    let iconHtml = '';
    if (icon === 'check_circle') {
      iconHtml = `
        <span class="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-xs">
          <svg class="w-4 h-4 stroke-current fill-none stroke-[2.5]" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
      `;
    } else if (icon === 'error') {
      iconHtml = `
        <span class="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0 shadow-xs">
          <svg class="w-4 h-4 stroke-current fill-none stroke-[2.5]" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </span>
      `;
    } else {
      iconHtml = `<span class="material-symbols-outlined ${textColor} text-2xl" style="font-family:'Material Symbols Outlined'">${icon}</span>`;
    }

    toast.innerHTML = `
      ${iconHtml}
      <span class="font-label-md text-label-md text-on-surface font-medium leading-snug">${message}</span>
    `;
    toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
    toast.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
      toast.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
    }, 3200);
  }

  // Dynamic modal helper
  function showModal(html, onClose) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;inset:0;z-index:8000;
      background:rgba(28,28,25,.45);backdrop-filter:blur(4px);
      display:flex;align-items:center;justify-content:center;padding:16px;`;
    overlay.innerHTML = `<div style="background:#fcf9f4;border-radius:24px;
      max-width:520px;width:100%;padding:32px;position:relative;
      box-shadow:0 24px 64px rgba(0,0,0,.18);font-family:'Plus Jakarta Sans',sans-serif;
      animation:popIn .25s cubic-bezier(.34,1.56,.64,1) both;">
      <button id="modal-close" style="position:absolute;top:16px;right:16px;background:none;
        border:none;cursor:pointer;font-size:22px;color:#83746c;line-height:1;">✕</button>
      ${html}</div>`;
    let popInStyle = document.getElementById('petpals-popin-style');
    if (!popInStyle) {
      popInStyle = document.createElement('style');
      popInStyle.id = 'petpals-popin-style';
      popInStyle.textContent = `@keyframes popIn{from{transform:scale(.88);opacity:0}to{transform:scale(1);opacity:1}}`;
      document.head.appendChild(popInStyle);
    }
    document.body.appendChild(overlay);
    const close = () => { overlay.remove(); if (typeof onClose === 'function') onClose(); };
    const closeBtn = overlay.querySelector('#modal-close');
    if (closeBtn) closeBtn.onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    return { overlay, close };
  }

  // Create & mount User Dropdown Menu in header
  function initHeaderUserMenu() {
    const user = PetPalsStore.getUser() || { name: 'Pet Parent', firstName: 'Pet Parent', email: '', avatar: '' };

    const header = document.querySelector('header');
    if (!header) return;

    // Find the profile pill in header (avoiding inputs and non-profile buttons)
    const pill = header.querySelector('img[alt="Profile"]')?.closest('.cursor-pointer, .rounded-full')
      || Array.from(header.querySelectorAll('div.cursor-pointer, div.rounded-full')).find(el => {
        return el.querySelector('img') && !el.closest('input') && !el.closest('form');
      });

    if (!pill) return;

    // Ensure parent container is positioned relatively so the dropdown aligns perfectly
    const parent = pill.parentElement;
    if (parent) {
      parent.style.position = 'relative';
    }

    // Update avatar image if present
    const img = pill.querySelector('img');
    if (img) {
      img.alt = 'Profile';
      img.src = PetPalsStore.getDisplayAvatar(user);
    }
    
    // Update name text
    const nameSpan = pill.querySelector('span:not(.material-symbols-outlined)');
    if (nameSpan) {
      nameSpan.textContent = user.firstName || user.name || 'Pet Parent';
    }

    // Avoid duplicate menus
    const existingMenu = document.getElementById('petpals-user-dropdown');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.id = 'petpals-user-dropdown';
    menu.className = 'hidden absolute right-0 top-full mt-2 w-64 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/40 py-2 z-[999] transition-all origin-top-right overflow-hidden';
    menu.innerHTML = `
      <div class="px-4 py-3.5 border-b border-outline-variant/30 flex items-center gap-3 bg-surface-container-low/40">
        <img id="dropdown-user-avatar" src="${PetPalsStore.getDisplayAvatar(user)}" class="w-10 h-10 rounded-full object-cover shadow-xs border border-outline-variant/40 bg-surface-container shrink-0" alt="User">
        <div class="flex flex-col min-w-0">
          <span id="dropdown-user-name" class="font-label-lg text-label-lg font-semibold text-on-surface truncate leading-tight">${escapeHtml(user.name || user.firstName || 'Pet Parent')}</span>
          <span id="dropdown-user-email" class="font-body-sm text-body-sm text-on-surface-variant truncate mt-0.5">${escapeHtml(user.email || 'Signed in')}</span>
        </div>
      </div>
      <div class="py-1.5 px-1.5">
        <a href="/profile" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-on-surface hover:bg-surface-container font-label-md text-label-md transition-all duration-150 group">
          <span class="material-symbols-outlined text-[20px] text-primary group-hover:scale-105 transition-transform" style="font-variation-settings: 'FILL' 1;">person</span>
          <span class="font-medium">Profile</span>
        </a>
      </div>
      <div class="border-t border-outline-variant/30 pt-1.5 pb-0.5 px-1.5">
        <button type="button" id="dropdown-logout-btn" class="w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-error hover:bg-error-container/30 font-label-md text-label-md transition-all duration-150 group cursor-pointer">
          <span class="material-symbols-outlined text-[20px] text-error group-hover:translate-x-0.5 transition-transform">logout</span>
          <span class="font-semibold">Logout</span>
        </button>
      </div>
    `;

    (parent || pill).appendChild(menu);

    const chevron = pill.querySelector('.material-symbols-outlined');

    function toggleMenu(forceOpen) {
      const willOpen = typeof forceOpen === 'boolean' ? forceOpen : menu.classList.contains('hidden');
      if (willOpen) {
        menu.classList.remove('hidden');
        pill.setAttribute('aria-expanded', 'true');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
      } else {
        menu.classList.add('hidden');
        pill.setAttribute('aria-expanded', 'false');
        if (chevron) chevron.style.transform = '';
      }
    }

    pill.setAttribute('role', 'button');
    pill.setAttribute('aria-haspopup', 'true');
    pill.setAttribute('aria-expanded', 'false');
    pill.style.cursor = 'pointer';

    pill.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      toggleMenu();
    };

    menu.querySelector('#dropdown-logout-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu(false);
      PetPalsStore.logout();
    });

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !pill.contains(e.target)) {
        toggleMenu(false);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.classList.contains('hidden')) {
        toggleMenu(false);
      }
    });
  }

  // Concierge & Hotline Modal
  function initNeedAssistanceModal() {
    let modal = document.getElementById('petpals-assistance-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'petpals-assistance-modal';
      modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm hidden';
      modal.innerHTML = `
        <div class="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl flex flex-col gap-6 relative animate-in fade-in zoom-in duration-200">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-secondary-container/40 flex items-center justify-center text-primary">
                <span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1;">support_agent</span>
              </div>
              <div>
                <h3 class="font-headline-sm text-headline-sm text-on-surface font-display">Need Assistance?</h3>
                <p class="font-body-sm text-body-sm text-on-surface-variant">24/7 Veterinary & Concierge Hotline</p>
              </div>
            </div>
            <button id="close-assistance-btn" class="p-1 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors" type="button">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          
          <div class="flex flex-col gap-3 bg-surface-container-low rounded-2xl p-4">
            <div class="flex items-center justify-between">
              <span class="font-label-sm text-label-sm text-outline uppercase font-semibold">Emergency & Concierge</span>
              <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-label-sm text-label-sm font-semibold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span> Available Now
              </span>
            </div>
            <div class="flex items-center gap-3 mt-1">
              <span class="material-symbols-outlined text-primary text-2xl">call</span>
              <a href="tel:18007387257" class="font-headline-md text-headline-md text-primary font-bold hover:underline">1-800-PET-PALS</a>
            </div>
            <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Connect immediately with licensed veterinary triage specialists or sanctuary concierges.
            </p>
          </div>

          <div class="flex flex-col gap-2.5">
            <button id="assistance-chat-btn" class="w-full py-3 px-5 rounded-full bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary-container hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-[20px]">chat</span>
              <span>Start Instant Concierge Chat</span>
            </button>
            <a href="/book-service" class="w-full py-2.5 px-5 rounded-full bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-colors text-center">
              Book Urgent Service
            </a>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
      document.getElementById('close-assistance-btn')?.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
      document.getElementById('assistance-chat-btn')?.addEventListener('click', () => {
        modal.classList.add('hidden');
        try {
          const user = PetPalsStore.getUser() || {};
          const msgsKey = 'petpals_admin_messages';
          const existing = JSON.parse(localStorage.getItem(msgsKey) || '[]');
          existing.unshift({
            id: 'msg-' + Date.now(),
            name: user.name || 'Pet Parent',
            email: user.email || 'user@example.com',
            phone: user.phone || '',
            date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            subject: 'Concierge Hotline Chat Request',
            message: 'Client connected via 24/7 Veterinary & Concierge Hotline. Needs immediate assistance or advice for their pets.',
            status: 'Unread',
            reply: ''
          });
          localStorage.setItem(msgsKey, JSON.stringify(existing));
          window.dispatchEvent(new CustomEvent('petpals:admin-messages-updated'));
        } catch (e) {}
        showToast('Concierge connected! An agent will message you momentarily.', 'forum');
      });
    }

    // Attach ONLY to explicit sidebar Need Assistance widget cards
    document.querySelectorAll('aside div.bg-surface-container-lowest\\/60, aside [data-action="assistance"], aside #sidebar-assistance-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        modal.classList.remove('hidden');
      });
    });

    // Also attach to explicit hotline buttons if explicitly marked
    document.querySelectorAll('[data-action="open-assistance-modal"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        modal.classList.remove('hidden');
      });
    });

    // Expose explicit helper
    window.openAssistanceModal = function() {
      modal.classList.remove('hidden');
    };
  }

  // Interactive Live Search Bar
  function initHeaderSearch() {
    const searchInputs = document.querySelectorAll('header input[type="text"]');
    searchInputs.forEach(input => {
      const container = input.closest('.relative') || input.parentElement;
      if (!container) return;

      let resultsBox = document.getElementById('petpals-search-results');
      if (!resultsBox) {
        resultsBox = document.createElement('div');
        resultsBox.id = 'petpals-search-results';
        resultsBox.className = 'absolute left-0 right-0 top-12 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/40 py-2 hidden z-50 max-h-80 overflow-y-auto';
        container.appendChild(resultsBox);
      }

      input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        if (!query) {
          resultsBox.classList.add('hidden');
          // Also dispatch event for page-specific filters
          window.dispatchEvent(new CustomEvent('petpals:search', { detail: '' }));
          return;
        }

        window.dispatchEvent(new CustomEvent('petpals:search', { detail: query }));

        const pets = PetPalsStore.getPets();
        const services = [
          { title: 'Grooming & Spa Experience', desc: 'Bathing, styling, ear cleaning', path: '/services' },
          { title: 'Veterinary Checkup & Vaccines', desc: 'Comprehensive wellness exam', path: '/services' },
          { title: 'Dental Hygiene & Scaling', desc: 'Preventative oral health', path: '/services' },
          { title: 'Sanctuary Daycare & Boarding', desc: 'Luxury stays and play areas', path: '/services' }
        ];

        const matchedPets = pets.filter(p => 
          p.name.toLowerCase().includes(query) || 
          p.species.toLowerCase().includes(query) || 
          (p.breed && p.breed.toLowerCase().includes(query))
        );

        const matchedServices = services.filter(s => 
          s.title.toLowerCase().includes(query) || 
          s.desc.toLowerCase().includes(query)
        );

        if (matchedPets.length === 0 && matchedServices.length === 0) {
          resultsBox.innerHTML = `
            <div class="px-4 py-3 text-center text-on-surface-variant font-body-sm">
              No results found for "<strong>${escapeHtml(query)}</strong>"
            </div>
          `;
        } else {
          let html = '';
          if (matchedPets.length > 0) {
            html += `<div class="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-outline">Pets</div>`;
            matchedPets.forEach(p => {
              html += `
                <a href="/profile" class="flex items-center gap-3 px-4 py-2 hover:bg-surface-container transition-colors">
                  <img src="${p.avatar}" class="w-7 h-7 rounded-full object-cover shadow-xs" alt="${p.name}">
                  <div class="flex flex-col">
                    <span class="font-label-md text-on-surface font-semibold">${p.name}</span>
                    <span class="text-[11px] text-on-surface-variant">${p.species} • ${p.breed || p.age}</span>
                  </div>
                </a>
              `;
            });
          }
          if (matchedServices.length > 0) {
            html += `<div class="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-outline ${matchedPets.length ? 'mt-2 border-t border-outline-variant/30 pt-2' : ''}">Services</div>`;
            matchedServices.forEach(s => {
              html += `
                <a href="${s.path}" class="flex items-center gap-3 px-4 py-2 hover:bg-surface-container transition-colors">
                  <span class="material-symbols-outlined text-primary text-[18px]">spa</span>
                  <div class="flex flex-col">
                    <span class="font-label-md text-on-surface font-semibold">${s.title}</span>
                    <span class="text-[11px] text-on-surface-variant">${s.desc}</span>
                  </div>
                </a>
              `;
            });
          }
          resultsBox.innerHTML = html;
        }

        resultsBox.classList.remove('hidden');
      });

      document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
          resultsBox.classList.add('hidden');
        }
      });
    });
  }

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // Sidebar navigation wiring
  function initSidebarNav() {
    const navRoutes = {
      'dashboard': '/dashboard',
      'my-bookings': '/my-bookings',
      'my-pets': '/my-pets',
      'services': '/services',
      'profile': '/profile',
      'logout': '/'
    };

    document.querySelectorAll('aside nav a[data-path]').forEach(link => {
      const p = link.getAttribute('data-path');
      if (navRoutes[p]) link.href = navRoutes[p];
    });

    document.querySelectorAll('aside a[data-path="logout"]').forEach(link => {
      link.href = '/login';
      link.addEventListener('click', (e) => {
        e.preventDefault();
        PetPalsStore.logout();
      });
    });

    // Logo click goes to dashboard
    document.querySelectorAll('aside .text-primary.tracking-tight, aside .text-primary').forEach(el => {
      const parent = el.closest('div.flex.items-center');
      if (parent) {
        parent.style.cursor = 'pointer';
        parent.addEventListener('click', () => { window.location.href = '/dashboard'; });
      }
    });

    // Book New Service button
    document.querySelectorAll('header button').forEach(btn => {
      if (btn.textContent.trim().includes('Book New Service')) {
        btn.addEventListener('click', () => { window.location.href = '/book-service'; });
      }
    });
  }

  // Global sync listeners
  window.addEventListener('petpals:user-updated', (e) => {
    if (window.location.pathname.startsWith('/admin')) return;
    const u = e.detail;
    document.querySelectorAll('#dropdown-user-name').forEach(el => el.textContent = u.name);
    document.querySelectorAll('#dropdown-user-email').forEach(el => el.textContent = u.email);
    const avatarSrc = PetPalsStore.getDisplayAvatar(u);
    document.querySelectorAll('#dropdown-user-avatar').forEach(img => img.src = avatarSrc);
    document.querySelectorAll('header img').forEach(img => { if (img.alt === 'Profile') img.src = avatarSrc; });
    document.querySelectorAll('header .font-label-lg.text-on-surface').forEach(span => {
      if (span.textContent !== 'Book New Service') span.textContent = u.firstName || u.name;
    });
  });

  // Export to window
  window.PetPalsStore = PetPalsStore;
  window.toast = showToast;
  window.modal = showModal;
  window.PetPalsUI = {
    toast: showToast,
    modal: showModal,
    openModal(id) { document.getElementById(id)?.classList.remove('hidden'); },
    closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }
  };

  // Run on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    // Admin pages have their own identity and session; never initialize the
    // normal-user header or synchronize normal-user state there.
    if (window.location.pathname.startsWith('/admin')) return;
    initHeaderUserMenu();
    initNeedAssistanceModal();
    initHeaderSearch();
    initSidebarNav();
    PetPalsStore.syncFromBackend();
  });

})(window);
