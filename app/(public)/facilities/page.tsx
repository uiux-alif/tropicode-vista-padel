import { getAllContent, getContent, getJsonContent } from "@/lib/content";
import { getCourts, getFacilities, getGallery } from "@/lib/data";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CourtCard } from "@/components/public/CourtCard";
import { PageHero } from "@/components/public/PageHero";
import type { Metadata } from "next";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Facilities",
  description:
    "Explore Vista Padel Club's premium courts, café, pro shop, and amenities — Jakarta's complete padel destination.",
};

interface ProShopCard {
  icon: string;
  title: string;
  subtitle: string;
}

export default async function FacilitiesPage() {
  const [content, courts, facilities, gallery] = await Promise.all([
    getAllContent(),
    getCourts(),
    getFacilities(),
    getGallery(),
  ]);

  const cafeItems = getJsonContent<string[]>(content, "facilities.cafe.items", []);
  const proShopCards = getJsonContent<ProShopCard[]>(content, "facilities.proshop.cards", []);

  return (
    <>
      <PageHero
        eyebrow="Explore"
        heading={getContent(content, "facilities.hero.heading")}
        subheading={getContent(content, "facilities.hero.subheading")}
      />

      {/* Courts showcase */}
      <section className="section">
        <div className="container-vp">
          <SectionHeading eyebrow="Courts" heading="Our courts" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courts.map((c) => (
              <CourtCard
                key={c.id}
                court={{
                  id: c.id, name: c.name, type: c.type, surface: c.surface,
                  lighting: c.lighting, capacity: c.capacity, badge: c.badge,
                  features: c.features, priceNormal: c.pricing?.priceNormal,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section className="section bg-brand-mint/30">
        <div className="container-vp">
          <SectionHeading eyebrow="Amenities" heading="Everything you need" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {facilities.map((f) => (
              <div key={f.id} className="card card-hover p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-mint text-2xl">{f.icon}</span>
                <h3 className="mt-4 font-semibold text-ink">{f.name}</h3>
                <p className="mt-1 text-sm text-ink/60">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Café & Lounge */}
      <section className="section">
        <div className="container-vp grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Relax" heading={getContent(content, "facilities.cafe.heading")} />
            <p className="mt-4 text-ink/70">{getContent(content, "facilities.cafe.body")}</p>
            <ul className="mt-5 space-y-2">
              {cafeItems.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-ink/70">
                  <span className="text-brand">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex h-64 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-light text-white/80">
            <span className="font-display text-2xl">Café & Lounge</span>
          </div>
        </div>
      </section>

      {/* Pro Shop */}
      <section className="section bg-brand-mint/30">
        <div className="container-vp">
          <SectionHeading eyebrow="Shop" heading={getContent(content, "facilities.proshop.heading")} subheading={getContent(content, "facilities.proshop.body")} />
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {proShopCards.map((card, i) => (
              <div key={i} className="card card-hover p-6 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-mint text-3xl">{card.icon}</span>
                <h3 className="mt-4 font-semibold text-ink">{card.title}</h3>
                <p className="mt-1 text-sm text-ink/60">{card.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="section">
          <div className="container-vp">
            <SectionHeading eyebrow="Gallery" heading="Inside the club" />
            <div className="mt-10 columns-2 gap-4 sm:columns-3">
              {gallery.map((g) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={g.id}
                  src={g.url}
                  alt={g.alt ?? ""}
                  loading="lazy"
                  className="mb-4 w-full rounded-xl object-cover"
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
