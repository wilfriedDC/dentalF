import { useEffect, useState } from "react";
import type { Patient, PatientTab } from "../../types";

import { Avatar } from "../../components/Avatar";
import { StatusBadge } from "../../components/StatusBadge";
import { ApptStatusBadge } from "../../components/ApptStatusBadge";
import { formatDate } from "../../utils/formatDate";

import {
  getPatient,
  type ApiPatient,
  type ApiConsultation,
} from "../../api/patients.api";


// =====================================================
// PROPS
// =====================================================

interface PatientRecordProps {
  patient: Patient;
  onBack: () => void;
  onNewConsult: () => void;
}


// =====================================================
// FORMAT MONNAIE
// =====================================================

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value) + " Ar";
}


// =====================================================
// COMPONENT
// =====================================================

export function PatientRecord({
  patient,
  onBack,
  onNewConsult,
}: PatientRecordProps) {

  const [tab, setTab] = useState<PatientTab>("overview");

  const [data, setData] = useState<ApiPatient | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // ===================================================
  // CHARGER LE PATIENT
  // ===================================================

  useEffect(() => {

    const loadPatient = async () => {

      try {

        setLoading(true);
        setError("");

        const result = await getPatient(patient.id);

        setData(result);

      } catch (err) {

        console.error("Erreur chargement patient :", err);

        setError(
          "Impossible de charger les informations du patient."
        );

      } finally {

        setLoading(false);

      }
    };

    loadPatient();

  }, [patient.id]);


  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {

    return (
      <div
        style={{
          height: "100%",
          minHeight: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #E5E7EB",
          color: "#9CA3AF",
          fontSize: 14,
        }}
      >
        Chargement du patient...
      </div>
    );

  }


  // ===================================================
  // ERROR
  // ===================================================

  if (error || !data) {

    return (
      <div
        style={{
          height: "100%",
          minHeight: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #E5E7EB",
        }}
      >

        <div
          style={{
            color: "#EF4444",
            fontSize: 14,
          }}
        >
          {error || "Patient introuvable."}
        </div>

        <button
          onClick={onBack}
          style={{
            padding: "8px 16px",
            border: "1px solid #D1D5DB",
            borderRadius: 8,
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Retour
        </button>

      </div>
    );

  }


  // ===================================================
  // DONNEES
  // ===================================================

  const consultations = data.consultations ?? [];

  const rendezVous = data.rendezVous ?? [];


  // ===================================================
  // CALCUL FINANCES
  // ===================================================

  const totalPaid = consultations.reduce(
    (total, consultation) => {

      const payments = consultation.paiements ?? [];

      return (
        total +
        payments.reduce(
          (sum, payment) => sum + payment.montant,
          0
        )
      );

    },
    0
  );


  const totalAmount = consultations.reduce(
    (total, consultation) => {

      const actes = consultation.actes ?? [];

      return (
        total +
        actes.reduce(
          (sum, acte) => sum + acte.prix,
          0
        )
      );

    },
    0
  );


  const totalOwed = Math.max(
    totalAmount - totalPaid,
    0
  );


  // ===================================================
  // TABS
  // ===================================================

  const TABS: {
    id: PatientTab;
    label: string;
  }[] = [

    {
      id: "overview",
      label: "Aperçu",
    },

    {
      id: "consultations",
      label: "Consultations",
    },

    {
      id: "payments",
      label: "Paiements",
    },

    {
      id: "appointments",
      label: "Rendez-vous",
    },

  ];


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #E5E7EB",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid #F3F4F6",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >

        {/* BACK */}

        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#6B7280",
            padding: 4,
            borderRadius: 6,
            display: "flex",
          }}
        >

          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>

        </button>


        {/* AVATAR */}

        <Avatar
          name={`${data.nom} ${data.prenom}`}
          size={46}
        />


        {/* INFORMATIONS */}

        <div
          style={{
            flex: 1,
          }}
        >

          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#1F2937",
            }}
          >
            {data.nom} {data.prenom}
          </div>


          <div
            style={{
              fontSize: 12.5,
              color: "#6B7280",
              marginTop: 4,
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
            }}
          >

            <span>
              {data.telephone}
            </span>

            {data.email && (
              <span>
                {data.email}
              </span>
            )}

            {data.dateNaissance && (
              <span>
                Né(e) le {formatDate(data.dateNaissance)}
              </span>
            )}

          </div>

        </div>


        {/* SOLDE */}

        {totalOwed > 0 && (

          <div
            style={{
              background: "#FEE2E2",
              color: "#991B1B",
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Solde dû : {formatMoney(totalOwed)}
          </div>

        )}


        {/* NOUVELLE CONSULTATION */}

        <button
          onClick={onNewConsult}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            background: "#0EA5A5",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13.5,
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
          }}
        >

          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >

            <line
              x1="12"
              y1="5"
              x2="12"
              y2="19"
            />

            <line
              x1="5"
              y1="12"
              x2="19"
              y2="12"
            />

          </svg>

          Ajouter consultation

        </button>

      </div>


      {/* =================================================
          TABS
      ================================================= */}

      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #F3F4F6",
          padding: "0 24px",
        }}
      >

        {TABS.map((t) => (

          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "12px 16px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 13.5,
              fontWeight:
                tab === t.id ? 600 : 400,
              color:
                tab === t.id
                  ? "#0EA5A5"
                  : "#6B7280",
              borderBottom:
                tab === t.id
                  ? "2px solid #0EA5A5"
                  : "2px solid transparent",
              fontFamily: "'Inter', sans-serif",
              transition: "all 0.15s",
              marginBottom: -1,
            }}
          >

            {t.label}

          </button>

        ))}

      </div>


      {/* =================================================
          CONTENT
      ================================================= */}

      <div
        style={{
          padding: "20px 24px",
          overflowY: "auto",
          maxHeight: "calc(100vh - 380px)",
        }}
      >


        {/* =================================================
            APERCU
        ================================================= */}

        {tab === "overview" && (

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >

            {/* INFORMATIONS */}

            <div
              style={{
                background: "#F8F9FA",
                borderRadius: 10,
                padding: "16px 18px",
              }}
            >

              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 12,
                }}
              >
                Informations
              </div>


              {[
                ["Téléphone", data.telephone],
                ["Email", data.email || "—"],
                ["Adresse", data.adresse || "—"],
                [
                  "Date de naissance",
                  data.dateNaissance
                    ? formatDate(data.dateNaissance)
                    : "—",
                ],
                [
                  "Dernière visite",
                  consultations.length > 0
                    ? formatDate(
                        consultations[0].dateConsultation
                      )
                    : "Aucune",
                ],
              ].map(([key, value]) => (

                <div
                  key={key}
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >

                  <span
                    style={{
                      fontSize: 12.5,
                      color: "#6B7280",
                      width: 130,
                      flexShrink: 0,
                    }}
                  >
                    {key}
                  </span>

                  <span
                    style={{
                      fontSize: 12.5,
                      color: "#1F2937",
                      fontWeight: 500,
                    }}
                  >
                    {value}
                  </span>

                </div>

              ))}

            </div>


            {/* FINANCES */}

            <div
              style={{
                background: "#F8F9FA",
                borderRadius: 10,
                padding: "16px 18px",
              }}
            >

              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 12,
                }}
              >
                Finances
              </div>


              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >

                <span
                  style={{
                    fontSize: 12.5,
                    color: "#6B7280",
                  }}
                >
                  Total des actes
                </span>

                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#1F2937",
                  }}
                >
                  {formatMoney(totalAmount)}
                </span>

              </div>


              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >

                <span
                  style={{
                    fontSize: 12.5,
                    color: "#6B7280",
                  }}
                >
                  Total payé
                </span>

                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#10B981",
                  }}
                >
                  {formatMoney(totalPaid)}
                </span>

              </div>


              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >

                <span
                  style={{
                    fontSize: 12.5,
                    color: "#6B7280",
                  }}
                >
                  Reste dû
                </span>

                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color:
                      totalOwed > 0
                        ? "#EF4444"
                        : "#10B981",
                  }}
                >
                  {formatMoney(totalOwed)}
                </span>

              </div>


              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >

                <span
                  style={{
                    fontSize: 12.5,
                    color: "#6B7280",
                  }}
                >
                  Consultations
                </span>

                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#1F2937",
                  }}
                >
                  {consultations.length}
                </span>

              </div>

            </div>

          </div>

        )}


        {/* =================================================
            CONSULTATIONS
        ================================================= */}

        {tab === "consultations" && (

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >

            {consultations.length === 0 && (

              <div
                style={{
                  color: "#9CA3AF",
                  fontSize: 13.5,
                  textAlign: "center",
                  padding: 32,
                }}
              >
                Aucune consultation enregistrée.
              </div>

            )}


            {consultations.map(
              (consultation: ApiConsultation) => {

                const actes =
                  consultation.actes ?? [];

                const payments =
                  consultation.paiements ?? [];

                const montantActes =
                  actes.reduce(
                    (sum, acte) =>
                      sum + acte.prix,
                    0
                  );

                const montantPaye =
                  payments.reduce(
                    (sum, paiement) =>
                      sum + paiement.montant,
                    0
                  );

                const reste =
                  Math.max(
                    montantActes - montantPaye,
                    0
                  );


                const status =
                  reste === 0
                    ? "Paid"
                    : montantPaye > 0
                      ? "Partial"
                      : "Unpaid";


                return (

                  <div
                    key={consultation.id}
                    style={{
                      border: "1px solid #E5E7EB",
                      borderRadius: 10,
                      padding: "14px 18px",
                      display: "flex",
                      gap: 16,
                      alignItems: "flex-start",
                    }}
                  >

                    {/* STATUS BAR */}

                    <div
                      style={{
                        width: 3,
                        background:
                          status === "Paid"
                            ? "#10B981"
                            : status === "Partial"
                              ? "#F59E0B"
                              : "#EF4444",
                        borderRadius: 2,
                        alignSelf: "stretch",
                        flexShrink: 0,
                      }}
                    />


                    <div
                      style={{
                        flex: 1,
                      }}
                    >

                      {/* TITLE */}

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent:
                            "space-between",
                          marginBottom: 4,
                        }}
                      >

                        <div
                          style={{
                            fontSize: 13.5,
                            fontWeight: 600,
                            color: "#1F2937",
                          }}
                        >
                          {actes.length > 0
                            ? actes
                                .map(
                                  (acte) =>
                                    acte.nomActe
                                )
                                .join(", ")
                            : "Consultation"}
                        </div>

                        <StatusBadge
                          status={status}
                        />

                      </div>


                      {/* DATE */}

                      <div
                        style={{
                          fontSize: 12.5,
                          color: "#6B7280",
                          marginBottom: 6,
                        }}
                      >
                        {formatDate(
                          consultation.dateConsultation
                        )}

                        {" — "}

                        {consultation.motifConsultation}

                      </div>


                      {/* OBSERVATION */}

                      {consultation.observation && (

                        <div
                          style={{
                            fontSize: 12,
                            color: "#9CA3AF",
                            fontStyle: "italic",
                          }}
                        >
                          {consultation.observation}
                        </div>

                      )}


                      {/* ACTES */}

                      {actes.length > 0 && (

                        <div
                          style={{
                            marginTop: 10,
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >

                          {actes.map((acte) => (

                            <div
                              key={acte.id}
                              style={{
                                display: "flex",
                                justifyContent:
                                  "space-between",
                                fontSize: 12,
                              }}
                            >

                              <span
                                style={{
                                  color: "#6B7280",
                                }}
                              >
                                {acte.numeroDent
                                  ? `Dent ${acte.numeroDent} — `
                                  : ""}
                                {acte.nomActe}
                              </span>

                              <strong
                                style={{
                                  color: "#1F2937",
                                }}
                              >
                                {formatMoney(
                                  acte.prix
                                )}
                              </strong>

                            </div>

                          ))}

                        </div>

                      )}


                      {/* FINANCES CONSULTATION */}

                      <div
                        style={{
                          marginTop: 10,
                          display: "flex",
                          gap: 16,
                          flexWrap: "wrap",
                        }}
                      >

                        <span
                          style={{
                            fontSize: 12.5,
                            color: "#6B7280",
                          }}
                        >
                          Total :{" "}
                          <strong
                            style={{
                              color: "#1F2937",
                            }}
                          >
                            {formatMoney(
                              montantActes
                            )}
                          </strong>
                        </span>


                        <span
                          style={{
                            fontSize: 12.5,
                            color: "#6B7280",
                          }}
                        >
                          Payé :{" "}
                          <strong
                            style={{
                              color: "#10B981",
                            }}
                          >
                            {formatMoney(
                              montantPaye
                            )}
                          </strong>
                        </span>


                        {reste > 0 && (

                          <span
                            style={{
                              fontSize: 12.5,
                              color: "#6B7280",
                            }}
                          >
                            Reste :{" "}
                            <strong
                              style={{
                                color: "#EF4444",
                              }}
                            >
                              {formatMoney(
                                reste
                              )}
                            </strong>
                          </span>

                        )}

                      </div>

                    </div>

                  </div>

                );

              }
            )}

          </div>

        )}


        {/* =================================================
            PAIEMENTS
        ================================================= */}

        {tab === "payments" && (

          <div>

            {consultations.every(
              (c) =>
                (c.paiements ?? []).length === 0
            ) && (

              <div
                style={{
                  color: "#9CA3AF",
                  fontSize: 13.5,
                  textAlign: "center",
                  padding: 32,
                }}
              >
                Aucun paiement enregistré.
              </div>

            )}


            {consultations.map(
              (consultation) =>

                (consultation.paiements ?? []).map(
                  (payment) => (

                    <div
                      key={payment.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "12px 0",
                        borderBottom:
                          "1px solid #F3F4F6",
                      }}
                    >

                      <div
                        style={{
                          fontFamily:
                            "'DM Mono', monospace",
                          fontSize: 12.5,
                          color: "#9CA3AF",
                          width: 100,
                        }}
                      >
                        {formatDate(
                          payment.datePaiement
                        )}
                      </div>


                      <div
                        style={{
                          flex: 1,
                          fontSize: 13,
                          color: "#374151",
                        }}
                      >
                        Paiement consultation #
                        {consultation.id}

                        {payment.modePaiement && (
                          <span
                            style={{
                              marginLeft: 8,
                              color: "#9CA3AF",
                            }}
                          >
                            ({payment.modePaiement})
                          </span>
                        )}
                      </div>


                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#10B981",
                        }}
                      >
                        {formatMoney(
                          payment.montant
                        )}
                      </div>

                    </div>

                  )
                )
            )}

          </div>

        )}


        {/* =================================================
            RENDEZ-VOUS
        ================================================= */}

        {tab === "appointments" && (

          <div>

            {rendezVous.length === 0 ? (

              <div
                style={{
                  color: "#9CA3AF",
                  fontSize: 13.5,
                  textAlign: "center",
                  padding: 32,
                }}
              >
                Aucun rendez-vous enregistré.
              </div>

            ) : (

              rendezVous.map((rdv) => (

                <div
                  key={rdv.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "13px 0",
                    borderBottom:
                      "1px solid #F3F4F6",
                  }}
                >

                  <div
                    style={{
                      fontFamily:
                        "'DM Mono', monospace",
                      fontSize: 12.5,
                      color: "#9CA3AF",
                      width: 100,
                    }}
                  >
                    {formatDate(rdv.date)}
                  </div>


                  <div
                    style={{
                      fontFamily:
                        "'DM Mono', monospace",
                      fontSize: 12.5,
                      color: "#374151",
                      width: 50,
                    }}
                  >
                    {rdv.heure}
                  </div>


                  <div
                    style={{
                      flex: 1,
                      fontSize: 13.5,
                      color: "#374151",
                    }}
                  >
                    {rdv.motif || "Rendez-vous"}
                  </div>


                  <ApptStatusBadge
                    status={rdv.statut}
                  />

                </div>

              ))

            )}

          </div>

        )}

      </div>

    </div>

  );
}