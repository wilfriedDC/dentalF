type ApptStatus =
  | "Confirmed"
  | "Pending"
  | "Completed"
  | "Cancelled"
  | "PLANIFIE"
  | "CONFIRME"
  | "TERMINE"
  | "ANNULE";

const STATUS_MAP: Record<
  ApptStatus,
  {
    label: string;
    bg: string;
    color: string;
  }
> = {
  Confirmed: {
    label: "Confirmé",
    bg: "#DCFCE7",
    color: "#166534",
  },

  Pending: {
    label: "En attente",
    bg: "#FEF3C7",
    color: "#92400E",
  },

  Completed: {
    label: "Terminé",
    bg: "#E0F2FE",
    color: "#075985",
  },

  Cancelled: {
    label: "Annulé",
    bg: "#FEE2E2",
    color: "#991B1B",
  },

  PLANIFIE: {
    label: "Planifié",
    bg: "#FEF3C7",
    color: "#92400E",
  },

  CONFIRME: {
    label: "Confirmé",
    bg: "#DCFCE7",
    color: "#166534",
  },

  TERMINE: {
    label: "Terminé",
    bg: "#E0F2FE",
    color: "#075985",
  },

  ANNULE: {
    label: "Annulé",
    bg: "#FEE2E2",
    color: "#991B1B",
  },
};

export function ApptStatusBadge({
  status,
}: {
  status: string;
}) {
  const config =
    STATUS_MAP[status as ApptStatus] ?? {
      label: status,
      bg: "#F3F4F6",
      color: "#6B7280",
    };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 8px",
        borderRadius: 6,
        background: config.bg,
        color: config.color,
        fontSize: 11.5,
        fontWeight: 600,
      }}
    >
      {config.label}
    </span>
  );
}