import { useEffect, useState } from "react";
import { Plus, CalendarPlus } from "lucide-react";
import { Avatar } from "./Avatar";
import { getPraticiens, type Praticien } from "../api/settings.api";

interface TopBarProps {
  onNewPatient: () => void;
  onNewAppointment: () => void;
  searchValue: string;
  onSearch: (v: string) => void;
}

export function TopBar({ onNewPatient, onNewAppointment }: TopBarProps) {
  const [praticien, setPraticien] = useState<Praticien | null>(null);

  useEffect(() => {
    const loadPraticien = async () => {
      try {
        const data = await getPraticiens();
        setPraticien(data[0] ?? null);
      } catch (err) {
        console.error("Erreur chargement praticien (TopBar) :", err);
      }
    };

    loadPraticien();
  }, []);

  const doctorName = praticien
    ? praticien.specialite
      ? `Dr. ${praticien.nomComplet}`
      : praticien.nomComplet
    : undefined;

  return (
    <div className="fixed left-[220px] right-0 top-0 z-[9] flex h-[60px] items-center gap-4 border-b border-border bg-surface px-7">
      <div className="flex-1" />

      {/* Date */}
      <div className="font-mono text-[13px] text-text-muted">
        {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
      </div>

      {/* Nouveau rendez-vous */}
      <button
        onClick={onNewAppointment}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[13px] font-medium text-text hover:bg-surface-2"
      >
        <CalendarPlus size={16} strokeWidth={2} />
        Nouveau rendez-vous
      </button>

      {/* Nouveau patient */}
      <button
        onClick={onNewPatient}
        className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13.5px] font-semibold text-white transition-colors hover:bg-primary-dark"
      >
        <Plus size={14} strokeWidth={2.5} />
        Nouveau patient
      </button>

      {/* Profile */}
      <Avatar name={doctorName} size={34} />
    </div>
  );
}