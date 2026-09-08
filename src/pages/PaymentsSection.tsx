import { useEffect, useMemo, useState } from "react";
import {
  getConsultations,
  type ApiConsultation,
} from "../api/consultations.api";
import { formatDate } from "../utils/formatDate";

type PaymentFilter = "all" | "PAYE" | "PARTIEL" | "IMPAYE";

type PaymentRow = {
  id: string;
  consultationId: number;
  date: string;
  patient: string;
  acte: string;
  amount: number;
  method: string;
  balance: number;
  status: "PAYE" | "PARTIEL" | "IMPAYE";
};

const METHOD_LABEL: Record<string, string> = {
  Cash: "Espèces",
  Card: "Carte",
  Insurance: "Assurance",
  Transfer: "Virement",
};

function getMethodLabel(method: string | null) {
  if (!method) return "—";
  return METHOD_LABEL[method] ?? method;
}

function getStatus(
  total: number,
  paid: number
): "PAYE" | "PARTIEL" | "IMPAYE" {
  if (paid >= total && total > 0) {
    return "PAYE";
  }

  if (paid > 0) {
    return "PARTIEL";
  }

  return "IMPAYE";
}

function StatusPill({
  status,
}: {
  status: "PAYE" | "PARTIEL" | "IMPAYE";
}) {
  const config = {
    PAYE: {
      label: "Payé",
      color: "#10B981",
      background: "#D1FAE5",
    },
    PARTIEL: {
      label: "Partiel",
      color: "#F59E0B",
      background: "#FEF3C7",
    },
    IMPAYE: {
      label: "Impayé",
      color: "#EF4444",
      background: "#FEE2E2",
    },
  };

  const current = config[status];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 9px",
        borderRadius: 6,
        fontSize: 11.5,
        fontWeight: 600,
        color: current.color,
        background: current.background,
        whiteSpace: "nowrap",
      }}
    >
      {current.label}
    </span>
  );
}

export function PaymentsSection() {
  const [consultations, setConsultations] = useState<ApiConsultation[]>([]);
  const [filter, setFilter] = useState<PaymentFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =========================
  // Charger les consultations
  // =========================
  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getConsultations();

        console.log("Consultations paiements :", data);

        setConsultations(data);
      } catch (err) {
        console.error("Erreur chargement paiements :", err);
        setError("Impossible de charger les paiements.");
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, []);

  // =========================
  // Transformer les données
  // =========================
  const paymentRows = useMemo<PaymentRow[]>(() => {
    const rows: PaymentRow[] = [];

    consultations.forEach((consultation) => {
      const total = consultation.actes.reduce(
        (sum, acte) => sum + Number(acte.prix || 0),
        0
      );

      const paid = consultation.paiements.reduce(
        (sum, paiement) => sum + Number(paiement.montant || 0),
        0
      );

      const balance = Math.max(total - paid, 0);

      const status = getStatus(total, paid);

      const patientName = consultation.patient
        ? `${consultation.patient.nom} ${consultation.patient.prenom}`
        : "Patient inconnu";

      const acteName =
        consultation.actes.length > 0
          ? consultation.actes.map((acte) => acte.nomActe).join(", ")
          : "Aucun acte";

      // =========================
      // Consultation avec paiement
      // =========================
      if (consultation.paiements.length > 0) {
        consultation.paiements.forEach((paiement) => {
          rows.push({
            id: `${consultation.id}-${paiement.id}`,
            consultationId: consultation.id,
            date: paiement.datePaiement,
            patient: patientName,
            acte: acteName,
            amount: Number(paiement.montant || 0),
            method: getMethodLabel(paiement.modePaiement),
            balance,
            status,
          });
        });
      } else {
        // =========================
        // Consultation sans paiement
        // =========================
        rows.push({
          id: `${consultation.id}-unpaid`,
          consultationId: consultation.id,
          date: consultation.dateConsultation,
          patient: patientName,
          acte: acteName,
          amount: 0,
          method: "—",
          balance,
          status,
        });
      }
    });

    // Plus récent en premier
    return rows.sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
    );
  }, [consultations]);

  // =========================
  // Filtre
  // =========================
  const filtered = useMemo(() => {
    if (filter === "all") {
      return paymentRows;
    }

    return paymentRows.filter(
      (payment) => payment.status === filter
    );
  }, [paymentRows, filter]);

  // =========================
  // Total encaissé
  // =========================
  const totalIn = useMemo(() => {
    return consultations.reduce((total, consultation) => {
      const paid = consultation.paiements.reduce(
        (sum, paiement) =>
          sum + Number(paiement.montant || 0),
        0
      );

      return total + paid;
    }, 0);
  }, [consultations]);

  // =========================
  // Total restant dû
  // =========================
  const totalDue = useMemo(() => {
    return consultations.reduce((total, consultation) => {
      const totalActes = consultation.actes.reduce(
        (sum, acte) => sum + Number(acte.prix || 0),
        0
      );

      const totalPaye = consultation.paiements.reduce(
        (sum, paiement) =>
          sum + Number(paiement.montant || 0),
        0
      );

      const reste = Math.max(totalActes - totalPaye, 0);

      return total + reste;
    }, 0);
  }, [consultations]);

  // =========================
  // Nombre de transactions
  // =========================
  const transactionCount = useMemo(() => {
    return consultations.reduce(
      (count, consultation) =>
        count + consultation.paiements.length,
      0
    );
  }, [consultations]);

  // =========================
  // Loading
  // =========================
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 200,
          color: "#6B7280",
          fontSize: 14,
        }}
      >
        Chargement des paiements...
      </div>
    );
  }

  // =========================
  // Error
  // =========================
  if (error) {
    return (
      <div
        style={{
          background: "#FEF2F2",
          border: "1px solid #FECACA",
          borderRadius: 10,
          padding: 16,
          color: "#DC2626",
          fontSize: 14,
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* =========================
          TITLE
      ========================= */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#1F2937",
        }}
      >
        Suivi des paiements
      </div>

      {/* =========================
          SUMMARY CARDS
      ========================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
        }}
      >
        {[
          {
            label: "Total encaissé",
            value: `${totalIn.toLocaleString("fr-FR")} Ar`,
            color: "#10B981",
            bg: "#D1FAE5",
          },
          {
            label: "Total dû",
            value: `${totalDue.toLocaleString("fr-FR")} Ar`,
            color: "#EF4444",
            bg: "#FEE2E2",
          },
          {
            label: "Transactions",
            value: transactionCount,
            color: "#0EA5A5",
            bg: "#E0F5F5",
          },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12.5,
                  color: "#6B7280",
                }}
              >
                {card.label}
              </div>

              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: card.color,
                  fontFamily: "'DM Mono', monospace",
                  marginTop: 4,
                }}
              >
                {card.value}
              </div>
            </div>

            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: card.bg,
              }}
            />
          </div>
        ))}
      </div>

      {/* =========================
          FILTERS
      ========================= */}
      <div
        style={{
          display: "flex",
          gap: 6,
        }}
      >
        {(["all", "PAYE", "PARTIEL", "IMPAYE"] as const).map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px",
                border: "1.5px solid",
                borderRadius: 20,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                fontWeight:
                  filter === f ? 600 : 400,
                borderColor:
                  filter === f
                    ? "#0EA5A5"
                    : "#E5E7EB",
                background:
                  filter === f
                    ? "#E0F5F5"
                    : "#fff",
                color:
                  filter === f
                    ? "#0EA5A5"
                    : "#6B7280",
              }}
            >
              {f === "all"
                ? "Tous"
                : f === "PAYE"
                ? "Payés"
                : f === "PARTIEL"
                ? "Partiels"
                : "Impayés"}
            </button>
          )
        )}
      </div>

      {/* =========================
          TABLE
      ========================= */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "110px 160px 1fr 110px 120px 120px 90px",
            padding: "12px 20px",
            background: "#F8F9FA",
            borderBottom:
              "1px solid #F3F4F6",
          }}
        >
          {[
            "Date",
            "Patient",
            "Acte",
            "Montant",
            "Méthode",
            "Solde restant",
            "Statut",
          ].map((header) => (
            <div
              key={header}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#9CA3AF",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {header}
            </div>
          ))}
        </div>

        {/* Aucun résultat */}
        {filtered.length === 0 && (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "#9CA3AF",
              fontSize: 14,
            }}
          >
            Aucun paiement trouvé.
          </div>
        )}

        {/* Rows */}
        {filtered.map((payment, index) => (
          <div
            key={payment.id}
            style={{
              display: "grid",
              gridTemplateColumns:
                "110px 160px 1fr 110px 120px 120px 90px",
              padding: "13px 20px",
              borderBottom:
                index < filtered.length - 1
                  ? "1px solid #F9FAFB"
                  : "none",
              alignItems: "center",
            }}
          >
            {/* Date */}
            <div
              style={{
                fontFamily:
                  "'DM Mono', monospace",
                fontSize: 12.5,
                color: "#9CA3AF",
              }}
            >
              {formatDate(payment.date)}
            </div>

            {/* Patient */}
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 500,
                color: "#1F2937",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {payment.patient}
            </div>

            {/* Acte */}
            <div
              style={{
                fontSize: 12.5,
                color: "#6B7280",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {payment.acte}
            </div>

            {/* Montant */}
            <div
              style={{
                fontFamily:
                  "'DM Mono', monospace",
                fontSize: 13.5,
                fontWeight: 600,
                color:
                  payment.amount > 0
                    ? "#10B981"
                    : "#9CA3AF",
              }}
            >
              {payment.amount > 0
                ? `+${payment.amount.toLocaleString(
                    "fr-FR"
                  )} Ar`
                : "—"}
            </div>

            {/* Méthode */}
            <div>
              <span
                style={{
                  fontSize: 12,
                  background: "#F3F4F6",
                  color: "#6B7280",
                  padding: "3px 9px",
                  borderRadius: 5,
                  fontFamily:
                    "'DM Mono', monospace",
                }}
              >
                {payment.method}
              </span>
            </div>

            {/* Solde restant */}
            <div
              style={{
                fontFamily:
                  "'DM Mono', monospace",
                fontSize: 13,
                fontWeight: 600,
                color:
                  payment.balance > 0
                    ? "#EF4444"
                    : "#10B981",
              }}
            >
              {payment.balance > 0
                ? `${payment.balance.toLocaleString(
                    "fr-FR"
                  )} Ar`
                : "✓"}
            </div>

            {/* Statut */}
            <div>
              <StatusPill
                status={payment.status}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}