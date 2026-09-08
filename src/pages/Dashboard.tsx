import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavSection } from "../types";

import { getPatients } from "../api/patients.api";
import { getConsultations, type ApiConsultation } from "../api/consultations.api";
import { getRendezVous } from "../api/rendezvous.api";
import { getPraticiens, type Praticien } from "../api/settings.api";

import { StatCard } from "../components/StatCard";
import { Avatar } from "../components/Avatar";
import { ApptStatusBadge } from "../components/ApptStatusBadge";

interface DashboardProps {
  onNav: (section: NavSection) => void;
}

interface DashboardAppointment {
  id: number;
  time: string;
  patientName: string;
  reason: string;
  status: string;
  duration: number;
}

interface ActivityItem {
  id: string;
  initials: string;
  text: string;
  time: string;
  type: "payment" | "consultation";
}

export function Dashboard({ onNav }: DashboardProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<ApiConsultation[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [praticien, setPraticien] = useState<Praticien | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // CHARGEMENT DES DONNÉES
  // ==========================================

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [patientsData, consultationsData, appointmentsData, praticiensData] =
        await Promise.all([
          getPatients(),
          getConsultations(),
          getRendezVous(),
          getPraticiens(),
        ]);

      console.log("Dashboard patients :", patientsData);
      console.log("Dashboard consultations :", consultationsData);
      console.log("Dashboard rendez-vous :", appointmentsData);
      console.log("Dashboard praticiens :", praticiensData);

      setPatients(patientsData);
      setConsultations(consultationsData);
      setAppointments(appointmentsData);
      setPraticien(praticiensData[0] ?? null);
    } catch (err) {
      console.error("Erreur chargement Dashboard :", err);
      setError("Impossible de charger les données du dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ==========================================
  // NOM DU PRATICIEN AFFICHÉ
  // ==========================================

  const doctorGreeting = useMemo(() => {
    if (!praticien) return "Docteur";

    return praticien.specialite
      ? `Dr. ${praticien.nomComplet}`
      : praticien.nomComplet;
  }, [praticien]);

  // ==========================================
  // DATE DU JOUR
  // ==========================================

  const today = useMemo(() => {
    const date = new Date();

    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
    };
  }, []);

  // ==========================================
  // FORMAT DATE POUR L'AFFICHAGE
  // ==========================================

  const todayLabel = useMemo(() => {
    const date = new Date();

    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, []);

  // ==========================================
  // RENDEZ-VOUS DU JOUR
  // ==========================================

  const todayAppointments = useMemo<DashboardAppointment[]>(() => {
    return appointments
      .filter((appointment) => {
        const appointmentDate = new Date(appointment.date);

        return (
          appointmentDate.getFullYear() === today.year &&
          appointmentDate.getMonth() === today.month &&
          appointmentDate.getDate() === today.day
        );
      })
      .map((appointment) => ({
        id: appointment.id,
        time: appointment.heure,
        patientName: appointment.patient
          ? `${appointment.patient.nom} ${appointment.patient.prenom}`
          : "Patient inconnu",
        reason: appointment.motif || "Consultation",
        status: appointment.statut,
        duration: 30,
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, today]);

  // ==========================================
  // NOMBRE DE RDV CONFIRMÉS
  // ==========================================

  const confirmedAppointments = useMemo(() => {
    return todayAppointments.filter(
      (appointment) =>
        appointment.status === "CONFIRME" ||
        appointment.status === "CONFIRMED"
    ).length;
  }, [todayAppointments]);

  // ==========================================
  // TOTAL RESTANT À PAYER
  // ==========================================

  const totalUnpaid = useMemo(() => {
    return consultations.reduce((total, consultation) => {
      const totalActes = consultation.actes.reduce(
        (sum, acte) => sum + Number(acte.prix || 0),
        0
      );

      const totalPaye = consultation.paiements.reduce(
        (sum, paiement) => sum + Number(paiement.montant || 0),
        0
      );

      return total + Math.max(totalActes - totalPaye, 0);
    }, 0);
  }, [consultations]);

  // ==========================================
  // RECETTES DU JOUR
  // ==========================================

  const todayRevenue = useMemo(() => {
    let total = 0;

    consultations.forEach((consultation) => {
      consultation.paiements.forEach((paiement) => {
        const paymentDate = new Date(paiement.datePaiement);

        if (
          paymentDate.getFullYear() === today.year &&
          paymentDate.getMonth() === today.month &&
          paymentDate.getDate() === today.day
        ) {
          total += Number(paiement.montant || 0);
        }
      });
    });

    return total;
  }, [consultations, today]);

  // ==========================================
  // NOMBRE DE PAIEMENTS DU JOUR
  // ==========================================

  const todayPaymentsCount = useMemo(() => {
    let count = 0;

    consultations.forEach((consultation) => {
      consultation.paiements.forEach((paiement) => {
        const paymentDate = new Date(paiement.datePaiement);

        if (
          paymentDate.getFullYear() === today.year &&
          paymentDate.getMonth() === today.month &&
          paymentDate.getDate() === today.day
        ) {
          count++;
        }
      });
    });

    return count;
  }, [consultations, today]);

  // ==========================================
  // ACTIVITÉ RÉCENTE
  // ==========================================

  const activities = useMemo<ActivityItem[]>(() => {
    const items: {
      id: string;
      date: Date;
      initials: string;
      text: string;
      type: "payment" | "consultation";
    }[] = [];

    consultations.forEach((consultation) => {
      const patient = consultation.patient;

      const patientName = patient
        ? `${patient.nom} ${patient.prenom}`
        : "Patient inconnu";

      const initials = patient
        ? `${patient.prenom?.charAt(0) || ""}${patient.nom?.charAt(0) || ""}`.toUpperCase()
        : "?";

      consultation.paiements.forEach((paiement) => {
        items.push({
          id: `payment-${paiement.id}`,
          date: new Date(paiement.datePaiement),
          initials,
          text: `${patientName} — Paiement ${Number(
            paiement.montant || 0
          ).toLocaleString("fr-FR")} Ar reçu`,
          type: "payment",
        });
      });
    });

    consultations.forEach((consultation) => {
      const patient = consultation.patient;

      const patientName = patient
        ? `${patient.nom} ${patient.prenom}`
        : "Patient inconnu";

      const initials = patient
        ? `${patient.prenom?.charAt(0) || ""}${patient.nom?.charAt(0) || ""}`.toUpperCase()
        : "?";

      items.push({
        id: `consultation-${consultation.id}`,
        date: new Date(consultation.dateConsultation),
        initials,
        text: `${patientName} — Consultation ajoutée`,
        type: "consultation",
      });
    });

    return items
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        initials: item.initials,
        text: item.text,
        type: item.type,
        time: formatRelativeTime(item.date),
      }));
  }, [consultations]);

  // ==========================================
  // STYLES PARTAGÉS (hover / responsive)
  // ==========================================

  const sharedStyles = (
    <style>{`
      @keyframes dash-shimmer {
        0% { background-position: -400px 0; }
        100% { background-position: 400px 0; }
      }
      .dash-skeleton {
        background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 37%, #F3F4F6 63%);
        background-size: 800px 100%;
        animation: dash-shimmer 1.4s ease infinite;
        border-radius: 8px;
      }
      .dash-stat-card {
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        border-radius: 12px;
      }
      .dash-stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0,0,0,0.07);
      }
      .dash-row {
        transition: background-color 0.15s ease;
        cursor: default;
      }
      .dash-row:hover {
        background-color: #FAFAFA;
      }
      .dash-retry-btn {
        margin-top: 12px;
        padding: 7px 16px;
        border-radius: 8px;
        border: 1px solid #FECACA;
        background: #fff;
        color: #DC2626;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.15s ease;
      }
      .dash-retry-btn:hover {
        background-color: #FEF2F2;
      }
      .dash-stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 14px;
      }
      .dash-content-grid {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 18px;
      }
      @media (max-width: 900px) {
        .dash-stats-grid { grid-template-columns: repeat(2, 1fr); }
        .dash-content-grid { grid-template-columns: 1fr; }
      }
      @media (max-width: 520px) {
        .dash-stats-grid { grid-template-columns: 1fr; }
      }
    `}</style>
  );

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {sharedStyles}

        <div className="dash-skeleton" style={{ width: 220, height: 22 }} />

        <div className="dash-stats-grid">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="dash-skeleton"
              style={{ height: 88, borderRadius: 12 }}
            />
          ))}
        </div>

        <div className="dash-content-grid">
          <div
            className="dash-skeleton"
            style={{ height: 320, borderRadius: 12 }}
          />
          <div
            className="dash-skeleton"
            style={{ height: 320, borderRadius: 12 }}
          />
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div
        style={{
          background: "#FEF2F2",
          border: "1px solid #FECACA",
          borderRadius: 12,
          padding: 20,
          color: "#DC2626",
          fontSize: 14,
        }}
      >
        {error}
        <div>
          <button className="dash-retry-btn" onClick={loadDashboard}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // DASHBOARD
  // ==========================================

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {sharedStyles}

      {/* HEADER */}

      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#1F2937" }}>
          Bonjour, {doctorGreeting}
        </div>

        <div
          style={{
            fontSize: 13.5,
            color: "#6B7280",
            marginTop: 3,
            textTransform: "capitalize",
          }}
        >
          {todayLabel} — {todayAppointments.length} rendez-vous aujourd'hui
        </div>
      </div>

      {/* STATS */}

      <div className="dash-stats-grid">
        <div className="dash-stat-card">
          <StatCard
            label="Total patients"
            value={patients.length}
            sub="Patients enregistrés"
            color="#0EA5A5"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              </svg>
            }
          />
        </div>

        <div className="dash-stat-card">
          <StatCard
            label="Factures impayées"
            value={`${totalUnpaid.toLocaleString("fr-FR")} Ar`}
            sub="Reste à payer"
            color="#EF4444"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            }
          />
        </div>

        <div className="dash-stat-card">
          <StatCard
            label="Recettes du jour"
            value={`${todayRevenue.toLocaleString("fr-FR")} Ar`}
            sub={`${todayPaymentsCount} paiement${todayPaymentsCount > 1 ? "s" : ""} reçu${todayPaymentsCount > 1 ? "s" : ""}`}
            color="#10B981"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            }
          />
        </div>

        <div className="dash-stat-card">
          <StatCard
            label="RDV aujourd'hui"
            value={todayAppointments.length}
            sub={`${confirmedAppointments} confirmé${confirmedAppointments > 1 ? "s" : ""}`}
            color="#F59E0B"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
          />
        </div>
      </div>

      {/* CONTENT */}

      <div className="dash-content-grid">
        {/* RENDEZ-VOUS DU JOUR */}

        <div
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              padding: "18px 22px 14px",
              borderBottom: "1px solid #F3F4F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1F2937" }}>
              Rendez-vous du jour
            </div>

            <button
              onClick={() => onNav("appointments")}
              style={{
                fontSize: 12.5,
                color: "#0EA5A5",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Voir tout →
            </button>
          </div>

          <div>
            {todayAppointments.length === 0 ? (
              <EmptyState text="Aucun rendez-vous aujourd'hui." />
            ) : (
              todayAppointments.map((appt, index) => (
                <div
                  key={appt.id}
                  className="dash-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "13px 22px",
                    borderBottom:
                      index < todayAppointments.length - 1
                        ? "1px solid #F9FAFB"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 13,
                      color: "#6B7280",
                      width: 44,
                      flexShrink: 0,
                    }}
                  >
                    {appt.time}
                  </div>

                  <div
                    style={{
                      width: 3,
                      height: 36,
                      borderRadius: 2,
                      background:
                        appt.status === "CONFIRME" || appt.status === "CONFIRMED"
                          ? "#0EA5A5"
                          : "#F59E0B",
                      flexShrink: 0,
                    }}
                  />

                  <Avatar name={appt.patientName} size={32} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: "#1F2937" }}>
                      {appt.patientName}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: "#9CA3AF",
                        marginTop: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {appt.reason}
                    </div>
                  </div>

                  <div style={{ fontSize: 11.5, color: "#9CA3AF" }}>
                    {appt.duration} min
                  </div>

                  <ApptStatusBadge status={appt.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* ACTIVITÉ RÉCENTE */}

        <div
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1F2937" }}>
              Activité récente
            </div>
          </div>

          <div style={{ padding: "8px 0" }}>
            {activities.length === 0 ? (
              <EmptyState text="Aucune activité récente." small />
            ) : (
              activities.map((item) => (
                <div
                  key={item.id}
                  className="dash-row"
                  style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "10px 20px" }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: item.type === "payment" ? "#D1FAE5" : "#E0F5F5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      color: item.type === "payment" ? "#059669" : "#0EA5A5",
                      flexShrink: 0,
                    }}
                  >
                    {item.initials}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.4 }}>
                      {item.text}
                    </div>

                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                      {item.time}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// EMPTY STATE
// ==========================================

function EmptyState({ text, small }: { text: string; small?: boolean }) {
  return (
    <div
      style={{
        padding: small ? 30 : 40,
        textAlign: "center",
        color: "#9CA3AF",
      }}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ margin: "0 auto 8px" }}
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="9" y1="16" x2="15" y2="16" />
      </svg>
      <div style={{ fontSize: small ? 13 : 13.5 }}>{text}</div>
    </div>
  );
}

// ==========================================
// TEMPS RELATIF
// ==========================================

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (diff < 0) return "à venir";
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (hours < 24) return `il y a ${hours} h`;
  if (days === 1) return "il y a 1 j";
  if (days < 30) return `il y a ${days} j`;

  return date.toLocaleDateString("fr-FR");
}