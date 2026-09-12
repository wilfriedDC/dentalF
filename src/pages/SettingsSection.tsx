import { useEffect, useState } from "react";
import {
  Building2,
  Stethoscope,
  MapPin,
  Phone,
  Mail,
  BadgeCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import {
  getCabinet,
  updateCabinet,
  getPraticiens,
  updatePraticien,
  type Cabinet,
  type Praticien,
} from "../api/settings.api";
import { Avatar } from "../components/Avatar";

type Toast = { type: "success" | "error"; text: string } | null;
type Tab = "cabinet" | "praticien";

function Field({
  label,
  icon,
  span,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  span?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <label className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-gray-500">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border-0 bg-gray-50 px-3.5 py-2.5 text-[13.5px] text-gray-800 outline-none ring-1 ring-inset ring-gray-200 transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary";

function ToastMessage({ toast }: { toast: Toast }) {
  if (!toast) return null;
  const isSuccess = toast.type === "success";
  return (
    <span
      className={`flex items-center gap-1.5 text-[12.5px] font-medium ${
        isSuccess ? "text-emerald-600" : "text-red-500"
      }`}
    >
      {isSuccess ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
      {toast.text}
    </span>
  );
}

export function SettingsSection() {
  const [tab, setTab] = useState<Tab>("cabinet");
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
      showToast(setCabinetMessage, { type: "success", text: "Cabinet mis à jour" });
    } catch (error) {
      console.error(error);
      showToast(setCabinetMessage, { type: "error", text: "Échec de l'enregistrement" });
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
      showToast(setPraticienMessage, { type: "success", text: "Profil mis à jour" });
    } catch (error) {
      console.error(error);
      showToast(setPraticienMessage, { type: "error", text: "Échec de l'enregistrement" });
    } finally {
      setSavingPraticien(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-[13.5px] text-gray-400">
        Chargement des paramètres...
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-xl flex-col gap-5 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-gray-800">Paramètres</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">Cabinet et profil praticien</p>
        </div>

        {/* Segmented switcher, same visual language as the sidebar's active nav state */}
        <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setTab("cabinet")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-all ${
              tab === "cabinet"
                ? "bg-white text-primary-dark shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Building2 size={15} strokeWidth={2.2} />
            Cabinet
          </button>
          <button
            onClick={() => setTab("praticien")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-all ${
              tab === "praticien"
                ? "bg-white text-primary-dark shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Stethoscope size={15} strokeWidth={2.2} />
            Praticien
          </button>
        </div>
      </div>

      {/* ================= CABINET ================= */}
      {tab === "cabinet" && cabinet && (
        <div className="flex flex-1 flex-col justify-between rounded-2xl bg-white p-6 ring-1 ring-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom du cabinet" span>
              <input
                className={inputClass}
                value={cabinet.nom}
                onChange={(e) => setCabinet({ ...cabinet, nom: e.target.value })}
              />
            </Field>

            <Field label="Adresse" icon={<MapPin size={12} />} span>
              <input
                className={inputClass}
                value={cabinet.adresse ?? ""}
                onChange={(e) => setCabinet({ ...cabinet, adresse: e.target.value })}
              />
            </Field>

            <Field label="Téléphone" icon={<Phone size={12} />}>
              <input
                className={inputClass}
                value={cabinet.telephone ?? ""}
                onChange={(e) => setCabinet({ ...cabinet, telephone: e.target.value })}
              />
            </Field>

            <Field label="Email" icon={<Mail size={12} />}>
              <input
                type="email"
                className={inputClass}
                value={cabinet.email ?? ""}
                onChange={(e) => setCabinet({ ...cabinet, email: e.target.value })}
              />
            </Field>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <ToastMessage toast={cabinetMessage} />
            <button
              onClick={handleSaveCabinet}
              disabled={savingCabinet}
              className={`ml-auto rounded-xl px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors ${
                savingCabinet ? "cursor-default bg-gray-300" : "bg-primary hover:bg-primary-dark"
              }`}
            >
              {savingCabinet ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      )}

      {/* ================= PRATICIEN ================= */}
      {tab === "praticien" &&
        (praticien ? (
          <div className="flex flex-1 flex-col justify-between rounded-2xl bg-white p-6 ring-1 ring-gray-100">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <Avatar name={`Dr. ${praticien.nomComplet}`} size={40} bg="#0C8F8F" color="#ffffff" />
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold text-gray-800">
                    Dr. {praticien.nomComplet}
                  </div>
                  <div className="truncate text-[12.5px] text-gray-500">
                    {praticien.specialite || "Dentiste"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Nom complet" span>
                  <input
                    className={inputClass}
                    value={praticien.nomComplet}
                    onChange={(e) => setPraticien({ ...praticien, nomComplet: e.target.value })}
                  />
                </Field>

                <Field label="Numéro RPPS" icon={<BadgeCheck size={12} />}>
                  <input
                    className={inputClass}
                    value={praticien.numeroRPPS ?? ""}
                    onChange={(e) => setPraticien({ ...praticien, numeroRPPS: e.target.value })}
                  />
                </Field>

                <Field label="Spécialité">
                  <input
                    className={inputClass}
                    value={praticien.specialite ?? ""}
                    onChange={(e) => setPraticien({ ...praticien, specialite: e.target.value })}
                  />
                </Field>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
              <ToastMessage toast={praticienMessage} />
              <button
                onClick={handleSavePraticien}
                disabled={savingPraticien}
                className={`ml-auto rounded-xl px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors ${
                  savingPraticien ? "cursor-default bg-gray-300" : "bg-primary hover:bg-primary-dark"
                }`}
              >
                {savingPraticien ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 text-[13.5px] text-gray-400">
            Aucun profil praticien trouvé.
          </div>
        ))}
    </div>
  );
}