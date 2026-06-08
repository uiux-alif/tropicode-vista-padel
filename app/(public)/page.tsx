import Link from "next/link";
import { getAllContent, getContent } from "@/lib/content";
import {
  getCourts,
  getCoaches,
  getFacilities,
  getTestimonials,
} from "@/lib/data";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CourtCard } from "@/components/public/CourtCard";
import { CoachCard } from "@/components/public/CoachCard";
import { simpleWaLink } from "@/lib/whatsapp";

export const revalidate = 60; // ISR — revalidate every 60s

export default async function HomePage() {
  const [content, courts, coaches, facilities, testimonials] = await Promise.all([
    getAllContent(),
    getCourts(3),
    getCoaches(3),
    getFacilities(),
    getTestimonials(),
  ]);

  const whatsapp = getContent(content, "global.whatsapp");
  const heroBg = getContent(content, "home.hero.bgImage");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: getContent(content, "global.businessName", "Vista Padel Club"),
    description: getContent(content, "home.hero.subheadline"),
    url: siteUrl,
    telephone: getContent(content, "global.phone"),
    email: getContent(content, "global.email"),
    address: {
      "@type": "PostalAddress",
      streetAddress: getContent(content, "global.address"),
      addressLocality: "Jakarta",
      addressCountry: "ID",
    },
    openingHours: [
      getContent(content, "hours.weekday"),
      getContent(content, "hours.weekend"),
    ].filter(Boolean),
    sameAs: [
      `https://instagram.com/${getContent(content, "global.instagram")}`,
      `https://facebook.com/${getContent(content, "global.facebook")}`,
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-dark text-white">
        {heroBg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand to-brand-light" />
        )}
        {/* Decorative layers */}
        <div className="absolute inset-0 bg-grid-faint [background-size:38px_38px] opacity-[0.07]" />
        <div className="absolute -left-24 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full bg-brand-accent/20 blur-[120px]" />
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-brand-light/40 blur-[100px]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/[0.06] to-transparent" />

        <div className="container-vp relative py-28 sm:py-36 lg:py-44">
          <div className="max-w-2xl">
            <div className="animate-fade-in">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                Jakarta · Padel Club
              </span>
            </div>
            <h1 className="mt-6 animate-fade-in font-display text-[2.75rem] font-extrabold leading-[1.04] tracking-tightest animate-delay-100 sm:text-6xl lg:text-7xl">
              {getContent(content, "home.hero.headline")}
            </h1>
            <p className="mt-6 max-w-xl animate-fade-in text-lg leading-relaxed text-white/75 animate-delay-200">
              {getContent(content, "home.hero.subheadline")}
            </p>
            <div className="mt-9 flex animate-fade-in flex-wrap gap-3 animate-delay-300">
              <Link href={getContent(content, "home.hero.cta1.link", "/schedule")} className="btn-accent">
                {getContent(content, "home.hero.cta1.label", "Book a Court")}
              </Link>
              <Link
                href={getContent(content, "home.hero.cta2.link", "/facilities")}
                className="btn border border-white/25 bg-white/5 text-white backdrop-blur hover:bg-white/10"
              >
                {getContent(content, "home.hero.cta2.label", "View Courts")}
              </Link>
            </div>
            {/* Trust stats */}
            <dl className="mt-12 flex animate-fade-in flex-wrap gap-x-10 gap-y-4 animate-delay-300">
              {[
                { v: "5", l: "Premium Courts" },
                { v: "3", l: "Certified Coaches" },
                { v: "07–22", l: "Open Daily" },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="font-display text-2xl font-bold text-brand-accent">{s.v}</dt>
                  <dd className="text-xs uppercase tracking-wider text-white/50">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Schedule preview */}
      <section className="border-b border-black/5 bg-brand-mint/40">
        <div className="container-vp flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <div>
            <p className="eyebrow">Real-time availability</p>
            <p className="text-lg font-semibold text-ink">
              Check today&apos;s open courts and book in seconds.
            </p>
          </div>
          <Link href="/schedule" className="btn-primary">
            View Full Schedule →
          </Link>
        </div>
      </section>

      {/* Courts */}
      <section className="section">
        <div className="container-vp">
          <div className="flex items-end justify-between">
            <SectionHeading
              eyebrow="Our Courts"
              heading={getContent(content, "home.courts.heading")}
              subheading={getContent(content, "home.courts.subheading")}
            />
            <Link href="/facilities" className="btn-ghost hidden sm:inline-flex">
              View All →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courts.map((c) => (
              <CourtCard
                key={c.id}
                court={{
                  id: c.id,
                  name: c.name,
                  type: c.type,
                  surface: c.surface,
                  lighting: c.lighting,
                  capacity: c.capacity,
                  badge: c.badge,
                  features: c.features,
                  priceNormal: c.pricing?.priceNormal,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Coaching teaser */}
      <section className="section bg-brand-mint/30">
        <div className="container-vp">
          <div className="flex items-end justify-between">
            <SectionHeading
              eyebrow="Coaching"
              heading={getContent(content, "home.coaching.heading")}
              subheading={getContent(content, "home.coaching.subheading")}
            />
            <Link href="/coaching" className="btn-ghost hidden sm:inline-flex">
              Meet All Coaches →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {coaches.map((c) => (
              <CoachCard
                key={c.id}
                whatsapp={whatsapp}
                coach={{
                  id: c.id,
                  name: c.name,
                  title: c.title,
                  specialty: c.specialty,
                  experience: c.experience,
                  certifications: c.certifications,
                  bio: c.bio,
                  photoUrl: c.photoUrl,
                  programs: c.programs,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Facilities highlights */}
      <section className="section">
        <div className="container-vp">
          <SectionHeading
            center
            eyebrow="Facilities"
            heading={getContent(content, "home.facilities.heading")}
            subheading={getContent(content, "home.facilities.subheading")}
          />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {facilities.slice(0, 6).map((f) => (
              <div key={f.id} className="card card-hover group flex flex-col items-center gap-3 p-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-mint text-2xl transition-transform duration-300 group-hover:scale-110">{f.icon}</span>
                <span className="text-sm font-semibold text-ink">{f.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="section relative overflow-hidden bg-brand-dark text-white">
          {/* Decorative glow */}
          <div className="pointer-events-none absolute inset-0 bg-grid-faint [background-size:40px_40px] opacity-[0.05]" />
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-brand-accent/10 blur-[120px]" />
          <div className="container-vp relative">
            <SectionHeading center eyebrow="Loved by players" heading="What our members say" />
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.07]">
                  <div className="text-lg tracking-widest text-brand-accent">{"★".repeat(t.rating)}</div>
                  <blockquote className="mt-4 text-sm leading-relaxed text-white/80">“{t.text}”</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-accent/20 text-sm font-bold text-brand-accent">
                      {t.name.charAt(0)}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {t.name} <span className="block font-normal text-white/50">{t.role}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Membership CTA */}
      <section className="section">
        <div className="container-vp">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-brand to-brand-light p-10 text-white shadow-lift sm:p-16">
            <div className="absolute inset-0 bg-grid-faint [background-size:34px_34px] opacity-[0.06]" />
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-accent/20 blur-[90px]" />
            <div className="relative max-w-xl">
              <h2 className="font-display text-3xl font-bold tracking-tightest sm:text-4xl">
                {getContent(content, "home.membership.heading")}
              </h2>
              <p className="mt-4 text-white/75">
                {getContent(content, "home.membership.subheading")}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/membership" className="btn-accent">
                  {getContent(content, "home.membership.cta1.label", "View Plans")}
                </Link>
                <a
                  href={simpleWaLink(whatsapp, "Halo Vista Padel! Saya ingin tahu lebih lanjut tentang membership.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn border border-white/25 bg-white/5 text-white backdrop-blur hover:bg-white/10"
                >
                  {getContent(content, "home.membership.cta2.label", "Chat on WhatsApp")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
