import { useState } from "react";
import type { Consultation } from "../../types";
import { PATIENTS, CONSULTATIONS } from "../../data/mockData";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate } from "../../utils/formatDate";
import { InvoiceView } from "./InvoiceView";

export function BillingSection() {
  const [selected, setSelected] = useState<Consultation | null>(null);

  if (selected) {
    const patient = PATIENTS.find(p => p.id === selected.patientId)!;
    return <InvoiceView consultation={selected} patient={patient} onBack={() => setSelected(null)} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#1F2937" }}>Facturation</div>

      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 180px 90px 100px 80px", padding: "12px 20px", background: "#F8F9FA", borderBottom: "1px solid #F3F4F6" }}>
          {["Date", "Patient — Acte", "Montant / Payé", "Reste", "Statut", ""].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
          ))}
        </div>
        {CONSULTATIONS.map((c, i) => {
          const patient = PATIENTS.find(p => p.id === c.patientId)!;
          const reste = c.prix - c.paid;
          return (
            <div key={c.id} style={{ display: "grid", gridTemplateColumns: "120px 1fr 180px 90px 100px 80px", padding: "13px 20px", borderBottom: i < CONSULTATIONS.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12.5, color: "#9CA3AF" }}>{formatDate(c.date)}</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: "#1F2937" }}>{patient.name}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>{c.acte}</div>
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontFamily: "'DM Mono', monospace", color: "#1F2937" }}>{c.prix} Ar</div>
                <div style={{ fontSize: 11.5, color: "#10B981" }}>Payé: {c.paid} Ar</div>
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13.5, fontWeight: 600, color: reste > 0 ? "#EF4444" : "#10B981" }}>{reste} Ar</div>
              <div><StatusBadge status={c.status} /></div>
              <button onClick={() => setSelected(c)} style={{ padding: "5px 12px", border: "1px solid #E5E7EB", borderRadius: 7, background: "#fff", fontSize: 12, color: "#0EA5A5", cursor: "pointer", fontWeight: 500 }}>Voir</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
