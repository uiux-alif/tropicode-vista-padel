import { getAllContent, getContent, getJsonContent } from "@/lib/content";
import { getMembershipPlans, getCourts } from "@/lib/data";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { PageHero } from "@/components/public/PageHero";
import { MemberLookup } from "@/components/public/MemberLookup";
import { SavingsCalculator } from "@/components/public/SavingsCalculator";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import { formatCurrency } from "@/lib/utils";
import { simpleWaLink } from "@/lib/whatsapp";
import type { Metadata } from "next";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Membership",
  description:
    "Join Vista Padel Club. Save up to 25% on court fees, get priority booking, free clinics, and exclusive member perks in Jakarta.",
};

interface Benefit { icon: string; title: string; description: string }
interface Faq { question: string; answer: string }

export default async function MembershipPage() {
  const [content, plans, courts] = await Promise.all([getAllContent(), getMembershipPlans(), getCourts()]);
  const whatsapp = getContent(content, "global.whatsapp");
  const benefits = getJsonContent<Benefit[]>(content, "membership.benefits", []);
  const faqs = getJsonContent<Faq[]>(content, "membership.faq", []);

  const paidPlans = plans.filter((p) => p.price > 0 && p.isActive);
  const allActivePlans = plans.filter((p) => p.isActive);

  // Dynamic court pricing for savings callout
  const activePricing = courts.map((c) => c.pricing).filter(Boolean);
  const minNormalPrice = activePricing.length > 0
    ? Math.min(...activePricing.map((p) => p!.priceNormal))
    : 120000;
  const maxPeakPrice = activePricing.length > 0
    ? Math.max(...activePricing.map((p) => p!.pricePeak))
    : 220000;

  return (
    <>
      <PageHero
        eyebrow="Membership"
        heading={getContent(content, "membership.hero.heading")}
        subheading={getContent(content, "membership.hero.subheading")}
      />

      {/* ── PLANS ─────────────────────────────────────────────── */}
      <section id="plans" className="section">
        <div className="container-vp">
          <SectionHeading
            center
            eyebrow="Plans"
            heading="Pick your plan"
            subheading="All plans include access to all 5 courts. Paid plans unlock discounts and priority slots."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {allActivePlans.map((plan) => (
              <div
                key={plan.id}
                className={`card relative flex flex-col p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift ${plan.isFeatured
                  ? "ring-2 ring-brand shadow-lift lg:-mt-5 lg:mb-5"
                  : ""
                  }`}
              >
                {plan.isFeatured && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge variant="accent">Most Popular</Badge>
                  </span>
                )}

                {/* Plan header */}
                <div className="flex items-start justify-between">
                  <h3 className="font-display text-xl font-bold tracking-tight text-ink">{plan.name}</h3>
                  {plan.discountPercent > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      {plan.discountPercent}% off courts
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-ink/60">{plan.description}</p>

                {/* Price */}
                <div className="mt-5 flex items-end gap-1.5">
                  <span className="font-display text-3xl font-extrabold tracking-tightest text-brand">
                    {plan.price === 0 ? "Free" : formatCurrency(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className="mb-0.5 text-sm text-ink/50">/ {plan.billingPeriod.toLowerCase()}</span>
                  )}
                </div>

                {/* Savings callout for paid plans */}
                {plan.discountPercent > 0 && (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    💰 Save {formatCurrency(Math.round(minNormalPrice * plan.discountPercent / 100))}–{formatCurrency(Math.round(maxPeakPrice * plan.discountPercent / 100))} per court booking
                  </div>
                )}

                {/* Features */}
                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-ink/70">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href={simpleWaLink(
                    whatsapp,
                    plan.ctaWaMessage ?? `Halo Vista Padel! Saya tertarik dengan membership ${plan.name}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-7 ${plan.isFeatured ? "btn-primary" : "btn-outline"}`}
                >
                  {plan.ctaLabel} →
                </a>
              </div>
            ))}
          </div>

          {/* How to join note */}
          <p className="mt-8 text-center text-sm text-ink/50">
            Join via WhatsApp — we confirm your membership within 24 hours and send your member card.
          </p>
        </div>
      </section>

      {/* ── SAVINGS CALCULATOR ────────────────────────────────── */}
      {paidPlans.length > 0 && (
        <section className="section bg-brand-mint/30">
          <div className="container-vp">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <SectionHeading
                  eyebrow="Calculate"
                  heading="See how much you save"
                  subheading="Enter how often you play and see the real cost of membership vs. pay-as-you-go."
                />
              </div>
              <SavingsCalculator plans={paidPlans.map((p) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                discountPercent: p.discountPercent,
                billingPeriod: p.billingPeriod,
              }))} courtRates={{ normal: minNormalPrice, peak: maxPeakPrice }} />
            </div>
          </div>
        </section>
      )}

      {/* ── MEMBER STATUS LOOKUP ──────────────────────────────── */}
      <section className="section">
        <div className="container-vp">
          <div className="mx-auto max-w-xl">
            <SectionHeading
              center
              eyebrow="Already a member?"
              heading="Check your membership"
              subheading="Enter your registered WhatsApp number to see your current plan and expiry date."
            />
            <div className="mt-8">
              <MemberLookup />
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW DISCOUNTS WORK ────────────────────────────────── */}
      <section className="section bg-brand-dark text-white">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-faint [background-size:36px_36px] opacity-[0.05]" />
          <div className="container-vp relative">
            <SectionHeading
              center
              eyebrow="How it works"
              heading="Getting your discount"
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Join via WhatsApp",
                  desc: "Choose a plan and message us. We confirm your membership and register your WhatsApp number.",
                },
                {
                  step: "2",
                  title: "Book a court",
                  desc: "On the Schedule page, open a slot and enter your registered WhatsApp number in the booking form.",
                },
                {
                  step: "3",
                  title: "Discount auto-applied",
                  desc: "The system recognises your membership and applies your discount instantly in the price estimator.",
                },
              ].map((s) => (
                <div key={s.step} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-accent text-base font-bold text-brand-dark">
                    {s.step}
                  </span>
                  <h3 className="mt-4 font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm text-white/65">{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-center text-sm text-white/60">
              💡 Your discount applies automatically every time you book — no code, no voucher needed. Just use your registered WhatsApp number.
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────── */}
      {benefits.length > 0 && (
        <section className="section bg-brand-mint/30">
          <div className="container-vp">
            <SectionHeading center eyebrow="Why join" heading="Member benefits" />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((b, i) => (
                <div key={i} className="card card-hover p-6 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-mint text-3xl">
                    {b.icon}
                  </span>
                  <h3 className="mt-4 font-semibold text-ink">{b.title}</h3>
                  <p className="mt-1 text-sm text-ink/60">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ──────────────────────────────────────────────── */}
      {faqs.length > 0 && (
        <section className="section">
          <div className="container-vp max-w-3xl">
            <SectionHeading center eyebrow="FAQ" heading="Common questions" />
            <div className="mt-8">
              <FaqAccordion items={faqs} />
            </div>
          </div>
        </section>
      )}

      {/* ── BOTTOM CTA ────────────────────────────────────────── */}
      <section className="section">
        <div className="container-vp">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-brand to-brand-light p-10 text-center text-white shadow-lift sm:p-14">
            <div className="absolute inset-0 bg-grid-faint [background-size:34px_34px] opacity-[0.06]" />
            <div className="absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-brand-accent/20 blur-[90px]" />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold tracking-tightest sm:text-4xl">
                Ready to save on every booking?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-white/75">
                Join as a Pro or Elite member and your discount is applied automatically — no codes, no hassle.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <a
                  href={simpleWaLink(whatsapp, "Halo Vista Padel! Saya ingin bergabung sebagai member.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-accent"
                >
                  Join via WhatsApp →
                </a>
                <a href="/schedule" className="btn border border-white/25 bg-white/5 text-white backdrop-blur hover:bg-white/10">
                  Book a court first
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
