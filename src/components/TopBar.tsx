import { Avatar } from "./Avatar";



export function TopBar({ onNewPatient, searchValue, onSearch }: { onNewPatient: () => void; searchValue: string; onSearch: (v: string) => void }) {
  return (
    <div style={{ height: 60, background: "#fff", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", padding: "0 28px", gap: 16, position: "fixed", left: 220, right: 0, top: 0, zIndex: 9 }}>
      {/* Search 
      <div style={{ flex: 1, maxWidth: 480, position: "relative" }}>
        <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          type="text"
          placeholder="Rechercher un patient par nom ou téléphone…"
          value={searchValue}
          onChange={e => onSearch(e.target.value)}
          style={{ width: "100%", padding: "9px 14px 9px 38px", border: "1.5px solid #E5E7EB", borderRadius: 9, fontSize: 13.5, fontFamily: "'Inter', sans-serif", color: "#1F2937", background: "#F8F9FA", outline: "none", transition: "border-color 0.15s" }}
          onFocus={e => (e.target.style.borderColor = "#0EA5A5")}
          onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
        />
      </div>
      */}

      <div style={{ flex: 1 }} />

      {/* Date */}
      <div style={{ fontSize: 13, color: "#6B7280", fontFamily: "'DM Mono', monospace" }}>
        {new Date("2026-08-03").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
      </div>

      {/* nouveau Patient */}
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
      <Avatar name="Dr. Amina Karim" size={34} bg="#0EA5A5" color="#fff" />
    </div>
  );
}
