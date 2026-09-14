import { useState } from "react";
import type { Patient } from "../types";
import { ACTES_OPTIONS } from "../data/mockData";
import { ACTE_TO_TOOTH_STATUS } from "../data/acteToothStatus";
import { ToothPicker } from "./ToothPicker";
import { updateToothNote, type ToothStatus } from "../api/patients.api";
import {
  createConsultation,
  type CreateConsultationPayload,
} from "../api/consultations.api";
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Receipt,
  Stethoscope,
  CalendarPlus,
  Wallet,
  ClipboardList,
  NotebookPen,
} from "lucide-react";

// =====================================================
// TYPES
// =====================================================

// Une "ligne" du panier d'actes — id local uniquement pour le rendu React
// (key des lignes), n'est jamais envoyé au backend.
interface ActeRow {
  id: string;
  numeroDent: string;
  nomActe: string;
  prix: string; // string pour permettre un champ vide pendant la saisie
}

function createEmptyRow(): ActeRow {
  return {
    id: Math.random().toString(36).slice(2),
    numeroDent: "",
    nomActe: "",
    prix: "",
  };
}

export function NewConsultationForm({
  patient,
  onBack,
}: {
  patient: Patient;
  onBack: () => void;
}) {
  const [motif, setMotif] = useState("");
  const [notes, setNotes] = useState("");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Panier d'actes — style "articles de supermarché" : plusieurs lignes,
  // chacune avec sa dent, son acte et son prix. On démarre avec une ligne.
  const [actesRows, setActesRows] = useState<ActeRow[]>([createEmptyRow()]);

  const [avance, setAvance] = useState("");

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Passe à true dès la première tentative d'enregistrement invalide, pour
  // afficher les champs manquants en rouge sans "punir" l'utilisateur avant
  // qu'il ait essayé de valider.
  const [attemptedSave, setAttemptedSave] = useState(false);

  // ===================================================
  // GESTION DES LIGNES D'ACTES
  // ===================================================

  const handleAddRow = () => {
    setActesRows((rows) => [...rows, createEmptyRow()]);
  };

  const handleRemoveRow = (id: string) => {
    setActesRows((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));
  };

  const handleUpdateRow = (id: string, patch: Partial<ActeRow>) => {
    setActesRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  // Lignes réellement exploitables (un acte choisi) — les lignes vides en
  // cours de saisie ne comptent pas dans le total ni dans l'envoi final.
  const validRows = actesRows.filter((r) => r.nomActe.trim().length > 0);

  const total = validRows.reduce((sum, r) => sum + (Number(r.prix) || 0), 0);
  const advance = Number(avance) || 0;
  const reste = Math.max(0, total - advance);

  const hasAtLeastOneActe = validRows.length > 0;
  const motifMissing = attemptedSave && !motif.trim();
  const actesMissing = attemptedSave && !hasAtLeastOneActe;

  async function handleSave() {
    setAttemptedSave(true);

    if (!motif.trim() || !hasAtLeastOneActe || saving) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload: CreateConsultationPayload = {
        patientId: Number(patient.id),

        motifConsultation: motif.trim(),

        observation: notes.trim() || null,

        prochainRdvDate: date || null,
        prochainRdvHeure: time || null,

        // Tableau d'actes (panier) — un acte par ligne remplie. Chaque ligne
        // porte son propre numéro de dent, comme pour un vrai bordereau
        // d'actes dentaires.
        actes: validRows.map((r) => ({
          numeroDent: r.numeroDent || null,
          nomActe: r.nomActe,
          description: null,
          prix: Number(r.prix) || 0,
        })),

        paiement:
          advance > 0
            ? {
                montant: advance,
                modePaiement: "Cash",
              }
            : null,
      };

      const consultation = await createConsultation(payload);

      // Marque automatiquement les dents concernées sur l'odontogramme,
      // pour les actes qui ont un statut de dent associé (voir
      // data/acteToothStatus.ts). Les actes globaux (détartrage, radio...)
      // n'ont pas de statut associé et sont ignorés ici.
      const odontogrammeUpdates = validRows
        .filter((r) => r.numeroDent && ACTE_TO_TOOTH_STATUS[r.nomActe])
        .map((r) =>
          updateToothNote(
            Number(patient.id),
            Number(r.numeroDent),
            r.nomActe,
            ACTE_TO_TOOTH_STATUS[r.nomActe] as ToothStatus,
            consultation.id
          )
        );

      if (odontogrammeUpdates.length > 0) {
        try {
          await Promise.all(odontogrammeUpdates);
        } catch (odontoError) {
          // On ne bloque pas la création de la consultation pour ça —
          // la consultation et le paiement sont déjà enregistrés.
          console.error("Erreur mise à jour odontogramme :", odontoError);
        }
      }

      setSaved(true);

      setTimeout(() => {
        onBack();
      }, 1200);
    } catch (error: any) {
      console.error("ERREUR CRÉATION CONSULTATION :", error.response?.data || error);

      setError(error.response?.data?.message || "Erreur lors de la création de la consultation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      {/* HEADER */}
      <div className="flex items-center gap-3 border-b border-border-soft bg-surface/60 px-6 py-4">
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          <ArrowLeft size={16} strokeWidth={2} />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
          <Stethoscope size={17} strokeWidth={2.2} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold text-text">Nouvelle consultation</div>
          <div className="text-[12.5px] text-text-muted">{patient.name}</div>
        </div>

        {/* Aperçu total, toujours visible même en scrollant le contenu */}
        {total > 0 && (
          <div className="hidden shrink-0 items-baseline gap-1 rounded-lg bg-primary-light px-3 py-1.5 sm:flex">
            <span className="text-[11px] font-medium text-primary-dark">Total</span>
            <span className="text-[14px] font-extrabold text-primary-dark">
              {total.toLocaleString("fr-FR")} Ar
            </span>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex max-h-[calc(100vh-260px)] flex-col gap-5 overflow-y-auto p-6">
        {/* MOTIF + RDV */}
        <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-semibold text-text">Motif de consultation *</span>
            <input
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex: Douleur molaire, Contrôle…"
              className={`rounded-lg border-[1.5px] px-3 py-2.5 text-[13.5px] text-text outline-none transition-colors focus:border-primary ${
                motifMissing ? "border-red bg-red-light/30" : "border-border"
              }`}
            />
            {motifMissing && <span className="text-[11.5px] text-red">Le motif est obligatoire.</span>}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text">
              <CalendarPlus size={13} strokeWidth={2.2} className="text-text-subtle" />
              Prochain rendez-vous
            </span>
            <div className="flex gap-2">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-1/2 rounded-lg border-[1.5px] border-border px-3 py-2.5 text-[13.5px] text-text outline-none transition-colors focus:border-primary"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-1/2 rounded-lg border-[1.5px] border-border px-3 py-2.5 text-[13.5px] text-text outline-none transition-colors focus:border-primary"
              />
            </div>
          </label>
        </div>

        {/* =================================================
            PANIER D'ACTES — style "articles de supermarché"
        ================================================= */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text">
              <ClipboardList size={13} strokeWidth={2.2} className="text-text-subtle" />
              Actes réalisés *
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                actesMissing ? "bg-red-light text-red" : "bg-surface-2 text-text-muted"
              }`}
            >
              {validRows.length} acte{validRows.length !== 1 ? "s" : ""}
            </span>
          </div>
          {actesMissing && <div className="mb-2 text-[11.5px] text-red">Ajoute au moins un acte.</div>}

          {/* En-têtes de colonnes */}
          <div className="mb-1.5 hidden grid-cols-[20px_130px_1fr_120px_32px] gap-2 px-1 sm:grid">
            <span />
            <span className="text-[10.5px] font-semibold uppercase tracking-wide text-text-subtle">Dent</span>
            <span className="text-[10.5px] font-semibold uppercase tracking-wide text-text-subtle">Acte</span>
            <span className="text-[10.5px] font-semibold uppercase tracking-wide text-text-subtle">Prix (Ar)</span>
            <span />
          </div>

          <div className="flex flex-col gap-2">
            {actesRows.map((row, index) => (
              <div
                key={row.id}
                className="grid grid-cols-[20px_130px_1fr_120px_32px] items-center gap-2 rounded-xl bg-surface p-2 max-[600px]:grid-cols-1"
              >
                {/* Numéro de ligne — repère visuel pour les longs paniers */}
                <span className="hidden text-center text-[11px] font-semibold text-text-subtle sm:block">
                  {index + 1}
                </span>

                {/* Numéro de dent — mini-schéma cliquable, notation FDI complète */}
                <ToothPicker
                  value={row.numeroDent}
                  onChange={(numeroDent) => handleUpdateRow(row.id, { numeroDent })}
                />

                {/* Acte */}
                <select
                  value={row.nomActe}
                  onChange={(e) => handleUpdateRow(row.id, { nomActe: e.target.value })}
                  className={`rounded-lg border-[1.5px] border-border bg-white px-2.5 py-2 text-[13.5px] outline-none transition-colors focus:border-primary ${
                    row.nomActe ? "text-text" : "text-text-subtle"
                  }`}
                >
                  <option value="">Sélectionner un acte…</option>
                  {ACTES_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>

                {/* Prix */}
                <input
                  type="number"
                  value={row.prix}
                  onChange={(e) => handleUpdateRow(row.id, { prix: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-lg border-[1.5px] border-border bg-white px-2.5 py-2 text-[13.5px] text-text outline-none transition-colors focus:border-primary"
                />

                {/* Supprimer la ligne (désactivé s'il n'en reste qu'une) */}
                <button
                  type="button"
                  onClick={() => handleRemoveRow(row.id)}
                  disabled={actesRows.length === 1}
                  title="Supprimer cette ligne"
                  className={`flex h-7 w-7 items-center justify-center justify-self-end rounded-lg transition-colors ${
                    actesRows.length === 1
                      ? "cursor-not-allowed text-text-subtle/50"
                      : "text-red hover:bg-red-light"
                  }`}
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>

          {/* Ajouter une ligne — comme "ajouter un article" */}
          <button
            type="button"
            onClick={handleAddRow}
            className="mt-2.5 flex w-fit items-center gap-1.5 rounded-lg border-[1.5px] border-dashed border-border px-3.5 py-2 text-[12.5px] font-semibold text-primary transition-colors hover:border-primary hover:bg-primary-light/40"
          >
            <Plus size={14} strokeWidth={2.5} />
            Ajouter un acte
          </button>
        </div>

        {/* FINANCES — avance uniquement, le total vient du panier ci-dessus */}
        <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text">
              <Wallet size={13} strokeWidth={2.2} className="text-text-subtle" />
              Avance reçue (Ar)
            </span>
            <input
              type="number"
              value={avance}
              onChange={(e) => setAvance(e.target.value)}
              placeholder="0"
              className="rounded-lg border-[1.5px] border-border px-3 py-2.5 text-[13.5px] text-text outline-none transition-colors focus:border-primary"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-semibold text-text">Reste à payer</span>
            <div
              className="rounded-lg border border-border-soft bg-surface px-3 py-2.5 text-[13.5px] font-bold"
              style={{ color: reste > 0 ? "#EF4444" : "#10B981" }}
            >
              {reste.toLocaleString("fr-FR")} Ar
            </div>
          </div>
        </div>

        {/* NOTES */}
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text">
            <NotebookPen size={13} strokeWidth={2.2} className="text-text-subtle" />
            Notes cliniques
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observations, recommandations, prescriptions…"
            rows={3}
            className="resize-y rounded-lg border-[1.5px] border-border px-3 py-2.5 text-[13.5px] text-text outline-none transition-colors focus:border-primary"
          />
        </label>

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-light bg-red-light/40 px-3.5 py-2.5 text-[13px] text-red">
            <AlertCircle size={15} strokeWidth={2} />
            {error}
          </div>
        )}

        {/* =================================================
            TOTAL — comme un ticket de caisse, détail + total en bas
        ================================================= */}
        {validRows.length > 0 && (
          <div className="flex flex-col gap-2.5 rounded-xl border border-primary-light bg-primary-light/40 px-4.5 py-3.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary-dark">
              <Receipt size={12} strokeWidth={2.2} />
              Détail
            </div>

            {/* Détail ligne par ligne, comme un ticket */}
            <div className="flex flex-col gap-1">
              {validRows.map((r) => (
                <div key={r.id} className="flex justify-between text-[12.5px] text-text">
                  <span>
                    {r.nomActe}
                    {r.numeroDent ? ` — Dent ${r.numeroDent}` : ""}
                  </span>
                  <span className="font-semibold">{(Number(r.prix) || 0).toLocaleString("fr-FR")} Ar</span>
                </div>
              ))}
            </div>

            <div className="h-px bg-primary-light" />

            {/* Total / Avance / Reste */}
            <div className="flex items-center justify-between">
              <div className="flex gap-6">
                <div>
                  <div className="text-[11px] text-text-muted">Avance</div>
                  <div className="text-[13.5px] text-text">{advance.toLocaleString("fr-FR")} Ar</div>
                </div>
                <div>
                  <div className="text-[11px] text-text-muted">Reste</div>
                  <div
                    className="text-[13.5px] font-semibold"
                    style={{ color: reste > 0 ? "#EF4444" : "#10B981" }}
                  >
                    {reste.toLocaleString("fr-FR")} Ar
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] text-text-muted">Total</div>
                <div className="text-[19px] font-extrabold text-primary-dark">
                  {total.toLocaleString("fr-FR")} Ar
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BUTTONS */}
      <div className="flex justify-end gap-2.5 border-t border-border-soft px-6 py-4">
        <button
          onClick={onBack}
          disabled={saving}
          className="rounded-lg border border-border px-4 py-2.5 text-[13.5px] font-medium text-text-muted transition-colors hover:bg-surface disabled:opacity-50"
        >
          Annuler
        </button>

        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors ${
            saved ? "bg-green" : "bg-primary hover:bg-primary-dark"
          }`}
        >
          {saved ? (
            <>
              <CheckCircle2 size={15} strokeWidth={2.2} />
              Consultation créée !
            </>
          ) : saving ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Création...
            </>
          ) : (
            "Enregistrer & Générer facture"
          )}
        </button>
      </div>

      {/* Overlay de succès — plus visible qu'un simple changement de bouton */}
      {saved && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/85 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-white px-8 py-6 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-light text-green">
              <CheckCircle2 size={26} strokeWidth={2.2} />
            </div>
            <div className="text-[14px] font-bold text-text">Consultation enregistrée</div>
            <div className="text-[12.5px] text-text-muted">Retour à la fiche patient...</div>
          </div>
        </div>
      )}
    </div>
  );
}