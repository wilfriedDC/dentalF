type ApptStatus =
  | "Confirmed"
  | "Pending"
  | "Completed"
  | "Cancelled"
  | "PLANIFIE"
  | "CONFIRME"
  | "TERMINE"
  | "ANNULE";

const STATUS_MAP: Record<ApptStatus, { label: string; className: string }> = {
  Confirmed: { label: "Confirmé", className: "bg-green-light text-green" },
  Pending: { label: "En attente", className: "bg-amber-light text-amber" },
  Completed: { label: "Terminé", className: "bg-primary-light text-primary" },
  Cancelled: { label: "Annulé", className: "bg-red-light text-red" },
  PLANIFIE: { label: "Planifié", className: "bg-amber-light text-amber" },
  CONFIRME: { label: "Confirmé", className: "bg-green-light text-green" },
  TERMINE: { label: "Terminé", className: "bg-primary-light text-primary" },
  ANNULE: { label: "Annulé", className: "bg-red-light text-red" },
};

export function ApptStatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status as ApptStatus] ?? {
    label: status,
    className: "bg-surface-2 text-text-muted",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-[11.5px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}