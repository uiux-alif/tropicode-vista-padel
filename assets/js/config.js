/* ── Vista Padel Club — Central Config ── */
const CONFIG = {
  businessName: "Vista Padel Club",
  whatsappNumber: "6281234567890",
  currency: "IDR",
  currencySymbol: "Rp",
  address: "Jl. Sudirman No. 88, Jakarta Pusat, DKI Jakarta",
  email: "hello@vistapadel.id",
  phone: "+62 812-3456-7890",
  instagram: "vistapadel",
  facebook: "vistapadel",
  openingHours: { weekday: "07:00 – 23:00", weekend: "06:00 – 23:00" },
  peakHours: { start: 17, end: 22 },
  timeSlots: ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"],
  pricing: {
    courtA:       { normal: 120000, peak: 180000 },
    courtB:       { normal: 120000, peak: 180000 },
    courtC:       { normal: 100000, peak: 150000 },
    courtIndoor:  { normal: 150000, peak: 220000 },
    courtOutdoor: { normal: 90000,  peak: 130000 },
  },
  addons: {
    racketRental: 30000,
    ballRental:   15000,
    coaching:     200000,
  },
  formatCurrency(amount) {
    return `${this.currencySymbol} ${Number(amount).toLocaleString("id-ID")}`;
  },
  isPeakHour(hourStr) {
    const h = parseInt(hourStr.split(":")[0]);
    return h >= this.peakHours.start && h < this.peakHours.end;
  },
};
