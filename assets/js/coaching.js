/* ── Vista Padel Club — coaching.js ── */

async function initCoachingPage() {
  try {
    const res = await fetch('assets/data/coaching.json');
    const coaches = await res.json();
    renderCoaches(coaches);
  } catch (e) {
    console.error('Failed to load coaching data', e);
  }
}

function renderCoaches(coaches) {
  const container = document.getElementById('coaches-grid');
  if (!container) return;

  container.innerHTML = coaches.map(coach => `
    <div class="coach-card">
      <div class="coach-card__img">
        <div class="coach-card__img-ph">
          ${coachIconSVG()}
          <span>${coach.name} Photo</span>
        </div>
      </div>
      <div class="coach-card__body">
        <div class="coach-card__title">${coach.title}</div>
        <div class="coach-card__name">${coach.name}</div>
        <div class="coach-card__exp">${coach.experience} Experience · ${coach.specialty}</div>
        <div class="coach-card__certs">
          ${coach.certifications.map(c => `<span class="coach-card__cert">${c}</span>`).join('')}
        </div>
        <div class="coach-card__programs">
          ${coach.programs.map(p => `
            <div class="coach-card__prog">
              <div class="coach-card__prog-info">
                <div class="coach-card__prog-name">${p.name}</div>
                <div class="coach-card__prog-meta">${p.duration} · ${p.level}</div>
              </div>
              <div class="coach-card__prog-price">${CONFIG.formatCurrency(p.price)}</div>
            </div>`).join('')}
        </div>
        <a href="https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(`Halo, saya ingin mengetahui lebih lanjut tentang program coaching dengan ${coach.name} di ${CONFIG.businessName}. Bisa bantu informasinya? 🙏`)}"
           target="_blank" class="btn btn--pink" style="width:100%;justify-content:center">
          Tanya via WhatsApp →
        </a>
      </div>
    </div>`).join('');
}

function coachIconSVG() {
  return `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64" style="opacity:.35;margin:0 auto 8px">
    <circle cx="32" cy="22" r="14"/>
    <path d="M8 58c0-13.3 10.7-24 24-24s24 10.7 24 24"/>
  </svg>`;
}

document.addEventListener('DOMContentLoaded', initCoachingPage);
