import { useEffect, useState } from "react";

import type { ApiConsultation } from "../../api/consultations.api";
import {
  getCabinet,
  getPraticiens,
  type Cabinet,
  type Praticien,
} from "../../api/settings.api";
import { formatDate } from "../../utils/formatDate";

interface InvoiceViewProps {
  consultation: ApiConsultation;
  onBack: () => void;
}

export function InvoiceView({
  consultation,
  onBack,
}: InvoiceViewProps) {
  // ============================================
  // CABINET / PRATICIEN (depuis les réglages)
  // ============================================

  const [cabinet, setCabinet] = useState<Cabinet | null>(null);
  const [praticien, setPraticien] = useState<Praticien | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [cabinetData, praticiens] = await Promise.all([
          getCabinet(),
          getPraticiens(),
        ]);

        setCabinet(cabinetData);
        // Pas de lien praticien par consultation dans le modèle actuel :
        // on affiche le praticien du cabinet (le premier de la liste).
        setPraticien(praticiens[0] ?? null);
      } catch (err) {
        console.error(
          "Erreur chargement réglages cabinet :",
          err
        );
      }
    };

    loadSettings();
  }, []);

  // ============================================
  // PATIENT
  // ============================================

  const patient = consultation.patient;

  if (!patient) {
    return (
      <div
        style={{
          padding: 20,
        }}
      >
        <p
          style={{
            color: "#EF4444",
          }}
        >
          Patient introuvable.
        </p>

        <button
          onClick={onBack}
          style={{
            marginTop: 10,
            padding: "8px 14px",
            border: "1px solid #E5E7EB",
            borderRadius: 7,
            background: "#fff",
            cursor: "pointer",
          }}
        >
          ← Retour
        </button>
      </div>
    );
  }

  // ============================================
  // CALCULS
  // ============================================

  const total = consultation.actes.reduce(
    (sum, acte) => sum + acte.prix,
    0
  );

  const paye = consultation.paiements.reduce(
    (sum, paiement) => sum + paiement.montant,
    0
  );

  const reste = Math.max(total - paye, 0);

  // ============================================
  // STATUT
  // ============================================

  let status = "IMPAYE";

  if (total > 0 && paye >= total) {
    status = "PAYE";
  } else if (paye > 0) {
    status = "PARTIEL";
  }

  const statusStyle =
    status === "PAYE"
      ? {
          background: "#DCFCE7",
          color: "#15803D",
        }
      : status === "PARTIEL"
      ? {
          background: "#FEF3C7",
          color: "#B45309",
        }
      : {
          background: "#FEE2E2",
          color: "#B91C1C",
        };

  // ============================================
  // NOM PATIENT
  // ============================================

  const patientName =
    `${patient.prenom} ${patient.nom}`;

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      {/* ====================================== */}
      {/* CSS D'IMPRESSION : n'imprime que #facture-print */}
      {/* ====================================== */}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #facture-print,
          #facture-print * {
            visibility: visible;
          }
          #facture-print {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        id="facture-print"
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.04)",
          maxWidth: 640,
          margin: "0 auto",
        }}
      >
        {/* ====================================== */}
        {/* HEADER */}
        {/* ====================================== */}

        <div
          className="no-print"
          style={{
            padding: "16px 24px",
            borderBottom:
              "1px solid #F3F4F6",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
          }}
        >
          {/* RETOUR */}

          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6B7280",
              fontSize: 13.5,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>

            Retour
          </button>

          {/* STATUS + IMPRIMER + PDF */}

          <div
            style={{
              display: "flex",
              gap: 8,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "5px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                background:
                  statusStyle.background,
                color: statusStyle.color,
              }}
            >
              {status}
            </span>

            <button
              onClick={() =>
                window.print()
              }
              style={{
                padding: "7px 14px",
                background: "#fff",
                color: "#374151",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily:
                  "'Inter', sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>

              Imprimer
            </button>

            <button
              onClick={() =>
                window.print()
              }
              style={{
                padding: "7px 14px",
                background: "#0EA5A5",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily:
                  "'Inter', sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line
                  x1="12"
                  y1="15"
                  x2="12"
                  y2="3"
                />
              </svg>

              Exporter PDF
            </button>
          </div>
        </div>

        {/* ====================================== */}
        {/* CONTENU */}
        {/* ====================================== */}

        <div
          style={{
            padding: "32px 36px",
          }}
        >
          {/* CABINET */}

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "flex-start",
              marginBottom: 32,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    background: "#0EA5A5",
                    borderRadius: 7,
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                    <path d="M8 12h8M12 8v8" />
                  </svg>
                </div>

                <span
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#1F2937",
                  }}
                >
                  {cabinet?.nom ?? "..."}
                </span>
              </div>

              <div
                style={{
                  fontSize: 12.5,
                  color: "#6B7280",
                  lineHeight: 1.7,
                }}
              >
                {praticien && (
                  <>
                    Dr. {praticien.nomComplet}
                    {praticien.specialite && (
                      <> — {praticien.specialite}</>
                    )}
                    <br />
                  </>
                )}

                {cabinet?.adresse && (
                  <>
                    {cabinet.adresse}
                    <br />
                  </>
                )}

                {cabinet?.telephone && (
                  <>
                    Tél: {cabinet.telephone}
                    <br />
                  </>
                )}

                {cabinet?.email}
              </div>
            </div>

            {/* FACTURE */}

            <div
              style={{
                textAlign: "right",
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#1F2937",
                }}
              >
                FACTURE
              </div>

              <div
                style={{
                  fontFamily:
                    "'DM Mono', monospace",
                  fontSize: 12.5,
                  color: "#9CA3AF",
                  marginTop: 4,
                }}
              >
                N° FC-2026-
                {String(
                  consultation.id
                ).padStart(4, "0")}
              </div>

              <div
                style={{
                  fontSize: 12.5,
                  color: "#6B7280",
                  marginTop: 4,
                }}
              >
                {formatDate(
                  consultation.dateConsultation
                )}
              </div>
            </div>
          </div>

          {/* ====================================== */}
          {/* PATIENT */}
          {/* ====================================== */}

          <div
            style={{
              background: "#F8F9FA",
              borderRadius: 8,
              padding: "14px 16px",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#9CA3AF",
                textTransform:
                  "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 6,
              }}
            >
              Patient
            </div>

            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#1F2937",
              }}
            >
              {patientName}
            </div>

            <div
              style={{
                fontSize: 12.5,
                color: "#6B7280",
              }}
            >
              {patient.telephone}

              {patient.adresse && (
                <>
                  {" · "}
                  {patient.adresse}
                </>
              )}
            </div>
          </div>

          {/* ====================================== */}
          {/* CONSULTATION */}
          {/* ====================================== */}

          <div
            style={{
              marginBottom: 20,
              fontSize: 12.5,
              color: "#6B7280",
            }}
          >
            <strong
              style={{
                color: "#374151",
              }}
            >
              Motif :
            </strong>{" "}
            {consultation.motifConsultation}
          </div>

          {/* ====================================== */}
          {/* ACTES */}
          {/* ====================================== */}

          <table
            style={{
              width: "100%",
              borderCollapse:
                "collapse",
              marginBottom: 20,
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#F8F9FA",
                }}
              >
                {[
                  "Dent",
                  "Description",
                  "Montant",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding:
                        "9px 12px",
                      textAlign:
                        "left",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#9CA3AF",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.05em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {consultation.actes
                .length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      padding: 15,
                      color: "#9CA3AF",
                      textAlign:
                        "center",
                    }}
                  >
                    Aucun acte
                  </td>
                </tr>
              ) : (
                consultation.actes.map(
                  (acte) => (
                    <tr
                      key={acte.id}
                      style={{
                        borderBottom:
                          "1px solid #F3F4F6",
                      }}
                    >
                      <td
                        style={{
                          padding:
                            "12px",
                          fontSize: 13,
                          color:
                            "#6B7280",
                        }}
                      >
                        {acte.numeroDent ||
                          "-"}
                      </td>

                      <td
                        style={{
                          padding:
                            "12px",
                          fontSize: 13.5,
                          color:
                            "#1F2937",
                          fontWeight: 500,
                        }}
                      >
                        {acte.nomActe}

                        {acte.description && (
                          <div
                            style={{
                              fontSize: 11.5,
                              color:
                                "#9CA3AF",
                              marginTop: 3,
                            }}
                          >
                            {
                              acte.description
                            }
                          </div>
                        )}
                      </td>

                      <td
                        style={{
                          padding:
                            "12px",
                          fontSize: 13.5,
                          fontFamily:
                            "'DM Mono', monospace",
                          color:
                            "#1F2937",
                          textAlign:
                            "right",
                        }}
                      >
                        {acte.prix.toLocaleString(
                          "fr-FR"
                        )}{" "}
                        Ar
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>

          {/* ====================================== */}
          {/* PAIEMENTS */}
          {/* ====================================== */}

          {consultation.paiements
            .length > 0 && (
            <div
              style={{
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#9CA3AF",
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    "0.05em",
                  marginBottom: 8,
                }}
              >
                Paiements
              </div>

              {consultation.paiements.map(
                (paiement) => (
                  <div
                    key={paiement.id}
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      padding:
                        "7px 0",
                      fontSize: 12.5,
                      color:
                        "#6B7280",
                    }}
                  >
                    <span>
                      {formatDate(
                        paiement.datePaiement
                      )}{" "}
                      ·{" "}
                      {paiement.modePaiement ||
                        "Non précisé"}
                    </span>

                    <span
                      style={{
                        fontFamily:
                          "'DM Mono', monospace",
                        color:
                          "#10B981",
                      }}
                    >
                      {paiement.montant.toLocaleString(
                        "fr-FR"
                      )}{" "}
                      Ar
                    </span>
                  </div>
                )
              )}
            </div>
          )}

          {/* ====================================== */}
          {/* TOTALS */}
          {/* ====================================== */}

          <div
            style={{
              display: "flex",
              flexDirection:
                "column",
              gap: 6,
              alignItems:
                "flex-end",
            }}
          >
            {/* TOTAL */}

            <div
              style={{
                display: "flex",
                gap: 32,
                fontSize: 13,
                color: "#6B7280",
              }}
            >
              <span>Total</span>

              <span
                style={{
                  fontFamily:
                    "'DM Mono', monospace",
                  width: 100,
                  textAlign:
                    "right",
                }}
              >
                {total.toLocaleString(
                  "fr-FR"
                )}{" "}
                Ar
              </span>
            </div>

            {/* PAYÉ */}

            <div
              style={{
                display: "flex",
                gap: 32,
                fontSize: 13,
                color: "#6B7280",
              }}
            >
              <span>
                Avance reçue
              </span>

              <span
                style={{
                  fontFamily:
                    "'DM Mono', monospace",
                  width: 100,
                  textAlign:
                    "right",
                  color: "#10B981",
                }}
              >
                −{" "}
                {paye.toLocaleString(
                  "fr-FR"
                )}{" "}
                Ar
              </span>
            </div>

            {/* RESTE */}

            <div
              style={{
                display: "flex",
                gap: 32,
                fontSize: 15,
                fontWeight: 700,
                color:
                  reste > 0
                    ? "#EF4444"
                    : "#10B981",
                marginTop: 6,
                paddingTop: 10,
                borderTop:
                  "2px solid #F3F4F6",
                width: 230,
              }}
            >
              <span>
                Reste à payer
              </span>

              <span
                style={{
                  fontFamily:
                    "'DM Mono', monospace",
                  width: 100,
                  textAlign:
                    "right",
                }}
              >
                {reste.toLocaleString(
                  "fr-FR"
                )}{" "}
                Ar
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}