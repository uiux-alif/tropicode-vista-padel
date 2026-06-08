// Default values for all CMS-managed SiteContent keys.
// Used by the seed script and as a runtime fallback so the public site
// never renders empty even before an admin edits content.

export interface ContentDef {
  value: string;
  type: "text" | "richtext" | "image" | "json";
}

export const CONTENT_DEFAULTS: Record<string, ContentDef> = {
  // ── Global ──
  "global.businessName": { value: "Vista Padel Club", type: "text" },
  "global.tagline": { value: "Jakarta's premium padel destination", type: "text" },
  "global.whatsapp": { value: "6281234567890", type: "text" },
  "global.email": { value: "hello@vistapadel.id", type: "text" },
  "global.phone": { value: "+62 812-3456-7890", type: "text" },
  "global.address": { value: "Jl. Sudirman No. 88, Jakarta Pusat, DKI Jakarta", type: "text" },
  "global.instagram": { value: "vistapadel", type: "text" },
  "global.facebook": { value: "vistapadel", type: "text" },
  "global.mapEmbed": {
    value:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63452.0!2d106.82!3d-6.21!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMTInMzYuMCJTIDEwNsKwNDknMTIuMCJF!5e0!3m2!1sen!2sid!4v1700000000000",
    type: "text",
  },

  // ── Opening hours ──
  "hours.weekday": { value: "07:00 – 23:00", type: "text" },
  "hours.weekend": { value: "06:00 – 23:00", type: "text" },

  // ── Home hero ──
  "home.hero.headline": { value: "Play Padel. Live the Vista lifestyle.", type: "text" },
  "home.hero.subheadline": {
    value:
      "Premium courts, expert coaching, and a vibrant community in the heart of Jakarta. Book your court in seconds.",
    type: "text",
  },
  "home.hero.cta1.label": { value: "Book a Court", type: "text" },
  "home.hero.cta1.link": { value: "/schedule", type: "text" },
  "home.hero.cta2.label": { value: "View Courts", type: "text" },
  "home.hero.cta2.link": { value: "/facilities", type: "text" },
  "home.hero.bgImage": { value: "", type: "image" },

  // ── Home sections ──
  "home.courts.heading": { value: "World-class courts", type: "text" },
  "home.courts.subheading": { value: "Five distinct courts, every one built for the perfect match.", type: "text" },
  "home.coaching.heading": { value: "Train with the best", type: "text" },
  "home.coaching.subheading": { value: "Certified coaches for every level, from first serve to tournament play.", type: "text" },
  "home.facilities.heading": { value: "Everything you need", type: "text" },
  "home.facilities.subheading": { value: "Premium amenities to make every visit effortless.", type: "text" },
  "home.membership.heading": { value: "Join the Vista community", type: "text" },
  "home.membership.subheading": { value: "Unlock priority booking, member rates, and exclusive events.", type: "text" },
  "home.membership.cta1.label": { value: "View Plans", type: "text" },
  "home.membership.cta2.label": { value: "Chat on WhatsApp", type: "text" },

  // ── Schedule header ──
  "schedule.heading": { value: "Book your court", type: "text" },
  "schedule.subheading": { value: "Pick a date, choose your slot, and we'll confirm via WhatsApp.", type: "text" },

  // ── Coaching ──
  "coaching.hero.heading": { value: "Coaching & academy", type: "text" },
  "coaching.hero.subheading": { value: "Personalised programs led by certified professionals.", type: "text" },
  "coaching.group.heading": { value: "Group programs", type: "text" },
  "coaching.group.subheading": { value: "Train together, improve faster.", type: "text" },
  "coaching.group.items": {
    value: JSON.stringify([
      "Beginner Bootcamp — 4-week foundation course",
      "Social Mixer Sessions — play and meet new partners",
      "Corporate Team Building — padel for your team",
    ]),
    type: "json",
  },
  "coaching.cta.heading": { value: "Ready to level up?", type: "text" },
  "coaching.cta.subheading": { value: "Book a session with one of our coaches today.", type: "text" },
  "coaching.cta.button": { value: "Book a Session", type: "text" },

  // ── Facilities ──
  "facilities.hero.heading": { value: "Facilities", type: "text" },
  "facilities.hero.subheading": { value: "Premium spaces designed around your game.", type: "text" },
  "facilities.cafe.heading": { value: "Café & Lounge", type: "text" },
  "facilities.cafe.body": {
    value:
      "Refuel after your match with specialty coffee, fresh juices, and a healthy menu. Our lounge is the perfect place to relax and socialise.",
    type: "richtext",
  },
  "facilities.cafe.items": {
    value: JSON.stringify([
      "Specialty coffee & cold brew",
      "Fresh-pressed juices & smoothies",
      "Healthy bites & light meals",
      "Comfortable lounge seating",
    ]),
    type: "json",
  },
  "facilities.proshop.heading": { value: "Pro Shop", type: "text" },
  "facilities.proshop.body": {
    value: "Everything you need to play your best, from top-tier brands.",
    type: "richtext",
  },
  "facilities.proshop.cards": {
    value: JSON.stringify([
      { icon: "🎾", title: "Rackets", subtitle: "Babolat, Head, Bullpadel" },
      { icon: "👟", title: "Footwear", subtitle: "Court-specific grip & support" },
      { icon: "👕", title: "Apparel", subtitle: "Performance wear & club merch" },
    ]),
    type: "json",
  },

  // ── Membership ──
  "membership.hero.heading": { value: "Membership", type: "text" },
  "membership.hero.subheading": { value: "Choose a plan that fits your game.", type: "text" },
  "membership.benefits": {
    value: JSON.stringify([
      { icon: "⚡", title: "Priority Booking", description: "Reserve courts before non-members." },
      { icon: "💸", title: "Member Rates", description: "Discounted court fees every visit." },
      { icon: "🎉", title: "Exclusive Events", description: "Members-only tournaments and socials." },
      { icon: "🏆", title: "Free Clinics", description: "Monthly group clinics included." },
    ]),
    type: "json",
  },
  "membership.faq": {
    value: JSON.stringify([
      { question: "Can I freeze my membership?", answer: "Yes, you can freeze for up to 2 months per year. Just message us on WhatsApp." },
      { question: "Is there a joining fee?", answer: "No joining fee — you only pay your selected plan's price." },
      { question: "Can I bring guests?", answer: "Members can bring guests at standard court rates, with priority booking." },
    ]),
    type: "json",
  },

  // ── Settings / payment template ──
  "settings.paymentTemplate": {
    value:
      "Mohon transfer ke rekening berikut:\nBCA 1234567890 a/n Vista Padel Club",
    type: "text",
  },
};
