import { useCallback, useEffect, useState } from "react";

import {
  getRendezVous,
  updateRendezVous,
  deleteRendezVous,
  type ApiRendezVous,
} from "../api/rendezvous.api";

import { Avatar } from "../components/Avatar";
import { ApptStatusBadge } from "../components/ApptStatusBadge";
import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Trash2,
  Plus,
  CalendarX2,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";

// Nom de l'événement global déclenché après la création réussie d'un
// rendez-vous (voir NewAppointmentForm.tsx). AppointmentsSection l'écoute
// pour recharger sa liste automatiquement — sans dépendance directe entre
// les deux composants (même pattern que PRATICIEN_UPDATED_EVENT sur la
// Sidebar).
export const RENDEZVOUS_UPDATED_EVENT = "rendezvous:updated";

interface AppointmentsSectionProps {
  // REQUIS pour que "Ouvrir" fonctionne : le parent doit basculer son état de page
  // vers la vue "dossier patient" en utilisant ce patientId. Ex. dans le parent :
  //   const [page, setPage] = useState<{ name: "agenda" | "patient"; patientId?: number }>({ name: "agenda" });
  //   <AppointmentsSection onOpenPatient={(id) => setPage({ name: "patient", patientId: id })} />
  onOpenPatient: (patientId: number) => void;
  onCreateAppointment?: (date: Date, hour: string) => void;
}

// Heures de la journée affichées dans le planning (créneaux libres suggérés)
const HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

// Tous les statuts possibles — utilisés pour le menu de changement de statut.
// ⚠️ Ajuste ces clés pour qu'elles correspondent EXACTEMENT aux statuts
// utilisés par ton backend (ex: table rendez_vous, colonne "statut").
const STATUTS: { value: string; label: string }[] = [
  { value: "planifie", label: "Planifié" },
  { value: "confirme", label: "Confirmé" },
  { value: "termine", label: "Terminé" },
  { value: "annule", label: "Annulé" },
];

// Couleur d'accent par statut, pour la barre latérale de chaque ligne et le sélecteur
const STATUT_COLOR: Record<string, string> = {
  planifie: "#F59E0B",
  confirme: "#0EA5A5",
  termine: "#10B981",
  annule: "#EF4444",
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

  const loadAppointments = useCallback(async (options?: { silent?: boolean }) => {
    try {
      // Rechargement silencieux (déclenché par l'événement global) : on ne
      // remet pas l'écran de chargement plein écran, pour ne pas faire
      // disparaître la liste actuellement affichée pendant le refetch.
      if (!options?.silent) {
        setLoading(true);
      }
      setError("");
      const data = await getRendezVous();
      setAppointments(data);
    } catch (err) {
      console.error("Erreur chargement rendez-vous :", err);
      setError("Impossible de charger les rendez-vous.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Rechargement automatique quand un rendez-vous est créé ailleurs (modale
  // "Nouveau rendez-vous", créneau libre, etc.) — voir RENDEZVOUS_UPDATED_EVENT.
  useEffect(() => {
    const handleRendezVousUpdated = () => {
      loadAppointments({ silent: true });
    };

    window.addEventListener(RENDEZVOUS_UPDATED_EVENT, handleRendezVousUpdated);

    return () => {
      window.removeEventListener(RENDEZVOUS_UPDATED_EVENT, handleRendezVousUpdated);
    };
  }, [loadAppointments]);

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

  // Heure actuelle au format "HH:MM", utilisée comme valeur par défaut pour
  // le bouton "Nouveau RDV" (heure exacte, indépendante de la grille HOURS).
  const getCurrentTimeString = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
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
   * Change le statut du rendez-vous vers n'importe quelle valeur choisie dans le menu
   * (pas seulement l'étape suivante). Mise à jour optimiste après confirmation du backend.
   */
  const handleChangeStatus = async (appt: ApiRendezVous, nextStatut: string) => {
    if (nextStatut === appt.statut || processingId === appt.id) return;

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
      <div className="flex min-h-[300px] items-center justify-center gap-2.5 text-sm text-text-subtle">
        <Loader2 size={16} className="animate-spin" />
        Chargement des rendez-vous...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-light bg-red-light/40 p-4 text-[13.5px] text-red">
        <AlertCircle size={16} strokeWidth={2} />
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xl font-bold text-text">Rendez-vous</div>
          <div className="mt-0.5 text-[13px] capitalize text-text-muted">{dateLabel}</div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-white p-1">
            <button
              onClick={() => changeDate(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-text"
            >
              <ChevronLeft size={16} strokeWidth={2.2} />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className={`rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                isToday ? "bg-primary-light text-primary-dark" : "text-text-muted hover:bg-surface"
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => changeDate(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-text"
            >
              <ChevronRight size={16} strokeWidth={2.2} />
            </button>
          </div>

          {/* Nouveau RDV à une heure exacte, indépendante de la grille de créneaux ci-dessous */}
          {onCreateAppointment && (
            <button
              onClick={() => onCreateAppointment(selectedDate, getCurrentTimeString())}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[13px] font-semibold text-white shadow-[0_3px_10px_rgba(14,165,165,0.35)] transition-colors hover:bg-primary-dark"
            >
              <Plus size={15} strokeWidth={2.5} />
              Nouveau RDV
            </button>
          )}
        </div>
      </div>

      {/* PLANNING */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        {slots.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-text-subtle">
            <CalendarX2 size={28} strokeWidth={1.5} />
            <div className="text-[13.5px]">Aucun créneau disponible pour cette date.</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-3">
            {slots.map((slot) => {
              if (slot.type === "appointment") {
                const { appt } = slot;
                const patientName = appt.patient
                  ? `${appt.patient.nom} ${appt.patient.prenom}`
                  : "Patient inconnu";
                const isProcessing = processingId === appt.id;
                const accent = STATUT_COLOR[appt.statut] ?? "#9CA3AF";

                return (
                  <div
                    key={`appt-${appt.id}`}
                    className="flex items-center gap-4 rounded-xl border border-border-soft bg-surface/40 p-3 pl-4 transition-all hover:border-border hover:bg-white hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)]"
                    style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
                  >
                    <div className="w-14 shrink-0 font-mono text-[13.5px] font-semibold text-text">
                      {appt.heure}
                    </div>

                    <Avatar name={patientName} size={32} />

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold text-text">{patientName}</div>
                      <div className="truncate text-xs text-text-subtle">{appt.motif || "Rendez-vous"}</div>
                    </div>

                    <ApptStatusBadge status={appt.statut} />

                    {/* Changer le statut — n'importe quelle valeur, pas seulement la suivante */}
                    <div className="relative shrink-0">
                      <select
                        value={appt.statut}
                        disabled={isProcessing}
                        onChange={(e) => handleChangeStatus(appt, e.target.value)}
                        className="h-8 cursor-pointer appearance-none rounded-lg border border-border bg-white py-0 pl-2.5 pr-7 text-[12px] font-semibold outline-none transition-colors hover:bg-surface disabled:cursor-wait disabled:opacity-60"
                        style={{ color: accent }}
                      >
                        {STATUTS.map((s) => (
                          <option
                            key={s.value}
                            value={s.value}
                            style={{ color: "#1F2937" }}
                          >
                            {s.label}
                            {s.value === appt.statut ? " (actuel)" : ""}
                          </option>
                        ))}
                      </select>
                      {isProcessing ? (
                        <Loader2
                          size={13}
                          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 animate-spin"
                          style={{ color: accent }}
                        />
                      ) : (
                        <ChevronDown
                          size={13}
                          strokeWidth={2.2}
                          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                          style={{ color: accent }}
                        />
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <ActionIconButton
                        title="Ouvrir le dossier"
                        onClick={() => onOpenPatient(appt.patientId)}
                        colorClass="text-primary hover:bg-primary-light"
                      >
                        <FolderOpen size={15} strokeWidth={2} />
                      </ActionIconButton>

                      <ActionIconButton
                        title="Supprimer"
                        onClick={() => handleDelete(appt)}
                        disabled={isProcessing}
                        colorClass="text-red hover:bg-red-light"
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </ActionIconButton>
                    </div>
                  </div>
                );
              }

              // Créneau disponible
              return (
                <button
                  key={`free-${slot.hour}`}
                  onClick={() => onCreateAppointment?.(selectedDate, slot.hour)}
                  disabled={!onCreateAppointment}
                  className={`group flex items-center gap-4 rounded-xl border border-dashed border-border p-3 pl-4 text-left transition-colors ${
                    onCreateAppointment ? "hover:border-primary hover:bg-primary-light/30" : "cursor-default"
                  }`}
                >
                  <div className="w-14 shrink-0 font-mono text-[13.5px] text-text-subtle">{slot.hour}</div>
                  <div className="flex items-center gap-1.5 text-[13px] italic text-text-subtle group-hover:text-primary-dark">
                    {onCreateAppointment && (
                      <Plus size={13} strokeWidth={2.5} className="opacity-0 transition-opacity group-hover:opacity-100" />
                    )}
                    Créneau disponible
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Bouton d'action icône (extrait pour éviter la répétition) ----

function ActionIconButton({
  children,
  onClick,
  disabled,
  title,
  colorClass,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  colorClass: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:cursor-wait disabled:opacity-60 ${colorClass}`}
    >
      {children}
    </button>
  );
}