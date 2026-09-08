import { useState } from "react";
import type { CreatePatientPayload } from "../../api/patients.api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
  border: "1px solid #D1D5DB",
  borderRadius: 8,
  outline: "none",
  color: "#1F2937",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
};

export function NewPatientForm({
  onBack,
  onSave,
}: {
  onBack: () => void;
  onSave: (payload: CreatePatientPayload) => Promise<void>;
}) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [sexe, setSexe] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [adresse, setAdresse] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const emailValid = email === "" || EMAIL_RE.test(email);
  const canSave = nom.trim() && prenom.trim() && telephone.trim() && emailValid;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    setError("");
    try {
      await onSave({
        nom: nom.trim(),
        prenom: prenom.trim(),
        sexe: sexe || null,
        telephone: telephone.trim(),
        email: email.trim() || null,
        dateNaissance: dateNaissance || null,
        adresse: adresse.trim() || null,
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la création du patient. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", maxWidth: 640 }}>
      <div style={{ padding: "18px 24px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onBack}
          style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", color: "#374151", cursor: "pointer" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>Nouveau patient</div>
          <div style={{ fontSize: 12.5, color: "#6B7280" }}>Créer une fiche patient</div>
        </div>
      </div>

      <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Prénom *</label>
            <input style={inputStyle} value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Prenom" />
          </div>
          <div>
            <label style={labelStyle}>Nom *</label>
            <input style={inputStyle} value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Téléphone *</label>
            <input style={inputStyle} value={telephone} onChange={e => setTelephone(e.target.value)} placeholder=" Numero" />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              style={{ ...inputStyle, ...(!emailValid ? { borderColor: "#EF4444" } : {}) }}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="patient@email.com"
            />
            {!emailValid && <div style={{ fontSize: 11.5, color: "#EF4444", marginTop: 5 }}>Format d'email invalide</div>}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Date de naissance</label>
            <input type="date" style={inputStyle} value={dateNaissance} onChange={e => setDateNaissance(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Sexe</label>
            <select
              style={inputStyle}
              value={sexe}
              onChange={e => setSexe(e.target.value)}
            >
              <option value="">—</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Adresse</label>
          <input style={inputStyle} value={adresse} onChange={e => setAdresse(e.target.value)} placeholder=" adresse" />
        </div>

        {error && <div style={{ fontSize: 12.5, color: "#EF4444" }}>{error}</div>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
          <button
            onClick={onBack}
            style={{ padding: "10px 18px", fontSize: 14, fontWeight: 600, border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", color: "#374151", cursor: "pointer" }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving || saved}
            style={{
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              borderRadius: 8,
              color: "#fff",
              cursor: !canSave || saving || saved ? "default" : "pointer",
              background: saved ? "#10B981" : (!canSave || saving ? "#9CA3AF" : "#0EA5A5"),
            }}
          >
            {saved ? "✓ Patient créé !" : saving ? "Création…" : "Créer la fiche patient"}
          </button>
        </div>
      </div>
    </div>
  );
}