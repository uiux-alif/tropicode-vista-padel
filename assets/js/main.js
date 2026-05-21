/* ── Vista Padel Club — main.js ── */

/* Navbar scroll + hamburger */
(function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.nav-mobile');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', mobileNav.classList.contains('open'));
    });
    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target)) mobileNav.classList.remove('open');
    });
  }

  // Active link highlight
  const links = document.querySelectorAll('.navbar__links a, .nav-mobile a');
  links.forEach(link => {
    if (link.href === location.href || link.pathname === location.pathname) {
      link.classList.add('active');
    }
  });
})();

/* Fade-in on scroll */
(function initFadeIn() {
  const els = document.querySelectorAll('.fade-in');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
})();

/* Load courts on home page */
async function loadCourts(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  try {
    const res = await fetch('assets/data/courts.json');
    const courts = await res.json();
    container.innerHTML = courts.map(c => `
      <div class="court-card">
        <div class="court-card__img">
          ${c.badge ? `<span class="court-card__badge ${c.badge === 'VIP' ? 'court-card__badge--vip' : ''}">${c.badge}</span>` : ''}
          <div class="court-card__img-ph">
            ${courtIcon()}
            <span>${c.name} Photo</span>
          </div>
        </div>
        <div class="court-card__body">
          <div class="court-card__type">${c.type}</div>
          <div class="court-card__name">${c.name}</div>
          <div class="court-card__meta">
            <div class="court-card__meta-item">${surfaceIcon()} ${c.surface}</div>
            <div class="court-card__meta-item">${lightIcon()} ${c.lighting}</div>
            <div class="court-card__meta-item">${peopleIcon()} ${c.capacity}</div>
          </div>
          <div class="court-card__features">
            ${c.features.map(f => `<span class="court-card__feat">${f}</span>`).join('')}
          </div>
          <div class="court-card__footer">
            <div class="court-card__price">
              ${CONFIG.formatCurrency(CONFIG.pricing[c.id]?.normal || 0)} <span>/ hour</span>
            </div>
            <a href="schedule.html?court=${c.id}" class="btn btn--green btn--sm">Book Now →</a>
          </div>
        </div>
      </div>`).join('');
  } catch (e) { console.error('Could not load courts', e); }
}

/* Load facilities */
async function loadFacilities(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  try {
    const res = await fetch('assets/data/facilities.json');
    const items = await res.json();
    const icons = { shower:'🚿', lock:'🔒', cafe:'☕', parking:'🅿️', racket:'🏏', shop:'🛍️', wifi:'📶', changing:'👕' };
    container.innerHTML = items.map(f => `
      <div class="facility-card">
        <div class="facility-icon">${icons[f.icon] || '✨'}</div>
        <div class="facility-card__name">${f.name}</div>
        <p class="facility-card__desc">${f.description}</p>
      </div>`).join('');
  } catch (e) { console.error('Could not load facilities', e); }
}

/* Load testimonials */
function loadTestimonials(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const testimonials = [
    { name:'Andi Pratama', role:'Regular Member', rating:5, text:'Vista Padel is hands-down the best padel club in Jakarta. The courts are immaculate, the vibes are great, and the coaches really know their stuff. Booking via WhatsApp is super easy!' },
    { name:'Sinta Dewi', role:'Beginner Player', rating:5, text:'I started as a total beginner and the coaching programs here are incredible. Sarah is so patient and encouraging. Now I play 3 times a week and I\'m obsessed with padel!' },
    { name:'Budi Hartono', role:'Weekend Warrior', rating:5, text:'The facilities blow every other club out of the water. The lounge is perfect for catching up with friends after matches. The booking schedule makes it so easy to plan sessions.' },
  ];
  container.innerHTML = testimonials.map(t => `
    <div class="testi-card">
      <div class="testi-stars">${'★'.repeat(t.rating).split('').map(() => `<span class="testi-star">★</span>`).join('')}</div>
      <p class="testi-text">"${t.text}"</p>
      <div class="testi-author">
        <div class="testi-avatar">${t.name.charAt(0)}</div>
        <div>
          <div class="testi-name">${t.name}</div>
          <div class="testi-role">${t.role}</div>
        </div>
      </div>
    </div>`).join('');
}

/* Schedule mini-preview on home */
async function loadSchedulePreview(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  try {
    const [schedRes, courtsRes] = await Promise.all([
      fetch('assets/data/schedule.json'),
      fetch('assets/data/courts.json'),
    ]);
    const schedules = await schedRes.json();
    const courts = await courtsRes.json();
    const today = schedules[0];
    if (!today) return;

    const dateLabel = formatDateLabel(today.date);
    const previewSlots = ['08:00','09:00','10:00','17:00','18:00','19:00'];

    container.innerHTML = `
      <div class="schedule-mini">
        <div class="schedule-mini__header">
          <div class="schedule-mini__title">Today's Schedule</div>
          <div class="schedule-mini__date">${dateLabel}</div>
        </div>
        <div class="schedule-mini__body">
          ${courts.slice(0,4).map(c => {
            const courtSched = today.slots.find(s => s.court_id === c.id);
            const booked = courtSched?.booked || [];
            return `
              <div class="schedule-mini__row">
                <div class="schedule-mini__court">${c.name}</div>
                <div class="schedule-mini__slots">
                  ${previewSlots.map(slot => {
                    const isBooked = booked.includes(slot);
                    return `<span class="slot-pill ${isBooked ? 'slot-pill--booked' : 'slot-pill--avail'}">${slot}</span>`;
                  }).join('')}
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  } catch (e) { console.error('Could not load schedule preview', e); }
}

/* ── SVG icon helpers ── */
function courtIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>`;
}
function surfaceIcon() {
  return `<svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M1 12h14v2H1z"/><path d="M2 4h12l1 7H1z" opacity=".5"/></svg>`;
}
function lightIcon() {
  return `<svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M8 1a5 5 0 0 1 3.5 8.5L10 11H6l-1.5-1.5A5 5 0 0 1 8 1zm0 13a1 1 0 0 0 1-1H7a1 1 0 0 0 1 1z"/></svg>`;
}
function peopleIcon() {
  return `<svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M7 8A3 3 0 1 0 7 2a3 3 0 0 0 0 6zm-7 6c0-2.8 3.1-5 7-5s7 2.2 7 5H0zm12-6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm2 6h-2.7c-.5-1.4-1.7-2.6-3.3-3.4C11.4 10.2 14 11.7 14 14z"/></svg>`;
}
function checkIcon() {
  return `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="2,9 6,13 14,4"/></svg>`;
}

/* Date formatter */
function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-ID', { weekday:'short', day:'numeric', month:'short' });
}
