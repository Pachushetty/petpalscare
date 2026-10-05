const fs = require('fs');
let content = fs.readFileSync('profile.html', 'utf8');

// Remove the old simple script block (lines 193-218)
const oldScriptStart = content.indexOf('<script>\n  (function() {\n    const modal = document.getElementById(\'pet-modal\');');
const oldScriptEnd = content.indexOf('</script></div></main></div>', oldScriptStart) + '</script></div></main></div>'.length;

if (oldScriptStart === -1) {
  console.log('Old script not found — checking...');
  const s = content.indexOf("const modal = document.getElementById('pet-modal')");
  console.log('modal var at:', s);
  console.log('Context:', content.slice(s-20, s+200));
  process.exit(1);
}

console.log('Removing old script block from', oldScriptStart, 'to', oldScriptEnd);

// Replace with modals + full functionality script
const newCode = `
<!-- EDIT PROFILE MODAL -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/30 backdrop-blur-sm hidden" id="edit-profile-modal">
  <div class="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-xl flex flex-col gap-5">
    <div class="flex items-center justify-between">
      <h3 class="font-headline-sm text-headline-sm text-on-surface">Edit Profile</h3>
      <button class="p-1 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors" id="close-edit-profile" type="button"><span class="material-symbols-outlined text-[20px]">close</span></button>
    </div>
    <form id="edit-profile-form" class="flex flex-col gap-4">
      <div><label class="block font-label-sm text-label-sm text-on-surface-variant mb-1">Full Name</label><input id="edit-name" class="w-full px-4 py-2.5 rounded-full bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30" type="text" value="Prathiksha Shetty"/></div>
      <div><label class="block font-label-sm text-label-sm text-on-surface-variant mb-1">Email Address</label><input id="edit-email" class="w-full px-4 py-2.5 rounded-full bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30" type="email" value="prathiksha@gmail.com"/></div>
      <div><label class="block font-label-sm text-label-sm text-on-surface-variant mb-1">Phone Number</label><input id="edit-phone" class="w-full px-4 py-2.5 rounded-full bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30" type="tel" value="+91 98765 43210"/></div>
      <div><label class="block font-label-sm text-label-sm text-on-surface-variant mb-1">Location</label><input id="edit-location" class="w-full px-4 py-2.5 rounded-full bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30" type="text" value="Mangalore, Karnataka"/></div>
      <div class="flex items-center justify-end gap-3 pt-2">
        <button class="px-5 py-2 rounded-full text-on-surface-variant font-label-md text-label-md hover:bg-surface-container transition-colors" id="cancel-edit-profile" type="button">Cancel</button>
        <button class="px-6 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all" type="submit">Save Changes</button>
      </div>
    </form>
  </div>
</div>

<!-- CHANGE PASSWORD MODAL -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/30 backdrop-blur-sm hidden" id="change-password-modal">
  <div class="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-xl flex flex-col gap-5">
    <div class="flex items-center justify-between">
      <h3 class="font-headline-sm text-headline-sm text-on-surface">Change Password</h3>
      <button class="p-1 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors" id="close-change-pwd" type="button"><span class="material-symbols-outlined text-[20px]">close</span></button>
    </div>
    <form id="change-pwd-form" class="flex flex-col gap-4">
      <div><label class="block font-label-sm text-label-sm text-on-surface-variant mb-1">Current Password</label><input class="w-full px-4 py-2.5 rounded-full bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30" type="password" placeholder="Enter current password"/></div>
      <div><label class="block font-label-sm text-label-sm text-on-surface-variant mb-1">New Password</label><input id="new-pwd" class="w-full px-4 py-2.5 rounded-full bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30" type="password" placeholder="Enter new password"/></div>
      <div><label class="block font-label-sm text-label-sm text-on-surface-variant mb-1">Confirm New Password</label><input id="confirm-pwd" class="w-full px-4 py-2.5 rounded-full bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30" type="password" placeholder="Re-enter new password"/></div>
      <p id="pwd-error" class="text-xs text-red-500 hidden">Passwords do not match.</p>
      <div class="flex items-center justify-end gap-3 pt-2">
        <button class="px-5 py-2 rounded-full text-on-surface-variant font-label-md text-label-md hover:bg-surface-container transition-colors" id="cancel-change-pwd" type="button">Cancel</button>
        <button class="px-6 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all" type="submit">Update Password</button>
      </div>
    </form>
  </div>
</div>

<!-- EDIT PET MODAL -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/30 backdrop-blur-sm hidden" id="edit-pet-modal">
  <div class="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-xl flex flex-col gap-5">
    <div class="flex items-center justify-between">
      <h3 class="font-headline-sm text-headline-sm text-on-surface">Edit Pet</h3>
      <button class="p-1 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors" id="close-edit-pet" type="button"><span class="material-symbols-outlined text-[20px]">close</span></button>
    </div>
    <form id="edit-pet-form" class="flex flex-col gap-4">
      <div><label class="block font-label-sm text-label-sm text-on-surface-variant mb-1">Pet Name</label><input id="edit-pet-name" class="w-full px-4 py-2.5 rounded-full bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30" type="text"/></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="block font-label-sm text-label-sm text-on-surface-variant mb-1">Species</label><select id="edit-pet-species" class="w-full px-4 py-2.5 rounded-full bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30"><option>Dog</option><option>Cat</option><option>Bird</option><option>Other</option></select></div>
        <div><label class="block font-label-sm text-label-sm text-on-surface-variant mb-1">Age</label><input id="edit-pet-age" class="w-full px-4 py-2.5 rounded-full bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30" type="text"/></div>
      </div>
      <div class="flex items-center justify-end gap-3 pt-2">
        <button class="px-5 py-2 rounded-full text-on-surface-variant font-label-md text-label-md hover:bg-surface-container transition-colors" id="cancel-edit-pet" type="button">Cancel</button>
        <button class="px-6 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all" type="submit">Save Pet</button>
      </div>
    </form>
  </div>
</div>

<!-- DELETE PET CONFIRMATION MODAL -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/30 backdrop-blur-sm hidden" id="delete-pet-modal">
  <div class="bg-surface-container-lowest rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl flex flex-col gap-4">
    <div class="flex items-center gap-3"><span class="material-symbols-outlined text-error text-3xl">warning</span><h3 class="font-headline-sm text-headline-sm text-on-surface">Delete Pet?</h3></div>
    <p class="font-body-md text-body-md text-on-surface-variant">Are you sure you want to remove <strong id="delete-pet-name"></strong> from your profile? This cannot be undone.</p>
    <div class="flex items-center justify-end gap-3 pt-1">
      <button class="px-5 py-2 rounded-full text-on-surface-variant font-label-md text-label-md hover:bg-surface-container transition-colors" id="cancel-delete-pet" type="button">Cancel</button>
      <button class="px-6 py-2.5 rounded-full bg-error text-white font-label-md text-label-md hover:bg-red-700 transition-all" id="confirm-delete-pet" type="button">Delete</button>
    </div>
  </div>
</div>

<!-- SUCCESS TOAST -->
<div id="success-toast" class="fixed bottom-6 right-6 bg-surface-container-lowest border border-outline-variant/60 shadow-lg rounded-2xl px-4 py-3 flex items-center gap-3 transition-all duration-300 translate-y-20 opacity-0 pointer-events-none z-[60]">
  <span class="material-symbols-outlined text-primary text-xl">check_circle</span>
  <span id="toast-msg" class="font-label-md text-label-md text-on-surface">Saved!</span>
</div>

</div></main></div>
<script>
(function() {
  // TOAST
  function showToast(msg) {
    const t = document.getElementById('success-toast');
    document.getElementById('toast-msg').textContent = msg || 'Saved!';
    t.classList.remove('translate-y-20','opacity-0','pointer-events-none');
    t.classList.add('translate-y-0','opacity-100','pointer-events-auto');
    setTimeout(() => { t.classList.add('translate-y-20','opacity-0','pointer-events-none'); t.classList.remove('translate-y-0','opacity-100','pointer-events-auto'); }, 3000);
  }
  // MODAL HELPERS
  function openModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
  function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }
  ['edit-profile-modal','change-password-modal','edit-pet-modal','delete-pet-modal','pet-modal'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', function(e) { if (e.target === this) closeModal(id); });
  });

  // EDIT PROFILE - open from both "Edit Profile" button and small "Edit" chip
  document.querySelectorAll('button').forEach(btn => {
    const t = btn.textContent.trim();
    if (t === 'Edit Profile') btn.addEventListener('click', () => openModal('edit-profile-modal'));
    if (t === 'Edit' && btn.closest('section') && !btn.closest('.flex.items-center.gap-3')) btn.addEventListener('click', () => openModal('edit-profile-modal'));
    if (t === 'Change Password') btn.addEventListener('click', () => openModal('change-password-modal'));
  });
  document.getElementById('close-edit-profile')?.addEventListener('click', () => closeModal('edit-profile-modal'));
  document.getElementById('cancel-edit-profile')?.addEventListener('click', () => closeModal('edit-profile-modal'));
  document.getElementById('edit-profile-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('edit-name').value;
    const email = document.getElementById('edit-email').value;
    const phone = document.getElementById('edit-phone').value;
    const loc = document.getElementById('edit-location').value;
    // Update displayed values
    document.querySelector('h2.font-headline-sm')?.childNodes.forEach?.(n => { if (n.nodeType === 3) n.textContent = name; });
    const h2 = document.querySelector('h2.font-headline-sm');
    if (h2) { const chip = h2.querySelector('button'); h2.textContent = ''; if (chip) h2.appendChild(chip); h2.insertBefore(document.createTextNode(name + ' '), chip); }
    document.querySelectorAll('section .flex.flex-col span:not(.material-symbols-outlined)').forEach(s => {
      if (s.textContent.includes('@')) s.textContent = email;
      if (s.textContent.match(/\\+\\d/)) s.textContent = phone;
      if (s.textContent.match(/Karnataka|Mangalore|[A-Z][a-z]+,/)) s.textContent = loc;
    });
    closeModal('edit-profile-modal');
    showToast('Profile updated successfully!');
  });

  // CHANGE PASSWORD
  document.getElementById('close-change-pwd')?.addEventListener('click', () => closeModal('change-password-modal'));
  document.getElementById('cancel-change-pwd')?.addEventListener('click', () => closeModal('change-password-modal'));
  document.getElementById('change-pwd-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const newPwd = document.getElementById('new-pwd').value;
    const confirmPwd = document.getElementById('confirm-pwd').value;
    const errEl = document.getElementById('pwd-error');
    if (newPwd !== confirmPwd) { errEl.classList.remove('hidden'); return; }
    errEl.classList.add('hidden');
    closeModal('change-password-modal');
    showToast('Password updated successfully!');
    this.reset();
  });

  // PHOTO UPLOAD
  document.querySelector('button[aria-label="Upload photo"]')?.addEventListener('click', function() {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = function(e) {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = function(ev) {
        const avatarDiv = document.querySelector('.relative.w-24.h-24');
        if (avatarDiv) {
          let img = avatarDiv.querySelector('img.pp-photo');
          if (!img) { img = document.createElement('img'); img.className = 'pp-photo w-full h-full object-cover absolute inset-0 rounded-full'; avatarDiv.prepend(img); }
          img.src = ev.target.result;
        }
        showToast('Profile photo updated!');
      };
      reader.readAsDataURL(file);
    };
    inp.click();
  });

  // PET EDIT & DELETE
  let currentPetCard = null;
  document.querySelectorAll('.grid.grid-cols-1 > .bg-surface-container-lowest').forEach(card => {
    const petName = card.querySelector('h3')?.textContent?.trim() || '';
    const ageSpans = card.querySelectorAll('.flex.items-center.gap-2.text-on-surface-variant span');
    const petSpecies = ageSpans[0]?.textContent?.trim() || 'Dog';
    const petAge = ageSpans[2]?.textContent?.trim() || '';
    const btns = card.querySelectorAll('.flex.items-center.gap-3 button');
    const editBtn = btns[0]; const deleteBtn = btns[1];
    if (editBtn) editBtn.addEventListener('click', () => {
      currentPetCard = card;
      document.getElementById('edit-pet-name').value = petName;
      const sel = document.getElementById('edit-pet-species');
      [...sel.options].forEach((o,i) => { if (o.value === petSpecies) sel.selectedIndex = i; });
      document.getElementById('edit-pet-age').value = petAge;
      openModal('edit-pet-modal');
    });
    if (deleteBtn) deleteBtn.addEventListener('click', () => {
      currentPetCard = card;
      document.getElementById('delete-pet-name').textContent = petName || 'this pet';
      openModal('delete-pet-modal');
    });
  });
  document.getElementById('close-edit-pet')?.addEventListener('click', () => closeModal('edit-pet-modal'));
  document.getElementById('cancel-edit-pet')?.addEventListener('click', () => closeModal('edit-pet-modal'));
  document.getElementById('edit-pet-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    if (currentPetCard) {
      const h3 = currentPetCard.querySelector('h3');
      if (h3) h3.textContent = document.getElementById('edit-pet-name').value;
      const spans = currentPetCard.querySelectorAll('.flex.items-center.gap-2.text-on-surface-variant span');
      if (spans[0]) spans[0].textContent = document.getElementById('edit-pet-species').value;
      if (spans[2]) spans[2].textContent = document.getElementById('edit-pet-age').value;
    }
    closeModal('edit-pet-modal');
    showToast('Pet updated successfully!');
  });
  document.getElementById('cancel-delete-pet')?.addEventListener('click', () => closeModal('delete-pet-modal'));
  document.getElementById('confirm-delete-pet')?.addEventListener('click', () => {
    if (currentPetCard) {
      currentPetCard.style.transition = 'opacity 0.3s,transform 0.3s';
      currentPetCard.style.opacity = '0'; currentPetCard.style.transform = 'scale(0.95)';
      setTimeout(() => currentPetCard.remove(), 300);
    }
    closeModal('delete-pet-modal');
    showToast('Pet removed from your profile.');
  });

  // ADD PET MODAL
  const petModal = document.getElementById('pet-modal');
  document.getElementById('open-add-pet-modal')?.addEventListener('click', () => openModal('pet-modal'));
  document.getElementById('close-modal-btn')?.addEventListener('click', () => closeModal('pet-modal'));
  document.getElementById('cancel-modal-btn')?.addEventListener('click', () => closeModal('pet-modal'));
  petModal?.querySelector('form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const nameInput = this.querySelector('input[type="text"]');
    const speciesSelect = this.querySelector('select');
    const ageInput = this.querySelectorAll('input[type="text"]')[1];
    const name = nameInput?.value?.trim();
    if (!name) return;
    const species = speciesSelect?.value || 'Dog';
    const age = ageInput?.value?.trim() || '';
    const grid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
    if (grid) {
      const card = document.createElement('div');
      card.className = 'bg-surface-container-lowest rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group';
      card.innerHTML = '<div class="flex items-center gap-5"><div class="relative w-20 h-20 rounded-full overflow-hidden shrink-0 shadow-inner bg-surface-container flex items-center justify-center"><span class="material-symbols-outlined text-5xl text-primary/30" style="font-variation-settings:\'FILL\' 1">pets</span></div><div class="flex flex-col"><div class="flex items-center gap-2"><h3 class="font-headline-sm text-headline-sm text-on-surface">' + name + '</h3><span class="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm">Active</span></div><div class="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm mt-1"><span>' + species + '</span><span class="w-1 h-1 rounded-full bg-outline-variant"></span><span>' + age + '</span></div></div></div><div class="flex items-center gap-3 mt-6 pt-4 bg-surface-container-low/40 rounded-full px-4 py-2 self-stretch"><button class="flex-1 py-1.5 px-4 rounded-full bg-surface-container-lowest text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors shadow-2xs text-center" type="button">Edit</button><button class="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-full bg-error-container/30 text-error font-label-md text-label-md hover:bg-error-container hover:text-on-error-container transition-colors" type="button"><span class="material-symbols-outlined text-[16px]">delete</span><span>Delete</span></button></div>';
      grid.appendChild(card);
    }
    closeModal('pet-modal');
    this.reset();
    showToast(name + ' added successfully! 🐾');
  });

  // SIDEBAR NAV
  const navRoutes = { 'dashboard': '/dashboard', 'my-bookings': '/my-bookings', 'my-pets': '/my-pets', 'services': '/services', 'profile': '/profile', 'logout': '/' };
  document.querySelectorAll('aside nav a[data-path]').forEach(link => { const p = link.getAttribute('data-path'); if (navRoutes[p]) link.href = navRoutes[p]; });
  document.querySelectorAll('aside a[data-path="logout"]').forEach(link => { link.href = '/'; });
  document.querySelectorAll('header button').forEach(btn => { if (btn.textContent.trim().includes('Book New Service')) btn.addEventListener('click', () => { window.location.href = '/book-service'; }); });
  document.querySelectorAll('header .cursor-pointer').forEach(el => { el.style.cursor = 'pointer'; el.addEventListener('click', () => { window.location.href = '/profile'; }); });
})();
</script>`;

content = content.slice(0, oldScriptStart) + newCode;
fs.writeFileSync('profile.html', content);
console.log('Profile page fully wired!');
