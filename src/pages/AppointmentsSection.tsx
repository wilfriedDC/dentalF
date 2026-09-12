import { useEffect, useState } from "react";

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
  ArrowRightCircle,
  Trash2,
  Plus,
  CalendarX2,
  AlertCircle,
  Loader2,
  Clock,
} from "lucide-react";

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

// Progression des statuts : cliquer sur le bouton "avancer" fait passer au statut suivant.
// ⚠️ Ajuste ces clés/valeurs pour qu'elles correspondent EXACTEMENT aux statuts
// utilisés par ton backend (ex: table rendez_vous, colonne "statut").
const STATUT_SUIVANT: Record<string, string> = {
  planifie: "confirme",
  confirme: "termine",
};

// Couleur d'accent par statut, pour la barre latérale de chaque ligne
const STATUT_COLOR: Record<string, string> = {
  planifie: "#F59E0B",
  confirme: "#0EA5A5",
  termine: "#10B981",
  annule: "#EF4444",
};

// Tous les statuts possibles, pour le sélecteur manuel (permet aussi de choisir "annulé")
const STATUT_OPTIONS: { value: string; label: string }[] = [
  { value: "planifie", label: "Planifié" },
  { value: "confirme", label: "Confirmé" },
  { value: "termine", label: "Terminé" },
  { value: "annule", label: "Annulé" },
];

// Valide un format d'heure "HH:MM" (00:00 à 23:59)
const HEURE_REGEX = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

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
   * Change librement le statut d'un rendez-vous (via le menu déroulant).
   * Contrairement à handleAdvanceStatus, permet n'importe quelle transition,
   * y compris "annulé".
   */
  const handleChangeStatus = async (appt: ApiRendezVous, newStatut: string) => {
    if (newStatut === appt.statut || processingId === appt.id) return;

    setProcessingId(appt.id);
    try {
      await updateRendezVous(appt.id, { statut: newStatut });
      setAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? { ...a, statut: newStatut } : a))
      );
    } catch (err) {
      console.error("Erreur changement de statut :", err);
      setError("Impossible de changer le statut.");
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * Modifie l'heure exacte d'un rendez-vous (ex: 09:15 au lieu du créneau rond 09:00).
   */
  const handleEditHeure = async (appt: ApiRendezVous) => {
    if (processingId === appt.id) return;

    const input = window.prompt(
      `Nouvelle heure pour ce rendez-vous (format HH:MM) :`,
      appt.heure.slice(0, 5)
    );
    if (input === null) return; // annulé par l'utilisateur

    const trimmed = input.trim();
    if (!HEURE_REGEX.test(trimmed)) {
      window.alert("Format d'heure invalide. Utilisez le format HH:MM, par exemple 09:15.");
      return;
    }

    setProcessingId(appt.id);
    try {
      await updateRendezVous(appt.id, { heure: trimmed });
      setAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? { ...a, heure: trimmed } : a))
      );
    } catch (err) {
      console.error("Erreur modification de l'heure :", err);
      setError("Impossible de modifier l'heure du rendez-vous.");
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
                const nextStatut = STATUT_SUIVANT[appt.statut];
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

                    {/* Statut : menu déroulant pour un changement libre (inclut "Annulé") */}
                    <select
                      value={appt.statut}
                      disabled={isProcessing}
                      onChange={(e) => handleChangeStatus(appt, e.target.value)}
                      title="Changer le statut"
                      className="shrink-0 cursor-pointer rounded-full border-none bg-transparent px-0 py-0 text-[11.5px] font-semibold outline-none disabled:cursor-wait"
                      style={{ color: accent }}
                    >
                      {STATUT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <ActionIconButton
                        title="Modifier l'heure"
                        onClick={() => handleEditHeure(appt)}
                        disabled={isProcessing}
                        colorClass="text-text-muted hover:bg-surface-2 hover:text-text"
                      >
                        <Clock size={15} strokeWidth={2} />
                      </ActionIconButton>

                      <ActionIconButton
                        title="Ouvrir le dossier"
                        onClick={() => onOpenPatient(appt.patientId)}
                        colorClass="text-primary hover:bg-primary-light"
                      >
                        <FolderOpen size={15} strokeWidth={2} />
                      </ActionIconButton>

                      {nextStatut && (
                        <ActionIconButton
                          title={`Faire passer à "${nextStatut}"`}
                          onClick={() => handleAdvanceStatus(appt)}
                          disabled={isProcessing}
                          colorClass="text-green hover:bg-green-light"
                        >
                          {isProcessing ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <ArrowRightCircle size={15} strokeWidth={2} />
                          )}
                        </ActionIconButton>
                      )}

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

              // Créneau disponible — l'heure est déjà connue (slot.hour), donc le bouton
              // "Nouveau rendez-vous" crée directement le RDV sur ce créneau sans ressaisie.
              return (
                <div
                  key={`free-${slot.hour}`}
                  className="flex items-center gap-4 rounded-xl border border-dashed border-border p-3 pl-4 transition-colors hover:border-primary hover:bg-primary-light/20"
                >
                  <div className="w-14 shrink-0 font-mono text-[13.5px] text-text-subtle">{slot.hour}</div>
                  <div className="flex-1 text-[13px] italic text-text-subtle">Créneau disponible</div>

                  <button
                    onClick={() => onCreateAppointment?.(selectedDate, slot.hour)}
                    disabled={!onCreateAppointment}
                    title={`Créer un rendez-vous à ${slot.hour}`}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                      onCreateAppointment
                        ? "bg-primary text-white hover:bg-primary-dark"
                        : "cursor-not-allowed bg-surface-2 text-text-subtle"
                    }`}
                  >
                    <Plus size={13} strokeWidth={2.5} />
                    Nouveau rendez-vous
                  </button>
                </div>
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