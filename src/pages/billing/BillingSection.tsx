import { useEffect, useState } from "react";

import {
  getConsultations,
  type ApiConsultation,
} from "../../api/consultations.api";

import { formatDate } from "../../utils/formatDate";
import { InvoiceView } from "./InvoiceView";

export function BillingSection() {
  const [consultations, setConsultations] = useState<ApiConsultation[]>([]);
  const [selected, setSelected] = useState<ApiConsultation | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================
  // CHARGER LES CONSULTATIONS
  // ============================================

  const loadConsultations = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getConsultations();

      console.log("Consultations facturation :", data);

      setConsultations(data);
    } catch (err) {
      console.error(
        "Erreur chargement facturation :",
        err
      );

      setError(
        "Impossible de charger les données de facturation."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsultations();
  }, []);

  // ============================================
  // CALCUL TOTAL
  // ============================================

  const getTotalPrix = (
    consultation: ApiConsultation
  ) => {
    return consultation.actes.reduce(
      (total, acte) => total + acte.prix,
      0
    );
  };

  // ============================================
  // CALCUL PAIEMENT
  // ============================================

  const getTotalPaye = (
    consultation: ApiConsultation
  ) => {
    return consultation.paiements.reduce(
      (total, paiement) => total + paiement.montant,
      0
    );
  };

  // ============================================
  // STATUT
  // ============================================

  const getStatus = (
    consultation: ApiConsultation
  ) => {
    const total = getTotalPrix(consultation);
    const paye = getTotalPaye(consultation);

    if (total === 0) {
      return "IMPAYE";
    }

    if (paye >= total) {
      return "PAYE";
    }

    if (paye > 0) {
      return "PARTIEL";
    }

    return "IMPAYE";
  };

  // ============================================
  // STYLE STATUT
  // ============================================

  const getStatusStyle = (status: string) => {
    if (status === "PAYE") {
      return {
        background: "#DCFCE7",
        color: "#15803D",
      };
    }

    if (status === "PARTIEL") {
      return {
        background: "#FEF3C7",
        color: "#B45309",
      };
    }

    return {
      background: "#FEE2E2",
      color: "#B91C1C",
    };
  };

  // ============================================
  // FACTURE
  // ============================================

  if (selected) {
    return (
      <InvoiceView
        consultation={selected}
        onBack={() => setSelected(null)}
      />
    );
  }

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <div
        style={{
          padding: 20,
          color: "#6B7280",
        }}
      >
        Chargement de la facturation...
      </div>
    );
  }

  // ============================================
  // ERROR
  // ============================================

  if (error) {
    return (
      <div
        style={{
          padding: 20,
        }}
      >
        <div
          style={{
            color: "#EF4444",
            marginBottom: 12,
          }}
        >
          {error}
        </div>

        <button
          onClick={loadConsultations}
          style={{
            padding: "8px 14px",
            border: "1px solid #E5E7EB",
            borderRadius: 7,
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  // ============================================
  // PAGE FACTURATION
  // ============================================

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* TITRE */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#1F2937",
          }}
        >
          Facturation
        </div>

        <button
          onClick={loadConsultations}
          style={{
            padding: "7px 12px",
            border: "1px solid #E5E7EB",
            borderRadius: 7,
            background: "#fff",
            color: "#374151",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          ↻ Actualiser
        </button>
      </div>

      {/* TABLE */}

      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "120px 1fr 180px 100px 100px 80px",
            padding: "12px 20px",
            background: "#F8F9FA",
            borderBottom: "1px solid #F3F4F6",
          }}
        >
          {[
            "Date",
            "Patient — Acte",
            "Montant / Payé",
            "Reste",
            "Statut",
            "",
          ].map((h) => (
            <div
              key={h}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#9CA3AF",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* AUCUNE DONNÉE */}

        {consultations.length === 0 && (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "#9CA3AF",
            }}
          >
            Aucune consultation trouvée.
          </div>
        )}

        {/* CONSULTATIONS */}

        {consultations.map((c, i) => {
          if (!c.patient) {
            return null;
          }

          const patientName =
            `${c.patient.prenom} ${c.patient.nom}`;

          const totalPrix = getTotalPrix(c);
          const totalPaye = getTotalPaye(c);

          const reste = Math.max(
            totalPrix - totalPaye,
            0
          );

          const status = getStatus(c);
          const statusStyle =
            getStatusStyle(status);

          const actesText =
            c.actes.length > 0
              ? c.actes
                  .map((acte) => acte.nomActe)
                  .join(", ")
              : "Consultation";

          return (
            <div
              key={c.id}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "120px 1fr 180px 100px 100px 80px",
                padding: "13px 20px",
                borderBottom:
                  i < consultations.length - 1
                    ? "1px solid #F9FAFB"
                    : "none",
                alignItems: "center",
              }}
            >
              {/* DATE */}

              <div
                style={{
                  fontFamily:
                    "'DM Mono', monospace",
                  fontSize: 12.5,
                  color: "#9CA3AF",
                }}
              >
                {formatDate(
                  c.dateConsultation
                )}
              </div>

              {/* PATIENT */}

              <div>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: "#1F2937",
                  }}
                >
                  {patientName}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#9CA3AF",
                    marginTop: 2,
                  }}
                >
                  {actesText}
                </div>
              </div>

              {/* MONTANT */}

              <div>
                <div
                  style={{
                    fontSize: 13.5,
                    fontFamily:
                      "'DM Mono', monospace",
                    color: "#1F2937",
                  }}
                >
                  {totalPrix.toLocaleString(
                    "fr-FR"
                  )}{" "}
                  Ar
                </div>

                <div
                  style={{
                    fontSize: 11.5,
                    color: "#10B981",
                    marginTop: 2,
                  }}
                >
                  Payé :{" "}
                  {totalPaye.toLocaleString(
                    "fr-FR"
                  )}{" "}
                  Ar
                </div>
              </div>

              {/* RESTE */}

              <div
                style={{
                  fontFamily:
                    "'DM Mono', monospace",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color:
                    reste > 0
                      ? "#EF4444"
                      : "#10B981",
                }}
              >
                {reste.toLocaleString(
                  "fr-FR"
                )}{" "}
                Ar
              </div>

              {/* STATUT */}

              <div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "4px 9px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    background:
                      statusStyle.background,
                    color:
                      statusStyle.color,
                  }}
                >
                  {status}
                </span>
              </div>

              {/* VOIR */}

              <button
                onClick={() => setSelected(c)}
                style={{
                  padding: "5px 12px",
                  border:
                    "1px solid #E5E7EB",
                  borderRadius: 7,
                  background: "#fff",
                  fontSize: 12,
                  color: "#0EA5A5",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Voir
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}