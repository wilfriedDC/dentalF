import { useEffect, useState } from "react";

import type { NavSection } from "../types";
import { Avatar } from "./Avatar";
import { getPraticiens, type Praticien } from "../api/settings.api";

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { id: "patients", label: "Patients", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id: "appointments", label: "Rendez-vous", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { id: "billing", label: "Facturation", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
  { id: "payments", label: "Paiements", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
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
    <div style={{ width: 220, flexShrink: 0, background: "#fff", borderRight: "1px solid #E5E7EB", display: "flex", flexDirection: "column", height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 10 }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "#0EA5A5", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              <path d="M8 12h8M12 8v8" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1F2937", lineHeight: 1.2 }}>DentaFlow</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 400 }}>Cabinet dentaire</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer", width: "100%", textAlign: "left", background: isActive ? "#E0F5F5" : "transparent", color: isActive ? "#0EA5A5" : "#6B7280", fontFamily: "'Inter', sans-serif", fontWeight: isActive ? 600 : 400, fontSize: 13.5, transition: "all 0.15s" }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "#F9FAFB"; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Settings + Profile at bottom */}
      <div style={{ padding: "10px", borderTop: "1px solid #F3F4F6" }}>
        <button
          onClick={() => onNav("settings")}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer", width: "100%", textAlign: "left", background: active === "settings" ? "#E0F5F5" : "transparent", color: active === "settings" ? "#0EA5A5" : "#6B7280", fontFamily: "'Inter', sans-serif", fontWeight: active === "settings" ? 600 : 400, fontSize: 13.5 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 19.07l-1.41 1.41M19.07 19.07l-1.41-1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
          Paramètres
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginTop: 4 }}>
          <Avatar name={praticienName} size={30} bg="#0EA5A5" color="#fff" />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1F2937" }}>{praticienName}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>{praticien?.specialite ?? "Dentiste"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}