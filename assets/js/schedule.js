/* ── Vista Padel Club — schedule.js ── */

let allSchedules = [];
let allCourts = [];
let selectedDate = null;
let selectedCourt = null;
let selectedSlot = null;

async function initSchedulePage() {
  try {
    const [schedRes, courtRes] = await Promise.all([
      fetch('assets/data/schedule.json'),
      fetch('assets/data/courts.json'),
    ]);
    allSchedules = await schedRes.json();
    allCourts = await courtRes.json();

    renderDateButtons();
    selectDate(allSchedules[0]?.date);
    initModalClose();
  } catch (e) {
    console.error('Failed to load schedule data', e);
  }
}

function renderDateButtons() {
  const container = document.getElementById('date-nav');
  if (!container) return;
  container.innerHTML = allSchedules.map(s => `
    <button class="date-btn" data-date="${s.date}" onclick="selectDate('${s.date}')">
      ${formatDateShort(s.date)}
    </button>`).join('');
}

function selectDate(date) {
  selectedDate = date;
  selectedSlot = null;
  selectedCourt = null;

  document.querySelectorAll('.date-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.date === date);
  });

  const scheduleData = allSchedules.find(s => s.date === date);
  renderScheduleGrid(scheduleData);

  const label = document.getElementById('selected-date-label');
  if (label) label.textContent = formatDateLabel(date);
}

function renderScheduleGrid(scheduleData) {
  const grid = document.getElementById('schedule-grid');
  if (!grid) return;

  grid.innerHTML = allCourts.map(court => {
    const courtSched = scheduleData?.slots.find(s => s.court_id === court.id);
    const bookedSlots = courtSched?.booked || [];
    const pricing = CONFIG.pricing[court.id] || { normal: 100000, peak: 150000 };

    const slotsHTML = CONFIG.timeSlots.map(slot => {
      const isBooked = bookedSlots.includes(slot);
      const isPeak = CONFIG.isPeakHour(slot);
      const price = isPeak ? pricing.peak : pricing.normal;
      const classes = [
        'sched-slot',
        isBooked ? 'sched-slot--booked' : 'sched-slot--avail',
        isPeak && !isBooked ? 'sched-slot--peak' : '',
      ].filter(Boolean).join(' ');

      if (isBooked) {
        return `<div class="${classes}"><span>${slot}</span><span>Booked</span></div>`;
      }
      return `
        <div class="${classes}" data-court="${court.id}" data-slot="${slot}"
          onclick="selectSlot('${court.id}','${slot}')">
          <span>${slot}</span>
          <span>${CONFIG.formatCurrency(price)}</span>
        </div>`;
    }).join('');

    return `
      <div class="sched-col" id="col-${court.id}">
        <div class="sched-col__head">
          <div>${court.name}</div>
          <div class="sched-col__type">${court.type}</div>
        </div>
        <div class="sched-col__slots">${slotsHTML}</div>
      </div>`;
  }).join('');
}

function selectSlot(courtId, slot) {
  // Deselect previous
  document.querySelectorAll('.sched-slot--selected').forEach(el => {
    el.classList.remove('sched-slot--selected');
  });

  selectedCourt = courtId;
  selectedSlot = slot;

  const el = document.querySelector(`.sched-slot[data-court="${courtId}"][data-slot="${slot}"]`);
  if (el) el.classList.add('sched-slot--selected');

  openBookingModal(courtId, slot);
}

function openBookingModal(courtId, slot) {
  const court = allCourts.find(c => c.id === courtId);
  if (!court) return;

  // Pre-fill summary
  document.getElementById('modal-court').textContent = court.name;
  document.getElementById('modal-date').textContent = formatDateLabel(selectedDate);
  document.getElementById('modal-slot').textContent = slot;
  document.getElementById('modal-type').textContent = court.type;

  // Set hidden form fields
  const formCourt = document.getElementById('form-court');
  const formDate = document.getElementById('form-date');
  const formSlot = document.getElementById('form-slot');
  if (formCourt) formCourt.value = `${court.name} (${court.type})`;
  if (formDate) formDate.value = formatDateLabel(selectedDate);
  if (formSlot) formSlot.value = slot;

  calculatePrice();

  const overlay = document.getElementById('booking-modal');
  if (overlay) overlay.classList.add('open');
}

function closeModal() {
  const overlay = document.getElementById('booking-modal');
  if (overlay) overlay.classList.remove('open');
}

function initModalClose() {
  const overlay = document.getElementById('booking-modal');
  if (!overlay) return;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function calculatePrice() {
  if (!selectedCourt || !selectedSlot) return;

  const pricing = CONFIG.pricing[selectedCourt] || { normal: 100000, peak: 150000 };
  const hourlyRate = CONFIG.isPeakHour(selectedSlot) ? pricing.peak : pricing.normal;
  const duration = parseInt(document.getElementById('form-duration')?.value || 1);

  let courtFee = hourlyRate * duration;
  let addons = 0;

  if (document.getElementById('addon-racket')?.checked) addons += CONFIG.addons.racketRental;
  if (document.getElementById('addon-ball')?.checked)   addons += CONFIG.addons.ballRental;
  if (document.getElementById('addon-coaching')?.checked) addons += CONFIG.addons.coaching;

  const total = courtFee + addons;

  // Update price breakdown
  const el = (id) => document.getElementById(id);
  if (el('price-rate'))     el('price-rate').textContent     = `${CONFIG.formatCurrency(hourlyRate)} × ${duration}h`;
  if (el('price-court'))    el('price-court').textContent    = CONFIG.formatCurrency(courtFee);
  if (el('price-addons'))   el('price-addons').textContent   = CONFIG.formatCurrency(addons);
  if (el('price-total'))    el('price-total').textContent    = CONFIG.formatCurrency(total);
}

function submitBooking() {
  const name    = document.getElementById('form-name')?.value.trim();
  const wa      = document.getElementById('form-wa')?.value.trim();
  const players = document.getElementById('form-players')?.value || '4';
  const duration= document.getElementById('form-duration')?.value || '1';
  const notes   = document.getElementById('form-notes')?.value.trim();
  const court   = document.getElementById('form-court')?.value;
  const date    = document.getElementById('form-date')?.value;
  const slot    = document.getElementById('form-slot')?.value;

  if (!name || !wa) {
    alert('Please fill in your name and WhatsApp number.');
    return;
  }

  // Calculate end time
  const [h, m] = slot.split(':').map(Number);
  const endH = h + parseInt(duration);
  const endSlot = `${String(endH).padStart(2,'0')}:${String(m).padStart(2,'0')}`;

  // Addons
  const addonsArr = [];
  if (document.getElementById('addon-racket')?.checked)   addonsArr.push('Racket Rental');
  if (document.getElementById('addon-ball')?.checked)     addonsArr.push('Ball Rental');
  if (document.getElementById('addon-coaching')?.checked) addonsArr.push('Coaching Request');

  const pricing = CONFIG.pricing[selectedCourt] || { normal: 100000, peak: 150000 };
  const rate = CONFIG.isPeakHour(selectedSlot) ? pricing.peak : pricing.normal;
  let total = rate * parseInt(duration);
  if (document.getElementById('addon-racket')?.checked)   total += CONFIG.addons.racketRental;
  if (document.getElementById('addon-ball')?.checked)     total += CONFIG.addons.ballRental;
  if (document.getElementById('addon-coaching')?.checked) total += CONFIG.addons.coaching;

  const msg = [
    `Halo ${CONFIG.businessName} 👋`,
    ``,
    `Saya ingin melakukan *booking lapangan padel*:`,
    ``,
    `👤 *Nama:* ${name}`,
    `📅 *Tanggal:* ${date}`,
    `🏟️ *Lapangan:* ${court}`,
    `⏰ *Sesi:* ${slot} – ${endSlot}`,
    `⏱️ *Durasi:* ${duration} Jam`,
    `👥 *Jumlah Pemain:* ${players} Orang`,
    addonsArr.length ? `🎒 *Add-ons:* ${addonsArr.join(', ')}` : null,
    notes ? `📝 *Catatan:* ${notes}` : null,
    ``,
    `💰 *Estimasi Total:* ${CONFIG.formatCurrency(total)}`,
    ``,
    `Mohon konfirmasi ketersediaan dan detail pembayaran. Terima kasih! 🙏`,
  ].filter(l => l !== null).join('\n');

  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  closeModal();
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', initSchedulePage);
