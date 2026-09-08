import { useEffect, useState } from "react";

import {
  getRendezVous,
  updateRendezVous,
  deleteRendezVous,
  type ApiRendezVous,
} from "../api/rendezvous.api";

import { Avatar } from "../components/Avatar";
import { ApptStatusBadge } from "../components/ApptStatusBadge";

interface AppointmentsSectionProps {
  // REQUIS pour que "Ouvrir" fonctionne : le parent doit basculer son état de page
  // vers la vue "dossier patient" en utilisant ce patientId. Ex. dans le parent :
  //   const [page, setPage] = useState<{ name: "agenda" | "patient"; patientId?: number }>({ name: "agenda" });
  //   <AppointmentsSection onOpenPatient={(id) => setPage({ name: "patient", patientId: id })} />
  onOpenPatient: (patientId: number) => void;
  onCreateAppointment?: (date: Date, hour: string) => void;
}

// Heures de la journée affichées dans le planning
const HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

// Progression des statuts : cliquer sur le bouton fait passer au statut suivant.
// ⚠️ Ajuste ces clés/valeurs pour qu'elles correspondent EXACTEMENT aux statuts
// utilisés par ton backend (ex: table rendez_vous, colonne "statut").
const STATUT_SUIVANT: Record<string, string> = {
  planifie: "confirme",
  confirme: "termine",
};

export function AppointmentsSection({
  onOpenPatient,
  onCreateAppointment,
}: AppointmentsSectionProps) {
  const [appointments, setAppointments] = useState<ApiRendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

  // ID du rendez-vous en cours de traitement (évite le double-clic pendant un appel API)
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getRendezVous();
        setAppointments(data);
      } catch (err) {
        console.error("Erreur chargement rendez-vous :", err);
        setError("Impossible de charger les rendez-vous.");
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, []);

  // ---- Utilitaires date/heure ----

  const getDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Normalise n'importe quel format d'heure ("9:00", "09:00:00", "09:00")
  // vers l'heure numérique (0-23), pour une comparaison fiable.
  const getHourNumber = (heure: string) => {
    const hourPart = heure.split(":")[0];
    return parseInt(hourPart, 10);
  };

  const selectedDateKey = getDateKey(selectedDate);
  const todayKey = getDateKey(new Date());
  const isToday = selectedDateKey === todayKey;

  const selectedAppointments = appointments.filter((appt) => {
    const appointmentDateKey = getDateKey(new Date(appt.date));
    return appointmentDateKey === selectedDateKey;
  });

  const changeDate = (days: number) => {
    setSelectedDate((currentDate) => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  };

  const dateLabel = selectedDate.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ---- Actions backend ----

  /**
   * Fait avancer le rendez-vous au statut suivant (planifie -> confirme -> termine).
   * Met à jour l'état local de façon optimiste après confirmation du backend.
   */
  const handleAdvanceStatus = async (appt: ApiRendezVous) => {
    const nextStatut = STATUT_SUIVANT[appt.statut];
    if (!nextStatut || processingId === appt.id) return;

    setProcessingId(appt.id);
    try {
      await updateRendezVous(appt.id, { statut: nextStatut });
      setAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? { ...a, statut: nextStatut } : a))
      );
    } catch (err) {
      console.error("Erreur mise à jour du statut :", err);
      setError("Impossible de mettre à jour le statut.");
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * Supprime un rendez-vous après confirmation de l'utilisateur.
   */
  const handleDelete = async (appt: ApiRendezVous) => {
    if (processingId === appt.id) return;

    const patientName = appt.patient
      ? `${appt.patient.nom} ${appt.patient.prenom}`
      : "ce patient";

    const confirmed = window.confirm(
      `Supprimer le rendez-vous de ${patientName} à ${appt.heure} ?`
    );
    if (!confirmed) return;

    setProcessingId(appt.id);
    try {
      await deleteRendezVous(appt.id);
      setAppointments((prev) => prev.filter((a) => a.id !== appt.id));
    } catch (err) {
      console.error("Erreur suppression rendez-vous :", err);
      setError("Impossible de supprimer le rendez-vous.");
    } finally {
      setProcessingId(null);
    }
  };

  // ---- Fusion planning : rdv + créneaux libres, triés par heure ----

  type Slot =
    | { type: "appointment"; hour: string; appt: ApiRendezVous }
    | { type: "free"; hour: string };

  const currentHour = new Date().getHours();

  const slots: Slot[] = HOURS
    .map((hour) => {
      const hourNumber = getHourNumber(hour);

      const matchingAppt = selectedAppointments.find(
        (appt) => getHourNumber(appt.heure) === hourNumber
      );

      if (matchingAppt) {
        return { type: "appointment", hour, appt: matchingAppt } as Slot;
      }

      // Sur la journée d'aujourd'hui, on ne propose pas les créneaux déjà passés
      if (isToday && hourNumber < currentHour) {
        return null;
      }

      return { type: "free", hour } as Slot;
    })
    .filter((slot): slot is Slot => slot !== null);

  // ---- Loading / Error ----

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 300,
          color: "#9CA3AF",
          fontSize: 14,
        }}
      >
        Chargement des rendez-vous...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: "#FEF2F2",
          border: "1px solid #FECACA",
          borderRadius: 10,
          padding: 16,
          color: "#DC2626",
          fontSize: 13.5,
        }}
      >
        {error}
      </div>
    );
  }

  const columns = "70px 1fr 120px 100px 180px";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1F2937" }}>
            Rendez-vous
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#6B7280",
              marginTop: 2,
              textTransform: "capitalize",
            }}
          >
            {dateLabel}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <NavButton onClick={() => changeDate(-1)}>‹ Hier</NavButton>
          <NavButton
            onClick={() => setSelectedDate(new Date())}
            active={isToday}
          >
            Aujourd'hui
          </NavButton>
          <NavButton onClick={() => changeDate(1)}>Demain ›</NavButton>
        </div>
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: columns,
            padding: "12px 20px",
            borderBottom: "1px solid #F3F4F6",
            background: "#F8F9FA",
          }}
        >
          {["Heure", "Patient — Motif", "Durée", "Statut", "Actions"].map(
            (h) => (
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
            )
          )}
        </div>

        {slots.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "#9CA3AF",
              fontSize: 13.5,
            }}
          >
            Aucun créneau disponible pour cette date.
          </div>
        ) : (
          slots.map((slot, index) => {
            const isLast = index === slots.length - 1;
            const borderBottom = isLast ? "none" : "1px solid #F9FAFB";

            if (slot.type === "appointment") {
              const { appt } = slot;
              const patientName = appt.patient
                ? `${appt.patient.nom} ${appt.patient.prenom}`
                : "Patient inconnu";
              const isProcessing = processingId === appt.id;
              const nextStatut = STATUT_SUIVANT[appt.statut];

              return (
                <div
                  key={`appt-${appt.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: columns,
                    padding: "14px 20px",
                    borderBottom,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 13.5,
                      color: "#1F2937",
                      fontWeight: 500,
                    }}
                  >
                    {appt.heure}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={patientName} size={30} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: "#1F2937" }}>
                        {patientName}
                      </div>
                      <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                        {appt.motif || "Rendez-vous"}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: "#9CA3AF" }}>—</div>

                  <div>
                    <ApptStatusBadge status={appt.statut} />
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => onOpenPatient(appt.patientId)}
                      style={{
                        padding: "5px 10px",
                        border: "1px solid #E5E7EB",
                        borderRadius: 6,
                        background: "#fff",
                        fontSize: 12,
                        color: "#0EA5A5",
                        cursor: "pointer",
                        fontWeight: 500,
                        transition: "background 0.15s, border-color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#F0FDFA";
                        e.currentTarget.style.borderColor = "#99F6E4";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.borderColor = "#E5E7EB";
                      }}
                    >
                      Ouvrir
                    </button>

                    {nextStatut && (
                      <button
                        onClick={() => handleAdvanceStatus(appt)}
                        disabled={isProcessing}
                        style={{
                          padding: "5px 10px",
                          border: "1px solid #BBF7D0",
                          borderRadius: 6,
                          background: "#F0FDF4",
                          fontSize: 12,
                          color: "#16A34A",
                          cursor: isProcessing ? "wait" : "pointer",
                          fontWeight: 500,
                          opacity: isProcessing ? 0.6 : 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isProcessing ? "..." : `→ ${nextStatut}`}
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(appt)}
                      disabled={isProcessing}
                      style={{
                        padding: "5px 10px",
                        border: "1px solid #FECACA",
                        borderRadius: 6,
                        background: "#fff",
                        fontSize: 12,
                        color: "#DC2626",
                        cursor: isProcessing ? "wait" : "pointer",
                        fontWeight: 500,
                        opacity: isProcessing ? 0.6 : 1,
                      }}
                    >
                      Suppr.
                    </button>
                  </div>
                </div>
              );
            }

            // Créneau disponible
            return (
              <div
                key={`free-${slot.hour}`}
                onClick={() => onCreateAppointment?.(selectedDate, slot.hour)}
                style={{
                  display: "grid",
                  gridTemplateColumns: columns,
                  padding: "12px 20px",
                  borderBottom,
                  alignItems: "center",
                  cursor: onCreateAppointment ? "pointer" : "default",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (onCreateAppointment) {
                    e.currentTarget.style.background = "#F8FAFA";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 13.5,
                    color: "#C4CBD4",
                  }}
                >
                  {slot.hour}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: "#B0B8C1",
                    fontStyle: "italic",
                  }}
                >
                  — disponible —
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ---- Bouton de navigation (extrait pour éviter la répétition) ----

function NavButton({
  children,
  onClick,
  active = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px",
        border: active ? "1px solid #0EA5A5" : "1px solid #E5E7EB",
        borderRadius: 8,
        background: active ? "#E0F5F5" : "#fff",
        fontSize: 13,
        color: active ? "#0EA5A5" : "#6B7280",
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        fontFamily: "'Inter', sans-serif",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      {children}
    </button>
  );
}