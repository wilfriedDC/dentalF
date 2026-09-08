import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import { getPraticiens, type Praticien } from "../api/settings.api";
interface TopBarProps {
  onNewPatient: () => void;
  onNewAppointment: () => void;
  searchValue: string;
  onSearch: (v: string) => void;
}
export function TopBar({
  onNewPatient,
  onNewAppointment,
  searchValue,
  onSearch,
}: TopBarProps) {
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
    <div style={{ height: 60, background: "#fff", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", padding: "0 28px", gap: 16, position: "fixed", left: 220, right: 0, top: 0, zIndex: 9 }}>
      <div style={{ flex: 1 }} />

      {/* Date */}
      <div style={{ fontSize: 13, color: "#6B7280", fontFamily: "'DM Mono', monospace" }}>
        {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
      </div>

      <button
  onClick={onNewAppointment}
  style={{
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 14px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#374151",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  }}
>
  Nouveau rendez-vous
</button>

      

      {/* Nouveau patient */}
      <button
        onClick={onNewPatient}
        style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", background: "#0EA5A5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13.5, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
        onMouseEnter={e => (e.currentTarget.style.background = "#0C8F8F")}
        onMouseLeave={e => (e.currentTarget.style.background = "#0EA5A5")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nouveau patient
      </button>

      {/* Profile */}
      <Avatar name={doctorName} size={34} />
    </div>
  );
}