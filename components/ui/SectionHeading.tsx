export function SectionHeading({
  eyebrow,
  heading,
  subheading,
  center,
}: {
  eyebrow?: string;
  heading: string;
  subheading?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="heading-2">{heading}</h2>
      {subheading && <p className="mt-3 text-base text-ink/60">{subheading}</p>}
    </div>
  );
}
