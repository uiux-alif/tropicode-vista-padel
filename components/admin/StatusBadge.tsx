import { Badge } from "@/components/ui/Badge";

const MAP: Record<string, { variant: "amber" | "green" | "red" | "gray" | "blue"; label: string }> = {
  PENDING: { variant: "amber", label: "Pending" },
  CONFIRMED: { variant: "green", label: "Confirmed" },
  REJECTED: { variant: "red", label: "Rejected" },
  CANCELLED: { variant: "gray", label: "Cancelled" },
  EXPIRED: { variant: "gray", label: "Expired" },
};

export function StatusBadge({ status }: { status: string }) {
  const m = MAP[status] ?? { variant: "gray" as const, label: status };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
