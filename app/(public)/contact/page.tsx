import { getAllContent, getContent } from "@/lib/content";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ContactForm } from "@/components/public/ContactForm";
import { PageHero } from "@/components/public/PageHero";
import { simpleWaLink } from "@/lib/whatsapp";
import type { Metadata } from "next";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Vista Padel Club in Jakarta. Questions about booking, coaching, or membership — we're here to help.",
};

export default async function ContactPage() {
  const content = await getAllContent();
  const whatsapp = getContent(content, "global.whatsapp");
  const mapEmbed = getContent(content, "global.mapEmbed");

  const info = [
    { label: "Address", value: getContent(content, "global.address") },
    { label: "Phone", value: getContent(content, "global.phone") },
    { label: "Email", value: getContent(content, "global.email") },
    { label: "Weekday Hours", value: getContent(content, "hours.weekday") },
    { label: "Weekend Hours", value: getContent(content, "hours.weekend") },
  ];

  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        heading="Contact us"
        subheading="Questions about booking, coaching, or membership? We're here to help."
      />

      <section className="section">
        <div className="container-vp grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Reach us" heading="Club details" />
            <dl className="mt-6 space-y-4">
              {info.map((i) => (
                <div key={i.label} className="border-b border-black/5 pb-3">
                  <dt className="text-xs uppercase tracking-wide text-ink/40">{i.label}</dt>
                  <dd className="mt-1 text-ink">{i.value}</dd>
                </div>
              ))}
            </dl>
            <a
              href={simpleWaLink(whatsapp, "Halo Vista Padel! Saya ingin bertanya.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-6"
            >
              Chat on WhatsApp →
            </a>
          </div>

          <div>
            <SectionHeading eyebrow="Send a message" heading="Drop us a line" />
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {mapEmbed && (
        <section className="pb-20">
          <div className="container-vp">
            <div className="overflow-hidden rounded-2xl border border-black/5">
              <iframe
                src={mapEmbed}
                title="Map"
                className="h-80 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
