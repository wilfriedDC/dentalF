import type { BillingStatus } from "../types";

export function StatusBadge({ status }: { status: BillingStatus }) {
  const cfg = {
    Paid: { bg: "#D1FAE5", color: "#065F46", label: "Payé" },
    Partial: { bg: "#FEF3C7", color: "#92400E", label: "Partiel" },
    Unpaid: { bg: "#FEE2E2", color: "#991B1B", label: "Impayé" },
  }[status];
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 999, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
      {cfg.label}
    </span>
  );
}
