import { formatCurrency, formatDateId } from "./utils";

function buildLink(number: string, text: string): string {
  const clean = number.replace(/[^0-9]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

export interface BookingWaInput {
  refNumber: string;
  bookerName: string;
  courtName: string;
  courtType: string;
  dateKey: string;
  startTime: string;
  duration: number;
  players: number;
  addons: string[];
  estimatedTotal: number;
}

/** Link the booker uses to message the club after submitting a request. */
export function bookerToClubLink(clubWa: string, b: BookingWaInput): string {
  const addons = b.addons.length ? b.addons.join(", ") : "Tidak ada";
  const text = `Halo Vista Padel! Saya ingin konfirmasi booking saya.

📋 *Booking Request*
Ref: ${b.refNumber}
Nama: ${b.bookerName}
Court: ${b.courtName} (${b.courtType})
Tanggal: ${formatDateId(b.dateKey)}
Waktu: ${b.startTime} (${b.duration} jam)
Pemain: ${b.players} orang
Add-ons: ${addons}
Total Estimasi: ${formatCurrency(b.estimatedTotal)}

Mohon konfirmasi pembayaran. Terima kasih!`;
  return buildLink(clubWa, text);
}

/** Link the admin uses to contact the booker (with payment template). */
export function bookerWaLink(bookerWa: string, b: BookingWaInput, paymentTemplate: string) {
  const text = `Halo ${b.bookerName}! Ini tim Vista Padel Club.

Booking kamu sudah kami terima (Ref: ${b.refNumber}).
Court: ${b.courtName} | ${formatDateId(b.dateKey)} | ${b.startTime} (${b.duration} jam)
Total: ${formatCurrency(b.estimatedTotal)}

${paymentTemplate}

Setelah transfer, kirim bukti ke sini ya. Terima kasih!`;
  return buildLink(bookerWa, text);
}

export function simpleWaLink(number: string, message: string): string {
  return buildLink(number, message);
}

export function memberConfirmationLink(
  waNumber: string,
  data: {
    refNumber: string;
    name: string;
    planName: string;
    billingPeriod: string;
    startDate: string;
    expiresAt: string;
    clubName: string;
  }
): string {
  const text = `✅ *${data.clubName} — Membership Confirmed*

Halo ${data.name}! Membership kamu sudah aktif.

📋 *Detail Membership*
Ref: ${data.refNumber}
Plan: ${data.planName} · ${data.billingPeriod}
Mulai: ${data.startDate}
Berlaku s/d: ${data.expiresAt}

_Tunjukkan pesan ini di front desk sebagai bukti membership._

Selamat bergabung! 🎾`;
  return buildLink(waNumber, text);
}
