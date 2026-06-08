export function PageHero({
  eyebrow,
  heading,
  subheading,
}: {
  eyebrow: string;
  heading: string;
  subheading?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-brand-dark text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand to-brand-light" />
      <div className="absolute inset-0 bg-grid-faint [background-size:36px_36px] opacity-[0.06]" />
      <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-accent/15 blur-[110px]" />
      <div className="absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-brand-light/40 blur-[100px]" />

      <div className="container-vp relative py-20 sm:py-24 lg:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-brand-accent backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
          {eyebrow}
        </span>
        <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tightest sm:text-5xl lg:text-6xl">
          {heading}
        </h1>
        {subheading && (
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/75">{subheading}</p>
        )}
      </div>
    </section>
  );
}
