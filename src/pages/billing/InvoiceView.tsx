import type { Consultation, Patient } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate } from "../../utils/formatDate";

export function InvoiceView({ consultation, patient, onBack }: { consultation: Consultation; patient: Patient; onBack: () => void }) {
  const reste = consultation.prix - consultation.paid;
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", fontSize: 13.5, display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Retour
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <StatusBadge status={consultation.status} />
          <button style={{ padding: "7px 14px", background: "#0EA5A5", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exporter PDF
          </button>
        </div>
      </div>

      <div style={{ padding: "32px 36px" }}>
        {/* Clinic header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 28, height: 28, background: "#0EA5A5", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 12h8M12 8v8"/></svg>
              </div>
              <span style={{ fontSize: 17, fontWeight: 700, color: "#1F2937" }}>Cabinet Dr. Tsihory</span>
            </div>
            <div style={{ fontSize: 12.5, color: "#6B7280", lineHeight: 1.7 }}>
              Ambohipo<br />
              Tél: 034 00 000 00<br />
              dr.tsihory@gmail.com
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#1F2937" }}>FACTURE</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12.5, color: "#9CA3AF", marginTop: 4 }}>N° FC-2025-{consultation.id.toUpperCase()}</div>
            <div style={{ fontSize: 12.5, color: "#6B7280", marginTop: 4 }}>{formatDate(consultation.date)}</div>
          </div>
        </div>

        {/* Patient */}
        <div style={{ background: "#F8F9FA", borderRadius: 8, padding: "14px 16px", marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Patient</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1F2937" }}>{patient.name}</div>
          <div style={{ fontSize: 12.5, color: "#6B7280" }}>{patient.phone} · {patient.address}</div>
        </div>

        {/* Items */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
          <thead>
            <tr style={{ background: "#F8F9FA" }}>
              {["Description", "Motif", "Montant"].map(h => (
                <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
              <td style={{ padding: "12px 12px", fontSize: 13.5, color: "#1F2937", fontWeight: 500 }}>{consultation.acte}</td>
              <td style={{ padding: "12px 12px", fontSize: 13, color: "#6B7280" }}>{consultation.motif}</td>
              <td style={{ padding: "12px 12px", fontSize: 13.5, fontFamily: "'DM Mono', monospace", color: "#1F2937", textAlign: "right" }}>{consultation.prix} Ar</td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 32, fontSize: 13, color: "#6B7280" }}>
            <span>Total</span>
            <span style={{ fontFamily: "'DM Mono', monospace", width: 80, textAlign: "right" }}>{consultation.prix} Ar</span>
          </div>
          <div style={{ display: "flex", gap: 32, fontSize: 13, color: "#6B7280" }}>
            <span>Avance reçue</span>
            <span style={{ fontFamily: "'DM Mono', monospace", width: 80, textAlign: "right", color: "#10B981" }}>− {consultation.paid} Ar</span>
          </div>
          <div style={{ display: "flex", gap: 32, fontSize: 15, fontWeight: 700, color: reste > 0 ? "#EF4444" : "#10B981", marginTop: 6, paddingTop: 10, borderTop: "2px solid #F3F4F6", width: 200 }}>
            <span>Reste à payer</span>
            <span style={{ fontFamily: "'DM Mono', monospace", width: 80, textAlign: "right" }}>{reste} Ar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
