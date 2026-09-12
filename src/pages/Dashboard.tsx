import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavSection } from "../types";

import { getPatients } from "../api/patients.api";
import { getConsultations, type ApiConsultation } from "../api/consultations.api";
import { getRendezVous } from "../api/rendezvous.api";
import { getPraticiens, type Praticien } from "../api/settings.api";

import { StatCard } from "../components/StatCard";
import { Avatar } from "../components/Avatar";
import { ApptStatusBadge } from "../components/ApptStatusBadge";
import {
  Users,
  AlertCircle,
  Wallet,
  CalendarCheck,
  CalendarX2,
  ArrowRight,
  Clock,
  Sparkles,
  ReceiptText,
  BadgeCheck,
  Stethoscope,
  CreditCard,
} from "lucide-react";

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

  const doctorGreeting = useMemo(() => {
    if (!praticien) return "Docteur";
    return praticien.specialite ? `Dr. ${praticien.nomComplet}` : praticien.nomComplet;
  }, [praticien]);

  const today = useMemo(() => {
    const date = new Date();
    return { year: date.getFullYear(), month: date.getMonth(), day: date.getDate() };
  }, []);

  const todayLabel = useMemo(() => {
    const date = new Date();
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, []);

  // Semaine en cours (7 jours), pour la mini-frise sous l'en-tête — repère visuel uniquement
  const weekStrip = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOffset = (now.getDay() + 6) % 7; // lundi = 0
    startOfWeek.setDate(now.getDate() - dayOffset);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return {
        key: date.toISOString(),
        dayLabel: date.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 1).toUpperCase(),
        dayNumber: date.getDate(),
        isToday:
          date.getFullYear() === today.year && date.getMonth() === today.month && date.getDate() === today.day,
      };
    });
  }, [today]);

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

  const confirmedAppointments = useMemo(() => {
    return todayAppointments.filter(
      (appointment) => appointment.status === "CONFIRME" || appointment.status === "CONFIRMED"
    ).length;
  }, [todayAppointments]);

  const pendingAppointments = todayAppointments.length - confirmedAppointments;

  const totalUnpaid = useMemo(() => {
    return consultations.reduce((total, consultation) => {
      const totalActes = consultation.actes.reduce((sum, acte) => sum + Number(acte.prix || 0), 0);
      const totalPaye = consultation.paiements.reduce((sum, paiement) => sum + Number(paiement.montant || 0), 0);
      return total + Math.max(totalActes - totalPaye, 0);
    }, 0);
  }, [consultations]);

  // Taux de recouvrement réel (total encaissé / total facturé), pour la barre de progression
  const collectionRate = useMemo(() => {
    let totalActesAll = 0;
    let totalPayeAll = 0;

    consultations.forEach((consultation) => {
      totalActesAll += consultation.actes.reduce((sum, acte) => sum + Number(acte.prix || 0), 0);
      totalPayeAll += consultation.paiements.reduce((sum, paiement) => sum + Number(paiement.montant || 0), 0);
    });

    return totalActesAll > 0 ? Math.round((totalPayeAll / totalActesAll) * 100) : 0;
  }, [consultations]);

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

  const activities = useMemo<ActivityItem[]>(() => {
    const items: { id: string; date: Date; text: string; type: "payment" | "consultation" }[] = [];

    consultations.forEach((consultation) => {
      const patient = consultation.patient;
      const patientName = patient ? `${patient.nom} ${patient.prenom}` : "Patient inconnu";

      consultation.paiements.forEach((paiement) => {
        items.push({
          id: `payment-${paiement.id}`,
          date: new Date(paiement.datePaiement),
          text: `${patientName} — Paiement ${Number(paiement.montant || 0).toLocaleString("fr-FR")} Ar reçu`,
          type: "payment",
        });
      });
    });

    consultations.forEach((consultation) => {
      const patient = consultation.patient;
      const patientName = patient ? `${patient.nom} ${patient.prenom}` : "Patient inconnu";

      items.push({
        id: `consultation-${consultation.id}`,
        date: new Date(consultation.dateConsultation),
        text: `${patientName} — Consultation ajoutée`,
        type: "consultation",
      });
    });

    return items
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 12)
      .map((item) => ({
        id: item.id,
        text: item.text,
        type: item.type,
        time: formatRelativeTime(item.date),
      }));
  }, [consultations]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-[110px] animate-pulse rounded-2xl bg-surface-2" />
        <div className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[140px] animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
        <div className="grid grid-cols-[1fr_320px] gap-4.5 max-[900px]:grid-cols-1">
          <div className="h-[320px] animate-pulse rounded-2xl bg-surface-2" />
          <div className="h-[320px] animate-pulse rounded-2xl bg-surface-2" />
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="rounded-xl border border-red-light bg-red-light/40 p-5 text-sm text-red">
        {error}
        <div>
          <button
            onClick={loadDashboard}
            className="mt-3 rounded-lg border border-red-light bg-white px-4 py-1.5 text-[13px] font-medium text-red transition-colors hover:bg-red-light"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // DASHBOARD — hauteur fixe, scroll interne aux panneaux seulement
  // ==========================================

  return (
    <div className="flex h-[calc(100vh-108px)] flex-col gap-5">
      {/* HEADER — bannière colorée + frise de la semaine */}
      <div className="relative shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-dark px-7 py-6 shadow-[0_10px_30px_-8px_rgba(14,165,165,0.5)]">
        <Sparkles size={130} strokeWidth={1} className="pointer-events-none absolute -right-6 -top-8 text-white/10" />
        <div className="relative flex items-center justify-between gap-6 max-[820px]:flex-col max-[820px]:items-stretch">
          <div>
            <div className="text-[22px] font-extrabold text-white">Bonjour, {doctorGreeting} 👋</div>
            <div className="mt-1.5 text-[13.5px] capitalize text-white/80">{todayLabel}</div>
          </div>

          <div className="flex items-center gap-5">
            {/* Frise des jours de la semaine */}
            <div className="flex items-center gap-1.5">
              {weekStrip.map((day) => (
                <div
                  key={day.key}
                  className={`flex h-11 w-9 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] transition-colors ${
                    day.isToday ? "bg-white text-primary-dark shadow-sm" : "text-white/70"
                  }`}
                >
                  <span className="font-medium">{day.dayLabel}</span>
                  <span className={day.isToday ? "text-[13px] font-bold" : "text-[13px] font-semibold"}>
                    {day.dayNumber}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 whitespace-nowrap rounded-full bg-white/15 px-4 py-2.5 text-white backdrop-blur-sm">
              <Clock size={16} strokeWidth={2} />
              <span className="text-[13px] font-semibold">{todayAppointments.length} RDV aujourd'hui</span>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid shrink-0 grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
        {/* Carte vedette — la métrique la plus actionnable du jour */}
        <StatCard
          featured
          label="RDV aujourd'hui"
          value={todayAppointments.length}
          unit="rendez-vous"
          icon={<CalendarCheck size={18} strokeWidth={2.2} />}
          progress={{
            percent: todayAppointments.length > 0
              ? Math.round((confirmedAppointments / todayAppointments.length) * 100)
              : 0,
            label: `${confirmedAppointments} confirmé${confirmedAppointments > 1 ? "s" : ""} sur ${todayAppointments.length}`,
          }}
        />

        <StatCard
          label="Total patients"
          value={patients.length}
          unit="patients"
          caption="Patients enregistrés"
          color="#0EA5A5"
          icon={<Users size={18} strokeWidth={2.2} />}
        />

        <StatCard
          label="Facturation"
          value={`${totalUnpaid.toLocaleString("fr-FR")} Ar`}
          unit="impayés"
          color="#EF4444"
          icon={<ReceiptText size={18} strokeWidth={2.2} />}
          progress={{
            percent: collectionRate,
            label: `${collectionRate}% du montant facturé encaissé`,
          }}
        />

        <StatCard
          label="Recettes du jour"
          value={`${todayRevenue.toLocaleString("fr-FR")} Ar`}
          caption={`${todayPaymentsCount} paiement${todayPaymentsCount > 1 ? "s" : ""} reçu${todayPaymentsCount > 1 ? "s" : ""}`}
          color="#10B981"
          icon={<Wallet size={18} strokeWidth={2.2} />}
        />
      </div>

      {/* CONTENT — occupe le reste de l'écran, scroll interne à chaque panneau */}
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_320px] gap-4.5 max-[900px]:grid-cols-1">
        {/* RENDEZ-VOUS DU JOUR */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="flex shrink-0 items-center justify-between border-b border-border-soft bg-surface/60 px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
                <CalendarCheck size={16} strokeWidth={2.2} />
              </div>
              <div className="text-[15px] font-bold text-text">Rendez-vous du jour</div>

              {todayAppointments.length > 0 && (
                <div className="ml-1 flex items-center gap-1.5">
                  <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10.5px] font-bold text-primary-dark">
                    {confirmedAppointments} confirmés
                  </span>
                  {pendingAppointments > 0 && (
                    <span className="rounded-full bg-amber-light px-2 py-0.5 text-[10.5px] font-bold text-amber">
                      {pendingAppointments} en attente
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => onNav("appointments")}
              className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-primary transition-colors hover:bg-primary-light"
            >
              Voir tout <ArrowRight size={13} strokeWidth={2.5} />
            </button>
          </div>

          {/* Scroll interne — jamais la page entière */}
          <div className="flex-1 overflow-y-auto p-3">
            {todayAppointments.length === 0 ? (
              <EmptyState text="Aucun rendez-vous aujourd'hui." />
            ) : (
              <div className="flex flex-col gap-2.5">
                {todayAppointments.map((appt) => {
                  const isConfirmed = appt.status === "CONFIRME" || appt.status === "CONFIRMED";
                  return (
                    <div
                      key={appt.id}
                      className="group flex items-center gap-3.5 rounded-xl border border-transparent bg-surface/60 p-3 pl-4 transition-all hover:translate-x-0.5 hover:border-border hover:bg-white hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)]"
                      style={{ borderLeftColor: isConfirmed ? "#0EA5A5" : "#F59E0B", borderLeftWidth: 3 }}
                    >
                      <div className="w-11 shrink-0 font-mono text-[13px] font-semibold text-text-muted">
                        {appt.time}
                      </div>

                      <Avatar name={appt.patientName} size={34} />

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-semibold text-text">{appt.patientName}</div>
                        <div className="mt-0.5 truncate text-xs text-text-subtle">{appt.reason}</div>
                      </div>

                      <div className="hidden text-[11.5px] text-text-subtle sm:block">{appt.duration} min</div>

                      <ApptStatusBadge status={appt.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ACTIVITÉ RÉCENTE — timeline */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="flex shrink-0 items-center gap-2 border-b border-border-soft bg-surface/60 px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-light text-green">
              <BadgeCheck size={16} strokeWidth={2.2} />
            </div>
            <div className="text-[15px] font-bold text-text">Activité récente</div>
          </div>

          {/* Scroll interne — jamais la page entière */}
          <div className="flex-1 overflow-y-auto p-4">
            {activities.length === 0 ? (
              <EmptyState text="Aucune activité récente." small />
            ) : (
              <div className="relative flex flex-col gap-4 pl-1">
                <div className="absolute bottom-2 left-[18px] top-2 w-px bg-border" />
                {activities.map((item) => (
                  <div key={item.id} className="relative flex items-start gap-3">
                    <div
                      className="relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white"
                      style={{
                        background: item.type === "payment" ? "#D1FAE5" : "#E0F5F5",
                        color: item.type === "payment" ? "#059669" : "#0EA5A5",
                      }}
                    >
                      {item.type === "payment" ? (
                        <CreditCard size={14} strokeWidth={2.2} />
                      ) : (
                        <Stethoscope size={14} strokeWidth={2.2} />
                      )}
                    </div>

                    <div className="flex-1 pt-1">
                      <div className="text-[12.5px] font-medium leading-relaxed text-text">{item.text}</div>
                      <div className="mt-0.5 text-[11px] text-text-subtle">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
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
    <div className={`flex flex-col items-center justify-center text-center text-text-subtle ${small ? "py-7" : "py-10"}`}>
      <CalendarX2 size={28} strokeWidth={1.5} className="mb-2" />
      <div className={small ? "text-[13px]" : "text-[13.5px]"}>{text}</div>
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