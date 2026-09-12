import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  CreditCard,
  Settings,
  Smile,
} from "lucide-react";

import type { NavSection } from "../types";
import { Avatar } from "./Avatar";
import { getPraticiens, type Praticien } from "../api/settings.api";

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} strokeWidth={2} /> },
  { id: "patients", label: "Patients", icon: <Users size={18} strokeWidth={2} /> },
  { id: "appointments", label: "Rendez-vous", icon: <CalendarDays size={18} strokeWidth={2} /> },
  { id: "billing", label: "Facturation", icon: <FileText size={18} strokeWidth={2} /> },
  { id: "payments", label: "Paiements", icon: <CreditCard size={18} strokeWidth={2} /> },
];

export function Sidebar({ active, onNav }: { active: NavSection; onNav: (s: NavSection) => void }) {
  const [praticien, setPraticien] = useState<Praticien | null>(null);

  useEffect(() => {
    const loadPraticien = async () => {
      try {
        const praticiens = await getPraticiens();
        // Pas de notion de "praticien connecté" dans le modèle actuel :
        // on affiche le premier praticien du cabinet.
        setPraticien(praticiens[0] ?? null);
      } catch (err) {
        console.error("Erreur chargement praticien :", err);
      }
    };

    loadPraticien();
  }, []);

  const praticienName = praticien ? `Dr. ${praticien.nomComplet}` : "...";

  return (
    <div className="fixed left-0 top-0 z-10 flex h-screen w-[220px] shrink-0 flex-col bg-gradient-to-b from-primary via-primary to-primary-dark shadow-[4px_0_24px_rgba(12,143,143,0.25)]">
      {/* Logo */}
      <div className="border-b border-white/15 px-5 pb-5 pt-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
            <Smile size={19} strokeWidth={2.5} className="text-primary" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight text-white">DentaFlow</div>
            <div className="text-[11px] font-medium text-white/70">Cabinet dentaire</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] transition-all duration-150 ${
                isActive
                  ? "bg-white text-primary-dark font-semibold shadow-[0_4px_14px_rgba(0,0,0,0.15)]"
                  : "font-medium text-white/80 hover:bg-white/15 hover:text-white"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                  isActive ? "bg-primary-light text-primary" : "text-white/80 group-hover:text-white"
                }`}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Settings + Profile at bottom */}
      <div className="border-t border-white/15 p-3">
        <button
          onClick={() => onNav("settings")}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] transition-all duration-150 ${
            active === "settings"
              ? "bg-white text-primary-dark font-semibold shadow-[0_4px_14px_rgba(0,0,0,0.15)]"
              : "font-medium text-white/80 hover:bg-white/15 hover:text-white"
          }`}
        >
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
              active === "settings" ? "bg-primary-light text-primary" : "text-white/80"
            }`}
          >
            <Settings size={18} strokeWidth={2} />
          </span>
          Paramètres
        </button>
        <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2.5">
          <Avatar name={praticienName} size={30} bg="#ffffff" color="#0C8F8F" />
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-semibold text-white">{praticienName}</div>
            <div className="truncate text-[11px] text-white/70">{praticien?.specialite ?? "Dentiste"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}