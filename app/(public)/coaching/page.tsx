import { getAllContent, getContent, getJsonContent } from "@/lib/content";
import { getCoaches } from "@/lib/data";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CoachCard } from "@/components/public/CoachCard";
import { PageHero } from "@/components/public/PageHero";
import { simpleWaLink } from "@/lib/whatsapp";
import type { Metadata } from "next";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Coaching",
  description:
    "Train with Vista Padel's certified coaches in Jakarta. Private lessons, group clinics, and junior programs for every level.",
};

export default async function CoachingPage() {
  const [content, coaches] = await Promise.all([getAllContent(), getCoaches()]);
  const whatsapp = getContent(content, "global.whatsapp");
  const groupItems = getJsonContent<string[]>(content, "coaching.group.items", []);

  return (
    <>
      <PageHero
        eyebrow="Academy"
        heading={getContent(content, "coaching.hero.heading")}
        subheading={getContent(content, "coaching.hero.subheading")}
      />

      <section className="section">
        <div className="container-vp">
          <div className="grid gap-6 lg:grid-cols-3">
            {coaches.map((c) => (
              <CoachCard
                key={c.id}
                whatsapp={whatsapp}
                coach={{
                  id: c.id, name: c.name, title: c.title, specialty: c.specialty,
                  experience: c.experience, certifications: c.certifications,
                  bio: c.bio, photoUrl: c.photoUrl, programs: c.programs,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-brand-mint/30">
        <div className="container-vp">
          <SectionHeading
            eyebrow="Group"
            heading={getContent(content, "coaching.group.heading")}
            subheading={getContent(content, "coaching.group.subheading")}
          />
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupItems.map((item, i) => (
              <li key={i} className="card flex items-start gap-3 p-5">
                <span className="mt-0.5 text-brand">✓</span>
                <span className="text-sm text-ink/70">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container-vp">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-brand to-brand-light p-10 text-center text-white shadow-lift sm:p-14">
            <div className="absolute inset-0 bg-grid-faint [background-size:34px_34px] opacity-[0.06]" />
            <div className="absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-brand-accent/20 blur-[90px]" />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold tracking-tightest sm:text-4xl">
                {getContent(content, "coaching.cta.heading")}
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-white/75">
                {getContent(content, "coaching.cta.subheading")}
              </p>
              <a
                href={simpleWaLink(whatsapp, "Halo Vista Padel! Saya ingin booking sesi coaching.")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-accent mt-7"
              >
                {getContent(content, "coaching.cta.button", "Book a Session")} →
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
