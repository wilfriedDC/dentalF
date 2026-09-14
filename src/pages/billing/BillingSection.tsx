import { useEffect, useMemo, useState } from "react";

import {
  getConsultations,
  type ApiConsultation,
} from "../../api/consultations.api";

import { formatDate } from "../../utils/formatDate";
import { InvoiceView } from "./InvoiceView";
import {
  RefreshCw,
  FileText,
  Receipt,
  Wallet,
  AlertCircle,
  Loader2,
  Inbox,
  ListFilter,
} from "lucide-react";

type BillingFilter = "all" | "PAYE" | "PARTIEL" | "IMPAYE";

const STATUS_STYLE: Record<string, { className: string; dot: string }> = {
  PAYE: { className: "bg-green-light text-green", dot: "#10B981" },
  PARTIEL: { className: "bg-amber-light text-amber", dot: "#F59E0B" },
  IMPAYE: { className: "bg-red-light text-red", dot: "#EF4444" },
};

const STATUS_ACCENT: Record<string, string> = {
  PAYE: "#10B981",
  PARTIEL: "#F59E0B",
  IMPAYE: "#EF4444",
};

const FILTERS: { id: BillingFilter; label: string; dot?: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "PAYE", label: "Payées", dot: "#10B981" },
  { id: "PARTIEL", label: "Partielles", dot: "#F59E0B" },
  { id: "IMPAYE", label: "Impayées", dot: "#EF4444" },
];

export function BillingSection() {
  const [consultations, setConsultations] = useState<ApiConsultation[]>([]);
  const [selected, setSelected] = useState<ApiConsultation | null>(null);
  const [filter, setFilter] = useState<BillingFilter>("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================
  // CHARGER LES CONSULTATIONS
  // ============================================

  const loadConsultations = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getConsultations();

      setConsultations(data);
    } catch (err) {
      console.error("Erreur chargement facturation :", err);

      setError("Impossible de charger les données de facturation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsultations();
  }, []);

  // ============================================
  // CALCUL TOTAL / PAIEMENT / STATUT
  // ============================================

  const getTotalPrix = (consultation: ApiConsultation) =>
    consultation.actes.reduce((total, acte) => total + acte.prix, 0);

  const getTotalPaye = (consultation: ApiConsultation) =>
    consultation.paiements.reduce((total, paiement) => total + paiement.montant, 0);

  const getStatus = (consultation: ApiConsultation) => {
    const total = getTotalPrix(consultation);
    const paye = getTotalPaye(consultation);

    if (total === 0) return "IMPAYE";
    if (paye >= total) return "PAYE";
    if (paye > 0) return "PARTIEL";
    return "IMPAYE";
  };

  // ============================================
  // CONSULTATIONS FACTURABLES (avec patient)
  // ============================================

  const billable = useMemo(() => consultations.filter((c) => !!c.patient), [consultations]);

  // ============================================
  // COMPTAGE PAR STATUT (pour les badges de filtre)
  // ============================================

  const counts = useMemo(() => {
    const result = { all: billable.length, PAYE: 0, PARTIEL: 0, IMPAYE: 0 };
    billable.forEach((c) => {
      const status = getStatus(c);
      result[status] += 1;
    });
    return result;
  }, [billable]);

  const filtered = useMemo(() => {
    if (filter === "all") return billable;
    return billable.filter((c) => getStatus(c) === filter);
  }, [billable, filter]);

  // ============================================
  // TOTAUX GLOBAUX (pour les cartes résumé)
  // ============================================

  const { totalFacture, totalEncaisse, totalReste } = useMemo(() => {
    let facture = 0;
    let encaisse = 0;

    consultations.forEach((c) => {
      facture += getTotalPrix(c);
      encaisse += getTotalPaye(c);
    });

    return {
      totalFacture: facture,
      totalEncaisse: encaisse,
      totalReste: Math.max(facture - encaisse, 0),
    };
  }, [consultations]);

  const collectionRate = totalFacture > 0 ? Math.round((totalEncaisse / totalFacture) * 100) : 0;

  // ============================================
  // FACTURE
  // ============================================

  if (selected) {
    return <InvoiceView consultation={selected} onBack={() => setSelected(null)} />;
  }

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-2.5 text-sm text-text-subtle">
        <Loader2 size={16} className="animate-spin" />
        Chargement de la facturation...
      </div>
    );
  }

  // ============================================
  // ERROR
  // ============================================

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-red-light bg-red-light/40 p-5">
        <div className="flex items-center gap-2 text-[13.5px] text-red">
          <AlertCircle size={16} strokeWidth={2} />
          {error}
        </div>
        <button
          onClick={loadConsultations}
          className="rounded-lg border border-red-light bg-white px-4 py-1.5 text-[13px] font-medium text-red transition-colors hover:bg-red-light"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // ============================================
  // PAGE FACTURATION — hauteur fixe, scroll interne à la liste seulement
  // ============================================

  return (
    <div className="flex h-[calc(100vh-108px)] flex-col gap-5">
      {/* TITRE */}
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <div className="text-xl font-bold text-text">Facturation</div>
          <div className="mt-0.5 text-[13px] text-text-muted">
            {billable.length} consultation{billable.length !== 1 ? "s" : ""} facturée{billable.length !== 1 ? "s" : ""}
          </div>
        </div>

        <button
          onClick={loadConsultations}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3.5 py-2 text-[12.5px] font-medium text-text transition-colors hover:border-primary hover:text-primary-dark"
        >
          <RefreshCw size={13} strokeWidth={2.2} />
          Actualiser
        </button>
      </div>

      {/* RÉSUMÉ *
      <div className="grid shrink-0 grid-cols-3 gap-4">
        <SummaryCard icon={<Receipt size={17} strokeWidth={2.2} />} color="#0EA5A5" label="Total facturé" value={`${totalFacture.toLocaleString("fr-FR")} Ar`} />
        <SummaryCard icon={<Wallet size={17} strokeWidth={2.2} />} color="#10B981" label="Total encaissé" value={`${totalEncaisse.toLocaleString("fr-FR")} Ar`} />
        <SummaryCard icon={<AlertCircle size={17} strokeWidth={2.2} />} color={totalReste > 0 ? "#EF4444" : "#10B981"} label="Reste à percevoir" value={`${totalReste.toLocaleString("fr-FR")} Ar`} />
      </div>

      * TAUX DE RECOUVREMENT *
      {totalFacture > 0 && (
        <div className="shrink-0 rounded-xl border border-border-soft bg-surface/60 px-4 py-3">
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="font-medium text-text-muted">Taux de recouvrement</span>
            <span className="font-bold text-primary">{collectionRate}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${collectionRate}%` }} />
          </div>
        </div>
      )}
      /}

      {/* CARTE LISTE — occupe le reste de l'espace, scroll interne uniquement */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        {/* Barre de filtres */}
        <div className="flex shrink-0 items-center justify-between border-b border-border-soft px-5 py-3.5">
          <div className="inline-flex items-center gap-1 rounded-full bg-surface-2 p-1">
            {FILTERS.map((f) => {
              const isActive = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${
                    isActive ? "bg-white text-text shadow-sm" : "text-text-muted hover:text-text"
                  }`}
                >
                  {f.dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: f.dot }} />}
                  {f.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10.5px] font-bold ${
                      isActive ? "bg-surface-2 text-text-muted" : "bg-white text-text-subtle"
                    }`}
                  >
                    {counts[f.id]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 text-[11.5px] text-text-subtle">
            <ListFilter size={13} strokeWidth={2} />
            {filtered.length} affichée{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* En-têtes de colonnes */}
        <div className="hidden shrink-0 items-center gap-4 border-b border-border-soft bg-surface/60 px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-text-subtle sm:flex">
          <div className="w-[88px] shrink-0">Date</div>
          <div className="min-w-0 flex-[1.4]">Patient — Acte</div>
          <div className="w-[170px] shrink-0">Montant / Payé</div>
          <div className="w-[100px] shrink-0">Reste</div>
          <div className="w-[90px] shrink-0">Statut</div>
          <div className="w-[76px] shrink-0" />
        </div>

        {/* Liste — scroll contenu ici uniquement, jamais la page entière */}
        {filtered.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-14 text-text-subtle">
            <Inbox size={28} strokeWidth={1.5} />
            <div className="text-[13.5px]">
              {billable.length === 0 ? "Aucune consultation trouvée." : "Aucune consultation pour ce filtre."}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-2.5">
            <div className="flex flex-col gap-1.5">
              {filtered.map((c) => {
                const patientName = `${c.patient!.prenom} ${c.patient!.nom}`;
                const totalPrix = getTotalPrix(c);
                const totalPaye = getTotalPaye(c);
                const reste = Math.max(totalPrix - totalPaye, 0);
                const status = getStatus(c);
                const actesText = c.actes.length > 0 ? c.actes.map((acte) => acte.nomActe).join(", ") : "Consultation";

                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-4 rounded-xl border border-border-soft bg-surface/40 p-3.5 pl-4 transition-all hover:border-border hover:bg-white hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)]"
                    style={{ borderLeftColor: STATUS_ACCENT[status], borderLeftWidth: 3 }}
                  >
                    <div className="w-[88px] shrink-0 font-mono text-[12px] text-text-subtle">
                      {formatDate(c.dateConsultation)}
                    </div>

                    <div className="min-w-0 flex-[1.4]">
                      <div className="truncate text-[13.5px] font-semibold text-text">{patientName}</div>
                      <div className="truncate text-xs text-text-subtle">{actesText}</div>
                    </div>

                    <div className="w-[170px] shrink-0">
                      <div className="font-mono text-[13px] text-text">{totalPrix.toLocaleString("fr-FR")} Ar</div>
                      <div className="mt-0.5 text-[11.5px] text-green">Payé : {totalPaye.toLocaleString("fr-FR")} Ar</div>
                    </div>

                    <div
                      className="w-[100px] shrink-0 font-mono text-[13.5px] font-bold"
                      style={{ color: reste > 0 ? "#EF4444" : "#10B981" }}
                    >
                      {reste.toLocaleString("fr-FR")} Ar
                    </div>

                    <div className="w-[90px] shrink-0">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLE[status].className}`}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_STYLE[status].dot }} />
                        {status}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelected(c)}
                      className="flex w-[76px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-[12px] font-semibold text-primary transition-colors hover:border-primary hover:bg-primary-light"
                    >
                      <FileText size={13} strokeWidth={2.2} />
                      Voir
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// CARTE RÉSUMÉ (avec filigrane, cohérente avec le reste de l'app)
// ============================================

function SummaryCard({
  icon,
  color,
  label,
  value,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-white p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-6px_rgba(0,0,0,0.12)]">
      <div
        className="pointer-events-none absolute -right-3 -top-3 opacity-[0.07] transition-transform duration-300 group-hover:scale-110"
        style={{ color }}
      >
        <div style={{ transform: "scale(3)" }}>{icon}</div>
      </div>

      <div className="relative flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)`, boxShadow: `0 6px 14px ${color}45` }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold uppercase tracking-wide text-text-subtle">{label}</div>
          <div className="truncate text-[19px] font-extrabold text-text">{value}</div>
        </div>
      </div>
    </div>
  );
}