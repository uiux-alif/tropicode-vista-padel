import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  default: "bg-brand-mint text-brand",
  accent: "bg-brand-accent text-brand-dark",
  outline: "border border-brand/20 text-brand",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  gray: "bg-gray-100 text-gray-600",
  pink: "bg-pink-100 text-pink-700",
  blue: "bg-blue-100 text-blue-700",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span className={cn("badge", variants[variant], className)}>{children}</span>
  );
}
