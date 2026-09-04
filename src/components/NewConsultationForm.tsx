import { useState } from "react";
import type { Patient } from "../types";
import { ACTES_OPTIONS, DENT_OPTIONS } from "../data/mockData";



export function NewConsultationForm({ patient, onBack }: { patient: Patient; onBack: () => void }) {
  const [motif, setMotif] = useState("");
  const [ndent, setNdent] = useState("");
  const [acte, setActe] = useState("");
  const [prix, setPrix] = useState("");
  const [avance, setAvance] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [date, setDate] = useState();
  const [time, setTime] = useState();
  const total = Number(prix) || 0;
  const advance = Number(avance) || 0;
  const reste = Math.max(0, total - advance);

  function handleSave() {
    setSaved(true);
    setTimeout(onBack, 1200);
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ padding: "18px 24px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", display: "flex" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>Nouvelle consultation</div>
          <div style={{ fontSize: 12.5, color: "#6B7280" }}>{patient.name} — {new Date("2025-07-29").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</div>
        </div>
      </div>

      <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>Motif de consultation *</span>
            <input
              value={motif}
              onChange={e => setMotif(e.target.value)}
              placeholder="Ex: Douleur molaire, Contrôle…"
              style={{ padding: "9px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13.5, fontFamily: "'Inter', sans-serif", outline: "none" }}
              onFocus={e => (e.target.style.borderColor = "#0EA5A5")}
              onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>Acte réalisé *</span>
            <select
              value={acte}
              onChange={e => setActe(e.target.value)}
              style={{ padding: "9px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13.5, fontFamily: "'Inter', sans-serif", outline: "none", background: "#fff", color: acte ? "#1F2937" : "#9CA3AF", appearance: "auto" }}
              onFocus={e => (e.target.style.borderColor = "#0EA5A5")}
              onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
            >
              <option value="">Sélectionner un acte…</option>
              {ACTES_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>Numero Dent *</span>
            <select
              value={ndent}
              onChange={e => setNdent(e.target.value)}
              style={{ width:"150px", padding: "9px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13.5, fontFamily: "'Inter', sans-serif", outline: "none", background: "#fff", color: acte ? "#1F2937" : "#9CA3AF", appearance: "auto" }}
              onFocus={e => (e.target.style.borderColor = "#0EA5A5")}
              onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
            >
              <option value="">Sélectionner…</option>
              {DENT_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#374151"  }}>Prochaine rendez-vous *</span>
            <div style={{ display: "flex", flexDirection: "row", gap: 6 }}>
              <input
             type="time"
             value={time}
             onChange={e => setTime(e.target.value)}
             style={{ padding: "9px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13.5, fontFamily: "'Inter', sans-serif", outline: "none" }}
             onFocus={e => (e.target.style.borderColor = "#0EA5A5")}
             onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
             />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            
              style={{ padding: "9px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13.5, fontFamily: "'Inter', sans-serif", outline: "none" }}
              onFocus={e => (e.target.style.borderColor = "#0EA5A5")}
              onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
            />

            </div>
            
          </label>

          
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>Prix total (Ar)</span>
            <input
              type="number"
              value={prix}
              onChange={e => setPrix(e.target.value)}
              placeholder="0"
              style={{ padding: "9px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13.5, fontFamily: "'DM Mono', monospace", outline: "none" }}
              onFocus={e => (e.target.style.borderColor = "#0EA5A5")}
              onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>Avance reçue (Ar)</span>
            <input
              type="number"
              value={avance}
              onChange={e => setAvance(e.target.value)}
              placeholder="0"
              style={{ padding: "9px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13.5, fontFamily: "'DM Mono', monospace", outline: "none" }}
              onFocus={e => (e.target.style.borderColor = "#0EA5A5")}
              onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
            />
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>Reste à payer</span>
            <div style={{ padding: "9px 12px", border: "1.5px solid #F3F4F6", borderRadius: 8, fontSize: 13.5, fontFamily: "'DM Mono', monospace", background: "#F8F9FA", color: reste > 0 ? "#EF4444" : "#10B981", fontWeight: 600 }}>
              {reste} Ar
            </div>
          </div>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>Notes cliniques</span>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Observations, recommandations, prescriptions…"
            rows={3}
            style={{ padding: "9px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13.5, fontFamily: "'Inter', sans-serif", outline: "none", resize: "vertical" }}
            onFocus={e => (e.target.style.borderColor = "#0EA5A5")}
            onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
          />
        </label>

        {/* Summary */}
        {total > 0 && (
          <div style={{ background: "#F0FDFA", border: "1px solid #CCFBF1", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 24 }}>
              <div><div style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>Total</div><div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: "#1F2937" }}>{total} €</div></div>
              <div><div style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>Avance</div><div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: "#10B981" }}>{advance} €</div></div>
              <div><div style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>Reste</div><div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: reste > 0 ? "#EF4444" : "#10B981" }}>{reste} €</div></div>
            </div>
            <div style={{ fontSize: 12, color: "#0EA5A5" }}>
              {reste === 0 ? "✓ Entièrement payé" : reste < total ? "⚡ Paiement partiel" : "⏳ En attente de paiement"}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
          <button onClick={onBack} style={{ padding: "9px 18px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", fontSize: 13.5, color: "#6B7280", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!motif || !acte || saved}
            style={{ padding: "9px 20px", border: "none", borderRadius: 8, background: saved ? "#10B981" : (!motif || !acte ? "#9CA3AF" : "#0EA5A5"), color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: !motif || !acte ? "not-allowed" : "pointer", fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", gap: 6 }}
          >
            {saved ? "✓ Enregistré!" : "Enregistrer & Générer facture"}
          </button>
        </div>
      </div>
    </div>
  );
}
