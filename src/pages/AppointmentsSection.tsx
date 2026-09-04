import { TODAY_APPOINTMENTS } from "../data/mockData";
import { Avatar } from "../components/Avatar";
import { ApptStatusBadge } from "../components/ApptStatusBadge";

export function AppointmentsSection() {
  const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1F2937" }}>Rendez-vous</div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>Mardi 29 juillet 2025</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ padding: "7px 14px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", fontSize: 13, color: "#6B7280", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>‹ Hier</button>
          <button style={{ padding: "7px 14px", border: "1px solid #0EA5A5", borderRadius: 8, background: "#E0F5F5", fontSize: 13, color: "#0EA5A5", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Aujourd'hui</button>
          <button style={{ padding: "7px 14px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", fontSize: 13, color: "#6B7280", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Demain ›</button>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {/* Header row */}
        <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 120px 80px 120px", gap: 0, padding: "12px 20px", borderBottom: "1px solid #F3F4F6", background: "#F8F9FA" }}>
          {["Heure", "Patient — Motif", "Durée", "Statut", "Actions"].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
          ))}
        </div>

        {TODAY_APPOINTMENTS.map((appt, i) => (
          <div key={appt.id} style={{ display: "grid", gridTemplateColumns: "70px 1fr 120px 80px 120px", gap: 0, padding: "14px 20px", borderBottom: i < TODAY_APPOINTMENTS.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13.5, color: "#1F2937", fontWeight: 500 }}>{appt.time}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name={appt.patientName} size={30} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: "#1F2937" }}>{appt.patientName}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>{appt.reason}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#6B7280" }}>{appt.duration} min</div>
            <div><ApptStatusBadge status={appt.status} /></div>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={{ padding: "5px 10px", border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", fontSize: 12, color: "#0EA5A5", cursor: "pointer", fontWeight: 500 }}>Ouvrir</button>
            </div>
          </div>
        ))}

        {/* Empty slots */}
        {hours.filter(h => !TODAY_APPOINTMENTS.some(a => a.time.startsWith(h.split(":")[0]))).slice(0, 3).map(h => (
          <div key={h} style={{ display: "grid", gridTemplateColumns: "70px 1fr 120px 80px 120px", padding: "12px 20px", borderTop: "1px solid #F9FAFB", alignItems: "center" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13.5, color: "#D1D5DB" }}>{h}</div>
            <div style={{ fontSize: 13, color: "#E5E7EB", fontStyle: "italic" }}>— disponible —</div>
          </div>
        ))}
      </div>
    </div>
  );
}
