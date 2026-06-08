"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
}

// ── Reusable sub-components ───────────────────────────────────────────────

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 font-display text-xl font-bold tracking-tight text-ink">{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 mt-5 font-semibold text-ink">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 leading-relaxed text-ink/70">{children}</p>;
}
function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="mb-3 space-y-1.5 pl-4">{children}</ul>;
}
function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-ink/70">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
      <span>{children}</span>
    </li>
  );
}
function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
        {n}
      </span>
      <span className="text-ink/70">{children}</span>
    </div>
  );
}
function Steps({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 space-y-2.5">{children}</div>;
}
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-3 flex items-start gap-2 rounded-xl border border-brand/20 bg-brand-mint/50 px-4 py-3 text-sm text-brand">
      <span className="mt-0.5 shrink-0">💡</span>
      <span>{children}</span>
    </div>
  );
}
function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <span className="mt-0.5 shrink-0">⚠️</span>
      <span>{children}</span>
    </div>
  );
}
function StatusPill({ color, label }: { color: string; label: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", color)}>
      {label}
    </span>
  );
}
function Divider() {
  return <div className="my-5 border-t border-black/5" />;
}

// ── Section content ───────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: "overview",
    title: "Overview",
    icon: "🗺️",
    content: (
      <>
        <H2>Welcome to the Vista Padel Admin Panel</H2>
        <P>
          This panel gives you full control over bookings, court availability, site content, pricing, coaches,
          facilities, and membership plans — all without touching any code.
        </P>
        <P>Here's a quick map of what each menu item does:</P>
        <div className="overflow-x-auto rounded-xl border border-black/5">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-gray-50 text-xs uppercase text-ink/40">
              <tr>
                <th className="px-4 py-2">Menu</th>
                <th className="px-4 py-2">What you can do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {[
                ["📊 Dashboard", "See today's bookings, pending alerts, revenue estimate"],
                ["📅 Bookings", "Confirm, reject, cancel, search, filter all bookings"],
                ["🗓️ Schedule", "View availability grid, block individual or bulk slots"],
                ["🎾 Courts", "Add/edit courts, toggle active status, manage pricing"],
                ["💰 Pricing", "Set standard & peak rates per court, configure peak hours"],
                ["🧑‍🏫 Coaches", "Add/edit coaches and their programs"],
                ["🏛️ Facilities", "Add/edit facility amenities shown on the public site"],
                ["⭐ Membership", "Add/edit membership plans and their features"],
                ["📝 Site Content", "Edit all text, headings, and CTAs on every public page"],
                ["✉️ Messages", "Read and reply to contact form submissions"],
                ["⚙️ Settings", "Lock duration, payment instructions, maintenance mode"],
              ].map(([m, d]) => (
                <tr key={m as string}>
                  <td className="px-4 py-2.5 font-medium text-ink">{m}</td>
                  <td className="px-4 py-2.5 text-ink/60">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },

  {
    id: "booking-workflow",
    title: "Booking workflow",
    icon: "📅",
    content: (
      <>
        <H2>Booking workflow — end to end</H2>
        <P>
          Vista Padel uses a <strong>WhatsApp-confirmation</strong> model. No payment gateway — the customer
          transfers manually and you confirm once you see the proof.
        </P>

        <H3>Booking status flow</H3>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <StatusPill color="bg-amber-100 text-amber-700" label="PENDING" />
          <span className="text-ink/40">→</span>
          <StatusPill color="bg-green-100 text-green-700" label="CONFIRMED" />
          <span className="text-ink/40">or</span>
          <StatusPill color="bg-red-100 text-red-700" label="REJECTED" />
          <span className="text-ink/40">or (60 min, no action)</span>
          <StatusPill color="bg-gray-100 text-gray-500" label="EXPIRED" />
        </div>

        <Steps>
          <Step n={1}>Customer picks a slot on the Schedule page and submits the booking form.</Step>
          <Step n={2}>
            The system creates the booking with status <StatusPill color="bg-amber-100 text-amber-700" label="PENDING" /> and <strong>locks that slot for 60 minutes</strong>.
            The slot turns amber "Pending" on the public schedule — no one else can book it.
          </Step>
          <Step n={3}>The customer is shown a pre-filled WhatsApp link. They tap it to message the club with their booking reference.</Step>
          <Step n={4}>You receive a WhatsApp message. Open the <strong>Bookings</strong> page and find their booking (it'll appear in the Pending filter).</Step>
          <Step n={5}>Click the booking row to open the drawer. You'll see full details, a countdown timer, and a <strong>"Contact Booker on WhatsApp"</strong> button.</Step>
          <Step n={6}>
            Use the WhatsApp button to send the payment details to the customer. Wait for the transfer proof.
          </Step>
          <Step n={7}>
            Once you receive proof of payment, click <strong>✓ Confirm Booking</strong> in the drawer. Status changes to{" "}
            <StatusPill color="bg-green-100 text-green-700" label="CONFIRMED" /> and the slot is <strong>permanently blocked</strong> — no one else can book it.
          </Step>
        </Steps>

        <Tip>
          The Dashboard auto-refreshes every 15 seconds. Any new PENDING booking triggers an amber alert banner — you won't miss it.
        </Tip>

        <Warn>
          If you don't confirm or reject within 60 minutes, the booking automatically expires and the slot is released. The customer will need to re-book.
        </Warn>

        <Divider />

        <H3>Member discounts in bookings</H3>
        <P>
          If the booker is a member and enters their registered WhatsApp number in the booking form, the system automatically looks up their membership and applies their plan&apos;s discount to the court fee. The discounted amount is shown in the price estimator before they submit.
        </P>
        <P>
          You can verify that the discount was applied by opening the booking in the <strong>Bookings</strong> drawer — the member discount percentage and savings amount are displayed in the booking detail.
        </P>

        <Divider />

        <H3>Confirming a booking step-by-step</H3>
        <Steps>
          <Step n={1}>Go to <strong>Bookings</strong> → filter by <strong>PENDING</strong>.</Step>
          <Step n={2}>Click the booking row to open the detail drawer on the right.</Step>
          <Step n={3}>Check the customer's name, court, date, time, and estimated total.</Step>
          <Step n={4}>Tap <strong>"Contact Booker on WhatsApp"</strong> — it opens WhatsApp with a pre-filled message containing payment instructions.</Step>
          <Step n={5}>Wait for the payment transfer screenshot from the customer.</Step>
          <Step n={6}>Once confirmed, click <strong>✓ Confirm Booking</strong> in the drawer. Done.</Step>
        </Steps>

        <Divider />

        <H3>Rejecting a booking</H3>
        <P>
          Click <strong>Reject</strong> in the booking drawer. The slot is immediately released and the customer can book again. Use this if the customer doesn't respond, payment fails, or you need to decline for any reason.
        </P>

        <Divider />

        <H3>Extending the lock (+30 min)</H3>
        <P>
          If a customer says they're about to transfer but need a few more minutes, click <strong>Extend +30m</strong> in the drawer while the booking is still PENDING. This adds 30 minutes to the lock (configurable in Settings).
        </P>
        <Tip>You can extend multiple times. The lock always extends from the current expiry time, never from now, so it never accidentally shortens.</Tip>

        <Divider />

        <H3>Cancelling a confirmed booking</H3>
        <P>
          If a customer needs to cancel after you've confirmed, open the booking drawer and click <strong>Cancel Booking</strong>. Status changes to CANCELLED and the slot is released for others to book.
        </P>
        <Warn>Refund handling is manual — coordinate with the customer via WhatsApp.</Warn>
      </>
    ),
  },

  {
    id: "reschedule",
    title: "Reschedule & slot release",
    icon: "🔄",
    content: (
      <>
        <H2>Rescheduling a booking</H2>
        <P>
          There's no one-click reschedule button — rescheduling is a two-step process: cancel the existing booking, then help the customer book the new slot.
        </P>

        <H3>How to reschedule</H3>
        <Steps>
          <Step n={1}>
            Open <strong>Bookings</strong> and find the booking to reschedule.
          </Step>
          <Step n={2}>
            Open the drawer. If it's <StatusPill color="bg-green-100 text-green-700" label="CONFIRMED" />, click <strong>Cancel Booking</strong>. If it's <StatusPill color="bg-amber-100 text-amber-700" label="PENDING" />, click <strong>Reject</strong>. Either way, the original slot is released immediately.
          </Step>
          <Step n={3}>
            Message the customer on WhatsApp and ask them to go back to the schedule page and book the new slot. The original slot is now open and visible to everyone.
          </Step>
          <Step n={4}>
            When their new booking comes in as PENDING, confirm it as normal.
          </Step>
        </Steps>

        <Tip>
          If you want to hold a new slot for the customer while they decide, use <strong>Bulk Block</strong> (see Schedule section) to manually block the target slot for a few minutes so no one else grabs it first.
        </Tip>

        <Divider />

        <H3>When a slot doesn't release immediately</H3>
        <P>
          A CONFIRMED booking only releases when you manually cancel it. A PENDING booking releases either when you reject it, or automatically after the lock expires (up to 60 min). If a slot looks stuck, check the Bookings page — there may be a PENDING booking you haven't actioned.
        </P>
      </>
    ),
  },

  {
    id: "schedule-blocks",
    title: "Schedule & blocking",
    icon: "🗓️",
    content: (
      <>
        <H2>Schedule & Availability</H2>
        <P>
          The <strong>Schedule</strong> page shows the full court × time-slot grid for any date. Use it to see what's available and to manually block slots.
        </P>

        <H3>Reading the grid</H3>
        <div className="mb-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          {[
            { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Available", desc: "Customer can book" },
            { color: "bg-pink-100 text-pink-700 border-pink-200", label: "Peak", desc: "Available, higher rate" },
            { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Pending", desc: "Locked — booking in progress" },
            { color: "bg-indigo-100 text-indigo-700 border-indigo-200", label: "Confirmed", desc: "Paid & confirmed" },
            { color: "bg-gray-200 text-gray-500 border-gray-300 line-through", label: "Blocked", desc: "Manually blocked by you" },
            { color: "bg-gray-50 text-gray-300 border-gray-100", label: "Closed", desc: "Past / operating hours" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className={cn("rounded border px-2 py-0.5 text-xs font-medium", s.color)}>{s.label}</span>
              <span className="text-ink/50">{s.desc}</span>
            </div>
          ))}
        </div>

        <Divider />

        <H3>Blocking a single slot</H3>
        <P>Click any <strong>Available</strong> or <strong>Peak</strong> slot in the grid. A dialog appears asking for an optional reason (internal only). Click <strong>Block slot</strong>. The slot immediately shows as Blocked on the public schedule — customers cannot book it.</P>
        <P>Use this for: maintenance, a private event in one court for one hour, holding a slot for a VIP, etc.</P>

        <H3>Bulk blocking</H3>
        <P>Click <strong>+ Bulk Block</strong> (top right). Choose a court, a start time, and an end time. The entire range is blocked in one shot.</P>
        <P>
          <strong>When to use bulk block:</strong>
        </P>
        <Ul>
          <Li>A court is under maintenance for half the day</Li>
          <Li>A private tournament takes Court A from 08:00–18:00</Li>
          <Li>You're closing early for a club event</Li>
          <Li>You want to hold a slot range while a customer decides</Li>
        </Ul>

        <H3>Removing a block</H3>
        <P>Two ways:</P>
        <Ul>
          <Li>Click the blocked slot (grey, strikethrough) in the grid — you'll be asked to confirm removal.</Li>
          <Li>Find it in the <strong>Blocks on [date]</strong> list below the grid and click <strong>Remove</strong>.</Li>
        </Ul>

        <Tip>Blocks are per-date. You need to set them for each date individually. For recurring closures (e.g. every Monday morning), block them one day at a time or set a court to Inactive.</Tip>

        <Divider />

        <H3>Closing a court entirely</H3>
        <P>If a court is under long-term renovation or permanently removed, go to <strong>Courts</strong> and toggle it to <strong>Inactive</strong>. Inactive courts don't appear on the public schedule at all.</P>
      </>
    ),
  },

  {
    id: "content",
    title: "Editing site content",
    icon: "📝",
    content: (
      <>
        <H2>Editing site content (CMS)</H2>
        <P>
          Every heading, subheading, CTA button label, address, phone number, and opening hours on the public
          website is editable from <strong>Site Content</strong> — no code changes needed.
        </P>

        <H3>How to edit content</H3>
        <Steps>
          <Step n={1}>Go to <strong>Site Content</strong> in the sidebar.</Step>
          <Step n={2}>Choose a section from the left panel (Global, Home Hero, Coaching, etc.).</Step>
          <Step n={3}>Edit the fields. Plain text fields are single-line inputs. Long fields (body text, address) are textarea. JSON fields (lists, cards) are shown as formatted JSON.</Step>
          <Step n={4}>Click <strong>Save changes</strong> (top right). The public site updates within seconds.</Step>
        </Steps>

        <Tip>Changes take effect immediately — the admin save triggers a cache bust so visitors see the new content on their next page load.</Tip>

        <Divider />

        <H3>Sections reference</H3>
        <div className="overflow-x-auto rounded-xl border border-black/5">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-gray-50 text-xs uppercase text-ink/40">
              <tr>
                <th className="px-4 py-2">Section</th>
                <th className="px-4 py-2">What it controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-ink/70">
              {[
                ["Global", "Business name, WhatsApp number, email, phone, address, Instagram, Facebook, Google Maps embed URL"],
                ["Opening Hours", "Weekday and weekend hours shown in the footer and contact page"],
                ["Home — Hero", "Main headline, subheadline, CTA button labels and links, background image URL"],
                ["Home — Sections", "Headings and subheadings for Courts, Coaching, Facilities, and Membership sections on the homepage"],
                ["Schedule Header", "Heading and subheading shown above the booking grid"],
                ["Coaching", "Hero text, group programs list, CTA heading and button"],
                ["Facilities", "Hero text, Café section body and bullet list, Pro Shop heading and product cards"],
                ["Membership", "Hero text, member benefits list (icon/title/description), FAQ accordion items"],
              ].map(([s, d]) => (
                <tr key={s as string}>
                  <td className="px-4 py-2.5 font-medium text-ink">{s}</td>
                  <td className="px-4 py-2.5">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Divider />

        <H3>Editing JSON fields (lists & cards)</H3>
        <P>
          Some fields (like the FAQ list, member benefits, and coaching programs) are stored as JSON arrays. They look like this in the editor:
        </P>
        <pre className="overflow-x-auto rounded-xl bg-gray-950 p-4 text-xs text-green-300">{`[
  { "question": "Can I freeze my membership?", "answer": "Yes, up to 2 months per year." },
  { "question": "Is there a joining fee?", "answer": "No joining fee." }
]`}</pre>
        <P>Add a new item by copying an existing row and pasting it with a comma. Remove an item by deleting its row. The editor turns red if the JSON is invalid — don't save until it's green.</P>
        <Warn>Always keep the square brackets <code>[ ]</code> at the start and end. Don't add a trailing comma after the last item.</Warn>

        <Divider />

        <H3>Changing the WhatsApp number</H3>
        <P>
          Go to <strong>Site Content → Global</strong>. Update the <code>global.whatsapp</code> field. Use the international format without the <code>+</code> sign, e.g. <code>6281234567890</code>. This number is used for the WhatsApp FAB button, all booking confirmation links, and the Contact page.
        </P>

        <H3>Updating the Google Maps embed</H3>
        <P>
          Go to Google Maps, search your location, click <strong>Share → Embed a map → Copy HTML</strong>. Extract the URL from the <code>src="..."</code> attribute and paste it into the <code>global.mapEmbed</code> field.
        </P>
      </>
    ),
  },

  {
    id: "pricing",
    title: "Pricing & peak hours",
    icon: "💰",
    content: (
      <>
        <H2>Pricing & peak hours</H2>

        <H3>Setting court rates</H3>
        <P>Go to <strong>Pricing</strong>. The table shows each court with a Standard rate and a Peak rate (per hour). Click any number to edit it inline. Click <strong>Save changes</strong> when done.</P>

        <H3>Configuring peak hours</H3>
        <P>Below the court table, set <strong>Peak start</strong> and <strong>Peak end</strong> (24-hour format). The default is 17:00–22:00. All courts use the same peak window.</P>
        <Tip>Peak hours affect both the price shown in the booking modal AND the pink slot colour on the schedule grid.</Tip>

        <H3>Add-on pricing</H3>
        <P>Set prices for Racket Rental, Ball Rental, and Coaching add-ons in the same Pricing page. These appear as checkboxes in the booking form and are included in the estimated total.</P>

        <Warn>Pricing changes take effect for new bookings immediately. Existing confirmed bookings keep their original estimated total.</Warn>
      </>
    ),
  },

  {
    id: "member-discounts",
    title: "Member discounts",
    icon: "⭐",
    content: (
      <>
        <H2>Member discounts</H2>

        <H3>How discounts work</H3>
        <P>
          Each paid membership plan has a <strong>discount percentage</strong> (e.g. 15% for Pro, 25% for Elite). When a member books a court, this discount is applied automatically to the court fee — no coupon code or manual step required. Add-ons (racket, ball, coaching) are not discounted; only the court fee.
        </P>

        <H3>How members get their discount when booking</H3>
        <Steps>
          <Step n={1}>Member goes to the Schedule page and opens any available slot.</Step>
          <Step n={2}>In the booking form, they find the <strong>⭐ Member Discount</strong> section.</Step>
          <Step n={3}>They enter their registered WhatsApp number and click <strong>Check</strong>.</Step>
          <Step n={4}>The system recognises their membership and shows a green confirmation with their plan and discount %.</Step>
          <Step n={5}>The price estimator immediately updates to show the discounted court fee.</Step>
          <Step n={6}>When they submit, the discount is recorded in the booking.</Step>
        </Steps>
        <Tip>
          The member&apos;s WA number used during booking must match the one registered in the Members panel. Both 08xxx and 628xxx formats are handled — the system normalises them.
        </Tip>

        <Divider />

        <H3>How to set the discount % per plan</H3>
        <Steps>
          <Step n={1}>Go to <strong>Membership</strong> in the sidebar.</Step>
          <Step n={2}>Click <strong>Edit</strong> on the plan you want to change.</Step>
          <Step n={3}>Drag the <strong>Discount % on court fees</strong> slider to the desired value (0–50%).</Step>
          <Step n={4}>Click <strong>Save</strong>. The new discount applies to all future bookings for that plan.</Step>
        </Steps>

        <Divider />

        <H3>What happens when membership expires</H3>
        <P>
          The discount stops applying immediately when the membership expires. The system checks the expiry date at the time the booker clicks <strong>Check</strong> in the booking form — if the membership is expired, the system responds with "No active membership found" and no discount is applied.
        </P>
        <Warn>Existing confirmed bookings keep their original discount. Only new bookings after expiry are affected.</Warn>

        <Divider />

        <H3>How to verify if a member&apos;s discount is being applied</H3>
        <Steps>
          <Step n={1}>Go to <strong>Bookings</strong> and find the booking in question.</Step>
          <Step n={2}>Click the booking row to open the detail drawer.</Step>
          <Step n={3}>The drawer shows the <strong>member discount %</strong> and the <strong>amount saved</strong> if a discount was applied.</Step>
          <Step n={4}>If the discount is 0%, either the member didn&apos;t enter their WA, or they&apos;re not on a paid plan.</Step>
        </Steps>

        <Divider />

        <H3>Common issues</H3>
        <Ul>
          <Li>
            <strong>WA number format mismatch (08xxx vs 628xxx):</strong> The system normalises both formats internally, so this should not cause issues. If a member reports their discount isn&apos;t being found, check the number in the Members panel and ensure there are no spaces or special characters.
          </Li>
          <Li>
            <strong>Expired membership:</strong> The member needs to be renewed. Go to Members, find the member, and click <strong>🔄 Renew Membership</strong> in their drawer.
          </Li>
          <Li>
            <strong>Wrong WA number used:</strong> The booker may have entered a different number than their registered one. Ask them to use the WA number they signed up with. If needed, update their registered number in the Members panel.
          </Li>
          <Li>
            <strong>Member on a free/no-discount plan:</strong> The Casual (free) plan has 0% discount. The member needs to upgrade to Pro or Elite to get a discount.
          </Li>
        </Ul>
      </>
    ),
  },

  {
    id: "courts",
    title: "Managing courts",
    icon: "🎾",
    content: (
      <>
        <H2>Managing courts</H2>

        <H3>Adding a court</H3>
        <Steps>
          <Step n={1}>Go to <strong>Courts</strong> → click <strong>+ Add Court</strong>.</Step>
          <Step n={2}>Fill in Name, Type, Surface, Lighting, Capacity, and optional Badge (e.g. "VIP", "Most Popular").</Step>
          <Step n={3}>Set the Standard and Peak hourly rates.</Step>
          <Step n={4}>Add Features (e.g. "Air Conditioned", "Glass Walls") using the tag input — type and press Enter.</Step>
          <Step n={5}>Click <strong>Save</strong>. The court appears immediately on the public Schedule and Facilities pages.</Step>
        </Steps>

        <H3>Deactivating a court</H3>
        <P>Click <strong>Deactivate</strong> on the court card. The court disappears from the public schedule and facilities page. Existing bookings for that court are preserved. Reactivate at any time.</P>

        <Warn>You cannot delete a court that has existing bookings — it will be deactivated instead. This protects your booking history.</Warn>

        <H3>Sort order</H3>
        <P>Courts are displayed on the public site in sort order (lowest number first). Set the sort order field when editing a court to control the display sequence.</P>
      </>
    ),
  },

  {
    id: "coaches",
    title: "Coaches & programs",
    icon: "🧑‍🏫",
    content: (
      <>
        <H2>Coaches & programs</H2>

        <H3>Adding a coach</H3>
        <Steps>
          <Step n={1}>Go to <strong>Coaches</strong> → <strong>+ Add Coach</strong>.</Step>
          <Step n={2}>Fill in Name, Title (e.g. "Head Coach"), Specialty, and Experience (e.g. "12 Years").</Step>
          <Step n={3}>Add certifications as tags (e.g. "WPT Certified", "FIP Level 3").</Step>
          <Step n={4}>Write a bio — this appears on the Coaching page.</Step>
          <Step n={5}>Add programs with the <strong>+ Add program</strong> button. Each program has a name, duration, price, and level.</Step>
          <Step n={6}>Click <strong>Save</strong>.</Step>
        </Steps>

        <Tip>Programs are shown as a table on each coach card on the public Coaching page. Keep names short and levels clear (e.g. "Beginner", "All Levels", "Intermediate+").</Tip>

        <H3>Deactivating a coach</H3>
        <P>Click <strong>Deactivate</strong> on the coach card. The coach is hidden from the public site but their data is preserved.</P>
      </>
    ),
  },

  {
    id: "messages",
    title: "Contact messages",
    icon: "✉️",
    content: (
      <>
        <H2>Contact messages</H2>
        <P>When someone submits the contact form on the public site, their message lands in <strong>Messages → Inbox</strong>.</P>

        <H3>Reading & replying</H3>
        <Steps>
          <Step n={1}>Go to <strong>Messages</strong>. Unread messages show a green dot and a count badge on the tab.</Step>
          <Step n={2}>Click any message to open it. It's automatically marked as read.</Step>
          <Step n={3}>Use <strong>Reply via Email</strong> to open your email client with a pre-filled reply, or <strong>Reply via WhatsApp</strong> if they included their number.</Step>
          <Step n={4}>Click <strong>Archive</strong> once handled. Archived messages move to the Archive tab.</Step>
        </Steps>

        <Tip>Messages are never deleted automatically. Archive them to keep the inbox clean — you can always find them in the Archive tab later.</Tip>
      </>
    ),
  },

  {
    id: "settings",
    title: "Settings",
    icon: "⚙️",
    content: (
      <>
        <H2>Settings</H2>

        <H3>Booking lock duration</H3>
        <P>
          Default: <strong>60 minutes</strong>. This is how long a PENDING booking holds its slot before auto-expiring. Lower it (e.g. 30 min) if you want faster slot release. Raise it (e.g. 90 min) if customers regularly need more time to transfer.
        </P>

        <H3>Extend-lock amount</H3>
        <P>
          Default: <strong>30 minutes</strong>. This is how much time is added when you click "Extend +30m" in the booking drawer.
        </P>

        <H3>Payment instructions template</H3>
        <P>
          This is the text inserted into the WhatsApp message you send to bookers when requesting payment. Edit it to match your bank account details. Example:
        </P>
        <pre className="overflow-x-auto rounded-xl bg-gray-950 p-4 text-xs text-green-300">{`Mohon transfer ke rekening berikut:
BCA 1234567890 a/n Vista Padel Club

Setelah transfer, kirim bukti ke sini ya.`}</pre>

        <H3>Maintenance mode</H3>
        <P>
          Toggle this on to display a "temporarily unavailable" message on the public site. Use during major updates or if you need to pause bookings temporarily. <strong>Remember to turn it back off</strong> when done.
        </P>
        <Warn>Maintenance mode affects the entire public site — visitors will see an unavailable message. Admin panel access is unaffected.</Warn>
      </>
    ),
  },

  {
    id: "tips",
    title: "Daily tips & FAQ",
    icon: "✅",
    content: (
      <>
        <H2>Daily tips & FAQ</H2>

        <H3>Morning checklist</H3>
        <Ul>
          <Li>Check Dashboard for any overnight PENDING bookings that might have expired</Li>
          <Li>Check Messages inbox for new contact form submissions</Li>
          <Li>Check Schedule for today's blocked slots and confirm they're still needed</Li>
        </Ul>

        <Divider />

        <H3>Q: A customer booked the wrong slot — what do I do?</H3>
        <P>Reject or cancel the wrong booking (slot is released), then ask them to re-book the correct slot. If they need you to hold the correct slot first, bulk-block it on the Schedule page, let them book it, then remove the block.</P>

        <H3>Q: Two customers want the same slot at the same time — who wins?</H3>
        <P>Whoever submits the booking form first. The system uses a database transaction to atomically check and lock the slot — the second submission gets a "Slot just taken" error and is asked to pick another.</P>

        <H3>Q: A customer paid but the booking expired before I confirmed</H3>
        <P>
          The slot is released when a booking expires. Check if someone else has already grabbed it on the Schedule page. If the slot is free, ask the customer to book again — you can fast-track the confirmation since you already have payment proof. If someone else took it, help the customer find the next available slot.
        </P>
        <Warn>There is currently no way to create a booking manually from the admin panel — customers must book via the public schedule page.</Warn>

        <H3>Q: How do I update the homepage headline?</H3>
        <P>Site Content → Home — Hero → edit the <code>home.hero.headline</code> field → Save changes.</P>

        <H3>Q: How do I change the opening hours in the footer?</H3>
        <P>Site Content → Opening Hours → edit Weekday and Weekend fields → Save changes.</P>

        <H3>Q: How do I add a new FAQ on the membership page?</H3>
        <P>Site Content → Membership → edit the <code>membership.faq</code> JSON field. Add a new object to the array:</P>
        <pre className="overflow-x-auto rounded-xl bg-gray-950 p-4 text-xs text-green-300">{`{ "question": "Your question here?", "answer": "Your answer here." }`}</pre>

        <H3>Q: Can I set different peak hours for weekdays vs weekends?</H3>
        <P>Not yet — peak hours apply globally across all days. This is planned for Phase 2.</P>

        <H3>Q: How do I completely close the club on a specific day?</H3>
        <P>Go to <strong>Schedule</strong>, select that date, use <strong>+ Bulk Block</strong> on each court for the full day (07:00–22:00). Or deactivate all courts temporarily.</P>

        <Divider />

        <H3>Need help?</H3>
        <P>Contact your developer or system administrator if you encounter an issue not covered here.</P>
      </>
    ),
  },

  {
    id: "demo-data",
    title: "Demo data",
    icon: "🧪",
    content: (
      <>
        <H2>Demo data</H2>
        <P>
          The app comes pre-populated with realistic demo data to illustrate how Vista Padel Club looks in active operation — members, historical bookings spanning 3 months, and today&apos;s pending bookings.
        </P>

        <H3>What the demo data includes</H3>
        <Ul>
          <Li>20 demo members across Pro, Elite, and Casual plans (mix of active, expired, and paused)</Li>
          <Li>~180 historical bookings over the past 90 days with realistic status distribution (confirmed, cancelled, expired, rejected)</Li>
          <Li>2–4 PENDING bookings for today to demonstrate the live booking flow</Li>
          <Li>Realistic Indonesian names and WhatsApp numbers in 628xxx format</Li>
        </Ul>

        <H3>Re-seeding demo data</H3>
        <P>
          If you want to refresh or repopulate the demo data (e.g. after clearing the database), run the demo seed script from the project root:
        </P>
        <pre className="overflow-x-auto rounded-xl bg-gray-950 p-4 text-xs text-green-300">npm run demo:seed</pre>
        <P>
          The script is idempotent — running it multiple times won&apos;t create duplicates. It uses upsert operations keyed on reference numbers. You can safely re-run it at any time.
        </P>

        <H3>Daily demo booking cron</H3>
        <P>
          There&apos;s also a daily cron endpoint at <code>/api/cron/demo-bookings</code> that automatically adds 3–8 new random bookings for today, simulating live daily activity for demo purposes. It runs at 9am daily (configured in <code>vercel.json</code>).
        </P>
        <P>
          You can also trigger it manually:
        </P>
        <pre className="overflow-x-auto rounded-xl bg-gray-950 p-4 text-xs text-green-300">curl -H &quot;Authorization: Bearer YOUR_CRON_SECRET&quot; https://your-domain.com/api/cron/demo-bookings</pre>

        <Tip>
          The demo seed script queries the actual courts and membership plans from the database — it doesn&apos;t hard-code any IDs. This means it works correctly even after you add or modify courts and plans.
        </Tip>

        <Warn>
          The demo data uses fake Indonesian names and generated WA numbers. Do not confuse them with real customers. Before going live, clear the demo data by deleting bookings and members from the admin panel or directly from the database.
        </Warn>
      </>
    ),
  },
];

// ── Main page ─────────────────────────────────────────────────────────────

export default function AdminGuidePage() {
  const [active, setActive] = useState(SECTIONS[0].id);
  const section = SECTIONS.find((s) => s.id === active)!;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Admin Guide</h1>
        <p className="mt-1 text-sm text-ink/50">Everything you need to run Vista Padel Club day-to-day.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        {/* Sidebar nav */}
        <nav className="flex flex-row flex-wrap gap-1.5 lg:flex-col">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition",
                s.id === active
                  ? "bg-brand text-white shadow-soft"
                  : "text-ink/60 hover:bg-brand-mint hover:text-brand"
              )}
            >
              <span>{s.icon}</span>
              <span className="font-medium">{s.title}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-card sm:p-8">
          {section.content}
        </div>
      </div>
    </div>
  );
}
