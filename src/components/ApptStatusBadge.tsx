import type { Appointment } from "../types";

export function ApptStatusBadge({ status }: { status: Appointment["status"] }) {
  const cfg = {
    Confirmed: { bg: "#D1FAE5", color: "#065F46" },
    Pending: { bg: "#FEF3C7", color: "#92400E" },
    Completed: { bg: "#E0F5F5", color: "#0C5F5F" },
    Cancelled: { bg: "#FEE2E2", color: "#991B1B" },
  }[status];
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 999 }}>
      {status === "Confirmed" ? "Confirmé" : status === "Pending" ? "En attente" : status === "Completed" ? "Terminé" : "Annulé"}
    </span>
  );
}
