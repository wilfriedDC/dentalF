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
  createPraticien,
  updatePraticien,
  type Cabinet,
  type Praticien,
} from "../api/settings.api";
import { Avatar } from "../components/Avatar";
import { PRATICIEN_UPDATED_EVENT } from "../components/Sidebar";

type Toast = { type: "success" | "error"; text: string } | null;
type Tab = "cabinet" | "praticien";

// Formulaires locaux : toujours des chaînes (pas de null), pour rester
// compatibles avec des <input> contrôlés même avant la création en base.
type CabinetForm = { nom: string; adresse: string; telephone: string; email: string };
type PraticienForm = { nomComplet: string; numeroRPPS: string; specialite: string };

const EMPTY_CABINET: CabinetForm = { nom: "", adresse: "", telephone: "", email: "" };
const EMPTY_PRATICIEN: PraticienForm = { nomComplet: "", numeroRPPS: "", specialite: "" };

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

  // État "serveur" : ce qui existe réellement en base. null = pas encore créé.
  const [cabinet, setCabinet] = useState<Cabinet | null>(null);
  const [praticien, setPraticien] = useState<Praticien | null>(null);

  // État "formulaire" : toujours éditable, même si rien n'existe encore en base.
  const [cabinetForm, setCabinetForm] = useState<CabinetForm>(EMPTY_CABINET);
  const [praticienForm, setPraticienForm] = useState<PraticienForm>(EMPTY_PRATICIEN);

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
        if (cabinetData) {
          setCabinetForm({
            nom: cabinetData.nom,
            adresse: cabinetData.adresse ?? "",
            telephone: cabinetData.telephone ?? "",
            email: cabinetData.email ?? "",
          });
        }

        const first = praticiens.length > 0 ? praticiens[0] : null;
        setPraticien(first);
        if (first) {
          setPraticienForm({
            nomComplet: first.nomComplet,
            numeroRPPS: first.numeroRPPS ?? "",
            specialite: first.specialite ?? "",
          });
        }
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
    if (!cabinetForm.nom.trim()) {
      showToast(setCabinetMessage, { type: "error", text: "Le nom est requis" });
      return;
    }
    try {
      setSavingCabinet(true);
      // updateCabinet crée le cabinet s'il n'existe pas encore côté backend,
      // donc pas besoin d'un endpoint séparé pour la création.
      const updated = await updateCabinet({
        nom: cabinetForm.nom,
        adresse: cabinetForm.adresse || null,
        telephone: cabinetForm.telephone || null,
        email: cabinetForm.email || null,
      });
      setCabinet(updated);
      showToast(setCabinetMessage, {
        type: "success",
        text: cabinet ? "Cabinet mis à jour" : "Cabinet créé",
      });
    } catch (error) {
      console.error(error);
      showToast(setCabinetMessage, { type: "error", text: "Échec de l'enregistrement" });
    } finally {
      setSavingCabinet(false);
    }
  }

  async function handleSavePraticien() {
    if (!praticienForm.nomComplet.trim()) {
      showToast(setPraticienMessage, { type: "error", text: "Le nom est requis" });
      return;
    }
    try {
      setSavingPraticien(true);

      const payload = {
        nomComplet: praticienForm.nomComplet,
        numeroRPPS: praticienForm.numeroRPPS || null,
        specialite: praticienForm.specialite || null,
      };

      const updated = praticien
        ? await updatePraticien(praticien.id, payload)
        : await createPraticien(payload);

      setPraticien(updated);
      showToast(setPraticienMessage, {
        type: "success",
        text: praticien ? "Profil mis à jour" : "Praticien créé",
      });

      // Prévient la Sidebar que le praticien a changé, pour qu'elle recharge
      // automatiquement le "Dr. Nom" affiché en bas sans reload de page.
      window.dispatchEvent(new Event(PRATICIEN_UPDATED_EVENT));
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
      {tab === "cabinet" && (
        <div className="flex flex-1 flex-col justify-between rounded-2xl bg-white p-6 ring-1 ring-gray-100">
          {!cabinet && (
            <p className="mb-4 text-[12.5px] text-gray-400">
              Aucun cabinet enregistré pour l'instant — remplis les informations ci-dessous pour le créer.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom du cabinet" span>
              <input
                className={inputClass}
                placeholder="Ex: Cabinet Dentaire Rakoto"
                value={cabinetForm.nom}
                onChange={(e) => setCabinetForm({ ...cabinetForm, nom: e.target.value })}
              />
            </Field>

            <Field label="Adresse" icon={<MapPin size={12} />} span>
              <input
                className={inputClass}
                value={cabinetForm.adresse}
                onChange={(e) => setCabinetForm({ ...cabinetForm, adresse: e.target.value })}
              />
            </Field>

            <Field label="Téléphone" icon={<Phone size={12} />}>
              <input
                className={inputClass}
                value={cabinetForm.telephone}
                onChange={(e) => setCabinetForm({ ...cabinetForm, telephone: e.target.value })}
              />
            </Field>

            <Field label="Email" icon={<Mail size={12} />}>
              <input
                type="email"
                className={inputClass}
                value={cabinetForm.email}
                onChange={(e) => setCabinetForm({ ...cabinetForm, email: e.target.value })}
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
              {savingCabinet ? "Enregistrement..." : cabinet ? "Enregistrer" : "Créer le cabinet"}
            </button>
          </div>
        </div>
      )}

      {/* ================= PRATICIEN ================= */}
      {tab === "praticien" && (
        <div className="flex flex-1 flex-col justify-between rounded-2xl bg-white p-6 ring-1 ring-gray-100">
          <div className="flex flex-col gap-5">
            {!praticien && (
              <p className="text-[12.5px] text-gray-400">
                Aucun praticien enregistré pour l'instant — remplis les informations ci-dessous pour en créer un.
              </p>
            )}

            {praticien && (
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
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Nom complet" span>
                <input
                  className={inputClass}
                  placeholder="Ex: Jean Rakoto"
                  value={praticienForm.nomComplet}
                  onChange={(e) => setPraticienForm({ ...praticienForm, nomComplet: e.target.value })}
                />
              </Field>

              <Field label="Numéro RPPS" icon={<BadgeCheck size={12} />}>
                <input
                  className={inputClass}
                  value={praticienForm.numeroRPPS}
                  onChange={(e) => setPraticienForm({ ...praticienForm, numeroRPPS: e.target.value })}
                />
              </Field>

              <Field label="Spécialité">
                <input
                  className={inputClass}
                  value={praticienForm.specialite}
                  onChange={(e) => setPraticienForm({ ...praticienForm, specialite: e.target.value })}
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
              {savingPraticien ? "Enregistrement..." : praticien ? "Enregistrer" : "Créer le praticien"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}