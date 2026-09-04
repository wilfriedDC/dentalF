import type { NavSection } from "../types";
import { PATIENTS, CONSULTATIONS, TODAY_APPOINTMENTS, PAYMENT_TRANSACTIONS } from "../data/mockData";
import { StatCard } from "../components/StatCard";
import { Avatar } from "../components/Avatar";
import { ApptStatusBadge } from "../components/ApptStatusBadge";

export function Dashboard({ onNav }: { onNav: (s: NavSection) => void }) {
  const totalUnpaid = CONSULTATIONS.filter(c => c.status !== "Paid").reduce((acc, c) => acc + (c.prix - c.paid), 0);
  const todayRevenue = PAYMENT_TRANSACTIONS.filter(t => t.date === "2025-07-24").reduce((acc, t) => acc + t.amount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#1F2937" }}>Bonjour, Dr. Tsihory</div>
        <div style={{ fontSize: 13.5, color: "#6B7280", marginTop: 3 }}>Lundi 03 juillet 2026 — {TODAY_APPOINTMENTS.length} rendez-vous aujourd'hui</div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid",  gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <StatCard label="Total patients" value={PATIENTS.length} sub="+2 ce mois-ci"  color="#0EA5A5" 
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>}
        />
        <StatCard label="Factures impayées" value={`${totalUnpaid} Ar`} sub="0 patients concernés" color="#EF4444"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        />
        <StatCard label="Recettes du jour" value={`${todayRevenue} Ar`} sub="0 paiements reçus" color="#10B981"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <StatCard label="RDV aujourd'hui" value={TODAY_APPOINTMENTS.length} sub={`${TODAY_APPOINTMENTS.filter(a => a.status === "Confirmed").length} confirmés`} color="#F59E0B"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18 }}>
        {/* Today's Appointments */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1F2937" }}>Rendez-vous du jour</div>
            <button onClick={() => onNav("appointments")} style={{ fontSize: 12.5, color: "#0EA5A5", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>Voir tout →</button>
          </div>
          <div>
            {TODAY_APPOINTMENTS.map((appt, i) => (
              <div key={appt.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 22px", borderBottom: i < TODAY_APPOINTMENTS.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#6B7280", width: 44, flexShrink: 0 }}>{appt.time}</div>
                <div style={{ width: 3, height: 36, borderRadius: 2, background: appt.status === "Confirmed" ? "#0EA5A5" : "#F59E0B", flexShrink: 0 }} />
                <Avatar name={appt.patientName} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: "#1F2937" }}>{appt.patientName}</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.reason}</div>
                </div>
                <div style={{ fontSize: 11.5, color: "#9CA3AF" }}>{appt.duration} min</div>
                <ApptStatusBadge status={appt.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1F2937" }}>Activité récente</div>
          </div>
          <div style={{ padding: "8px 0" }}>
            {[
              { icon: "SM", text: "Sophie Martin — Paiement 80000 Ar reçu", time: "il y a 1 j", color: "#D1FAE5" },
              { icon: "LB", text: "Lucas Bernard — Consultation ajoutée", time: "il y a 2 j", color: "#E0F5F5" },
             
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "10px 20px" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: item.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.4 }}>{item.text}</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
