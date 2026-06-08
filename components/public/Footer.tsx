import Link from "next/link";
import { simpleWaLink } from "@/lib/whatsapp";

export interface FooterProps {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  weekdayHours: string;
  weekendHours: string;
}

export function Footer(p: FooterProps) {
  return (
    <footer className="bg-brand-dark text-white/80">
      <div className="container-vp grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-1 text-lg font-bold text-white">
            <span>{p.businessName.replace(/ Club$/, "")}</span>
            <span className="h-2 w-2 rounded-full bg-brand-accent" />
          </div>
          <p className="mt-3 text-sm leading-relaxed">{p.address}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Explore
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/schedule" className="hover:text-brand-accent">Schedule</Link></li>
            <li><Link href="/coaching" className="hover:text-brand-accent">Coaching</Link></li>
            <li><Link href="/facilities" className="hover:text-brand-accent">Facilities</Link></li>
            <li><Link href="/membership" className="hover:text-brand-accent">Membership</Link></li>
            <li><Link href="/contact" className="hover:text-brand-accent">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Contact
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><a href={`tel:${p.phone}`} className="hover:text-brand-accent">{p.phone}</a></li>
            <li><a href={`mailto:${p.email}`} className="hover:text-brand-accent">{p.email}</a></li>
            <li>
              <a href={simpleWaLink(p.whatsapp, "Halo Vista Padel!")} target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent">
                WhatsApp
              </a>
            </li>
          </ul>
          <div className="mt-4 flex gap-3 text-sm">
            <a href={`https://instagram.com/${p.instagram}`} target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent">Instagram</a>
            <a href={`https://facebook.com/${p.facebook}`} target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent">Facebook</a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Opening Hours
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>Mon–Fri: {p.weekdayHours}</li>
            <li>Sat–Sun: {p.weekendHours}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-vp flex flex-col items-center justify-between gap-2 py-6 text-xs text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} {p.businessName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
