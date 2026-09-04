import { useEffect, useState } from "react";
import {
  getCabinet,
  updateCabinet,
  getPraticiens,
  updatePraticien,
  type Cabinet,
  type Praticien,
} from "../api/settings.api";

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

const buttonStyle = (disabled: boolean): React.CSSProperties => ({
  alignSelf: "flex-start",
  padding: "9px 18px",
  fontSize: 13.5,
  fontWeight: 600,
  border: "none",
  borderRadius: 8,
  color: "#fff",
  cursor: disabled ? "default" : "pointer",
  background: disabled ? "#9CA3AF" : "#0EA5A5",
});

type Toast = { type: "success" | "error"; text: string } | null;

export function SettingsSection() {
  const [cabinet, setCabinet] = useState<Cabinet | null>(null);
  const [praticien, setPraticien] = useState<Praticien | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingCabinet, setSavingCabinet] = useState(false);
  const [savingPraticien, setSavingPraticien] = useState(false);
  const [cabinetMessage, setCabinetMessage] = useState<Toast>(null);
  const [praticienMessage, setPraticienMessage] = useState<Toast>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const [cabinetData, praticiens] = await Promise.all([
          getCabinet(),
          getPraticiens(),
        ]);
        setCabinet(cabinetData);
        setPraticien(praticiens.length > 0 ? praticiens[0] : null);
      } catch (error) {
        console.error("Erreur chargement paramètres", error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  function showToast(setter: (t: Toast) => void, toast: Toast) {
    setter(toast);
    if (toast) setTimeout(() => setter(null), 3000);
  }

  async function handleSaveCabinet() {
    if (!cabinet) return;
    try {
      setSavingCabinet(true);
      const updated = await updateCabinet({
        nom: cabinet.nom,
        adresse: cabinet.adresse,
        telephone: cabinet.telephone,
        email: cabinet.email,
      });
      setCabinet(updated);
      showToast(setCabinetMessage, { type: "success", text: "Informations du cabinet enregistrées." });
    } catch (error) {
      console.error(error);
      showToast(setCabinetMessage, { type: "error", text: "Erreur lors de l'enregistrement." });
    } finally {
      setSavingCabinet(false);
    }
  }

  async function handleSavePraticien() {
    if (!praticien) return;
    try {
      setSavingPraticien(true);
      const updated = await updatePraticien(praticien.id, {
        nomComplet: praticien.nomComplet,
        numeroRPPS: praticien.numeroRPPS,
        specialite: praticien.specialite,
      });
      setPraticien(updated);
      showToast(setPraticienMessage, { type: "success", text: "Profil du praticien enregistré." });
    } catch (error) {
      console.error(error);
      showToast(setPraticienMessage, { type: "error", text: "Erreur lors de l'enregistrement." });
    } finally {
      setSavingPraticien(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF", fontSize: 13.5 }}>
        Chargement des paramètres...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 600, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#1F2937" }}>Paramètres</div>

      {/* ================= CABINET ================= */}
      {cabinet && (
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6", fontSize: 14, fontWeight: 600, color: "#1F2937" }}>
            Informations du cabinet
          </div>

          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Nom du cabinet</label>
              <input
                style={inputStyle}
                value={cabinet.nom}
                onChange={(e) => setCabinet({ ...cabinet, nom: e.target.value })}
              />
            </div>

            <div>
              <label style={labelStyle}>Adresse</label>
              <input
                style={inputStyle}
                value={cabinet.adresse ?? ""}
                onChange={(e) => setCabinet({ ...cabinet, adresse: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Téléphone</label>
                <input
                  style={inputStyle}
                  value={cabinet.telephone ?? ""}
                  onChange={(e) => setCabinet({ ...cabinet, telephone: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  style={inputStyle}
                  value={cabinet.email ?? ""}
                  onChange={(e) => setCabinet({ ...cabinet, email: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={handleSaveCabinet} disabled={savingCabinet} style={buttonStyle(savingCabinet)}>
                {savingCabinet ? "Enregistrement..." : "Enregistrer"}
              </button>
              {cabinetMessage && (
                <span style={{ fontSize: 12.5, color: cabinetMessage.type === "success" ? "#059669" : "#EF4444" }}>
                  {cabinetMessage.text}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= PRATICIEN ================= */}
      {praticien ? (
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6", fontSize: 14, fontWeight: 600, color: "#1F2937" }}>
            Profil praticien
          </div>

          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Nom complet</label>
              <input
                style={inputStyle}
                value={praticien.nomComplet}
                onChange={(e) => setPraticien({ ...praticien, nomComplet: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Numéro RPPS</label>
                <input
                  style={inputStyle}
                  value={praticien.numeroRPPS ?? ""}
                  onChange={(e) => setPraticien({ ...praticien, numeroRPPS: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle}>Spécialité</label>
                <input
                  style={inputStyle}
                  value={praticien.specialite ?? ""}
                  onChange={(e) => setPraticien({ ...praticien, specialite: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={handleSavePraticien} disabled={savingPraticien} style={buttonStyle(savingPraticien)}>
                {savingPraticien ? "Enregistrement..." : "Enregistrer"}
              </button>
              {praticienMessage && (
                <span style={{ fontSize: 12.5, color: praticienMessage.type === "success" ? "#059669" : "#EF4444" }}>
                  {praticienMessage.text}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px dashed #D1D5DB", borderRadius: 12, padding: "24px 20px", textAlign: "center", color: "#9CA3AF", fontSize: 13.5 }}>
          Aucun profil praticien trouvé.
        </div>
      )}
    </div>
  );
}