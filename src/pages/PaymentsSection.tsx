import { useEffect, useMemo, useState } from "react";
import {
  getConsultations,
  addPaiement,
  type ApiConsultation,
} from "../api/consultations.api";
import { formatDate } from "../utils/formatDate";
import { Avatar } from "../components/Avatar";
import { InvoiceView } from "./billing/InvoiceView";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  Wallet,
  AlertCircle,
  Receipt,
  Banknote,
  CreditCard,
  ShieldCheck,
  ArrowLeftRight,
  CheckCircle2,
  Loader2,
  Inbox,
  ListFilter,
  FileDown,
  FileSpreadsheet,
  X,
  FileText,
} from "lucide-react";

type PaymentFilter = "all" | "PAYE" | "PARTIEL" | "IMPAYE";

type PaymentRow = {
  id: string;
  consultationId: number;
  date: string;
  patient: string;
  acte: string;
  amount: number;
  method: string;
  balance: number;
  status: "PAYE" | "PARTIEL" | "IMPAYE";
};

const METHOD_LABEL: Record<string, string> = {
  Cash: "Espèces",
  Card: "Carte",
  Insurance: "Assurance",
  Transfer: "Virement",
};

const METHOD_ICON: Record<string, React.ReactNode> = {
  Cash: <Banknote size={12} strokeWidth={2.2} />,
  Card: <CreditCard size={12} strokeWidth={2.2} />,
  Insurance: <ShieldCheck size={12} strokeWidth={2.2} />,
  Transfer: <ArrowLeftRight size={12} strokeWidth={2.2} />,
};

function getMethodLabel(method: string | null) {
  if (!method) return "—";
  return METHOD_LABEL[method] ?? method;
}

function getMethodIcon(method: string | null) {
  if (!method) return <Receipt size={12} strokeWidth={2.2} />;
  return METHOD_ICON[method] ?? <Receipt size={12} strokeWidth={2.2} />;
}

function getStatus(total: number, paid: number): "PAYE" | "PARTIEL" | "IMPAYE" {
  if (paid >= total && total > 0) return "PAYE";
  if (paid > 0) return "PARTIEL";
  return "IMPAYE";
}

const STATUS_CONFIG = {
  PAYE: { label: "Payé", className: "bg-green-light text-green", dot: "#10B981" },
  PARTIEL: { label: "Partiel", className: "bg-amber-light text-amber", dot: "#F59E0B" },
  IMPAYE: { label: "Impayé", className: "bg-red-light text-red", dot: "#EF4444" },
};

const STATUS_ACCENT: Record<string, string> = {
  PAYE: "#10B981",
  PARTIEL: "#F59E0B",
  IMPAYE: "#EF4444",
};

function StatusPill({ status }: { status: "PAYE" | "PARTIEL" | "IMPAYE" }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${cfg.className}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

export function PaymentsSection() {
  const [consultations, setConsultations] = useState<ApiConsultation[]>([]);
  const [filter, setFilter] = useState<PaymentFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Paiement en cours de saisie (ligne sélectionnée pour "Payer")
  const [payingRow, setPayingRow] = useState<PaymentRow | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState("");

  // Consultation à afficher en facture juste après l'enregistrement d'un paiement
  const [invoiceConsultation, setInvoiceConsultation] = useState<ApiConsultation | null>(null);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getConsultations();
      setConsultations(data);
    } catch (err) {
      console.error("Erreur chargement paiements :", err);
      setError("Impossible de charger les paiements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const paymentRows = useMemo<PaymentRow[]>(() => {
    const rows: PaymentRow[] = [];

    consultations.forEach((consultation) => {
      const total = consultation.actes.reduce((sum, acte) => sum + Number(acte.prix || 0), 0);
      const paid = consultation.paiements.reduce((sum, paiement) => sum + Number(paiement.montant || 0), 0);
      const balance = Math.max(total - paid, 0);
      const status = getStatus(total, paid);

      const patientName = consultation.patient
        ? `${consultation.patient.nom} ${consultation.patient.prenom}`
        : "Patient inconnu";

      const acteName =
        consultation.actes.length > 0 ? consultation.actes.map((acte) => acte.nomActe).join(", ") : "Aucun acte";

      if (consultation.paiements.length > 0) {
        consultation.paiements.forEach((paiement) => {
          rows.push({
            id: `${consultation.id}-${paiement.id}`,
            consultationId: consultation.id,
            date: paiement.datePaiement,
            patient: patientName,
            acte: acteName,
            amount: Number(paiement.montant || 0),
            method: getMethodLabel(paiement.modePaiement),
            balance,
            status,
          });
        });
      } else {
        rows.push({
          id: `${consultation.id}-unpaid`,
          consultationId: consultation.id,
          date: consultation.dateConsultation,
          patient: patientName,
          acte: acteName,
          amount: 0,
          method: "—",
          balance,
          status,
        });
      }
    });

    return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [consultations]);

  // Comptage par statut — pour afficher les badges de nombre sur chaque filtre
  const counts = useMemo(() => {
    return {
      all: paymentRows.length,
      PAYE: paymentRows.filter((p) => p.status === "PAYE").length,
      PARTIEL: paymentRows.filter((p) => p.status === "PARTIEL").length,
      IMPAYE: paymentRows.filter((p) => p.status === "IMPAYE").length,
    };
  }, [paymentRows]);

  const FILTERS: { id: PaymentFilter; label: string; dot?: string }[] = [
    { id: "all", label: "Tous" },
    { id: "PAYE", label: "Payés", dot: "#10B981" },
    { id: "PARTIEL", label: "Partiels", dot: "#F59E0B" },
    { id: "IMPAYE", label: "Impayés", dot: "#EF4444" },
  ];

  const filtered = useMemo(() => {
    if (filter === "all") return paymentRows;
    return paymentRows.filter((payment) => payment.status === filter);
  }, [paymentRows, filter]);

  const totalIn = useMemo(() => {
    return consultations.reduce((total, consultation) => {
      const paid = consultation.paiements.reduce((sum, paiement) => sum + Number(paiement.montant || 0), 0);
      return total + paid;
    }, 0);
  }, [consultations]);

  const totalDue = useMemo(() => {
    return consultations.reduce((total, consultation) => {
      const totalActes = consultation.actes.reduce((sum, acte) => sum + Number(acte.prix || 0), 0);
      const totalPaye = consultation.paiements.reduce((sum, paiement) => sum + Number(paiement.montant || 0), 0);
      return total + Math.max(totalActes - totalPaye, 0);
    }, 0);
  }, [consultations]);

  const transactionCount = useMemo(() => {
    return consultations.reduce((count, consultation) => count + consultation.paiements.length, 0);
  }, [consultations]);

  // Taux de recouvrement global (donnée réelle : encaissé / (encaissé + dû))
  const collectionRate = useMemo(() => {
    const total = totalIn + totalDue;
    return total > 0 ? Math.round((totalIn / total) * 100) : 0;
  }, [totalIn, totalDue]);

  // =========================
  // ENREGISTRER UN PAIEMENT (impayé / partiel) puis afficher la facture
  // =========================
  // Utilise la vraie route POST /consultations/:id/paiements, qui crée un
  // nouveau Paiement en base sans toucher aux paiements existants.
  const openPayModal = (row: PaymentRow) => {
    setPayingRow(row);
    setPayAmount(String(row.balance));
    setPayMethod("Cash");
    setPayError("");
  };

  const closePayModal = () => {
    if (paySubmitting) return;
    setPayingRow(null);
  };

  const submitPayment = async () => {
    if (!payingRow) return;

    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      setPayError("Montant invalide.");
      return;
    }

    setPaySubmitting(true);
    setPayError("");

    try {
      const updatedConsultation: ApiConsultation = await addPaiement(payingRow.consultationId, {
        montant: amount,
        modePaiement: payMethod,
      });

      // Recharge la liste complète pour que les totaux/filtres reflètent le nouveau paiement
      const refreshed = await getConsultations();
      setConsultations(refreshed);

      setPayingRow(null);

      // Facture affichée automatiquement, comme après une consultation
      setInvoiceConsultation(updatedConsultation);
    } catch (err) {
      console.error("Erreur enregistrement paiement :", err);
      setPayError("Impossible d'enregistrer ce paiement.");
    } finally {
      setPaySubmitting(false);
    }
  };

  // =========================
  // EXPORT PDF — utilise la liste filtrée actuellement affichée
  // =========================
  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("Suivi des paiements - DentalF", 14, 15);
    doc.setFontSize(10);
    doc.text(`Exporté le ${new Date().toLocaleDateString("fr-FR")}`, 14, 21);

    autoTable(doc, {
      startY: 27,
      head: [["Date", "Patient", "Acte", "Montant", "Méthode", "Solde", "Statut"]],
      body: filtered.map((p) => [
        formatDate(p.date),
        p.patient,
        p.acte,
        p.amount > 0 ? `${p.amount.toLocaleString("fr-FR")} Ar` : "—",
        p.method,
        `${p.balance.toLocaleString("fr-FR")} Ar`,
        STATUS_CONFIG[p.status].label,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [14, 165, 165] }, // couleur proche de --primary
    });

    doc.save(`paiements_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // =========================
  // EXPORT EXCEL — utilise la liste filtrée actuellement affichée
  // =========================
  const exportToExcel = () => {
    const rows = filtered.map((p) => ({
      Date: formatDate(p.date),
      Patient: p.patient,
      Acte: p.acte,
      "Montant (Ar)": p.amount,
      Méthode: p.method,
      "Solde (Ar)": p.balance,
      Statut: STATUS_CONFIG[p.status].label,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Paiements");

    // Largeur des colonnes
    worksheet["!cols"] = [
      { wch: 12 },
      { wch: 22 },
      { wch: 28 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
    ];

    XLSX.writeFile(workbook, `paiements_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // =========================
  // FACTURE — affichée juste après l'enregistrement d'un paiement
  // =========================
  if (invoiceConsultation) {
    return <InvoiceView consultation={invoiceConsultation} onBack={() => setInvoiceConsultation(null)} />;
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-2.5 text-sm text-text-subtle">
        <Loader2 size={16} className="animate-spin" />
        Chargement des paiements...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-light bg-red-light/40 p-4 text-[13.5px] text-red">
        <AlertCircle size={16} strokeWidth={2} />
        {error}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-108px)] flex-col gap-5">
      {/* TITRE */}
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <div className="text-xl font-bold text-text">Suivi des paiements</div>
          <div className="mt-0.5 text-[13px] text-text-muted">
            {transactionCount} transaction{transactionCount !== 1 ? "s" : ""} enregistrée{transactionCount !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-[12.5px] font-semibold text-text-muted transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileSpreadsheet size={15} strokeWidth={2.2} />
            Excel
          </button>
          <button
            onClick={exportToPDF}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-[12.5px] font-semibold text-text-muted transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileDown size={15} strokeWidth={2.2} />
            PDF
          </button>
        </div>
      </div>

      {/* RÉSUMÉ */}
      <div className="grid shrink-0 grid-cols-3 gap-4">
        <SummaryCard icon={<Wallet size={17} strokeWidth={2.2} />} color="#10B981" label="Total encaissé" value={`${totalIn.toLocaleString("fr-FR")} Ar`} />
        <SummaryCard icon={<AlertCircle size={17} strokeWidth={2.2} />} color="#EF4444" label="Total dû" value={`${totalDue.toLocaleString("fr-FR")} Ar`} />
        <SummaryCard icon={<Receipt size={17} strokeWidth={2.2} />} color="#0EA5A5" label="Transactions" value={String(transactionCount)} />
      </div>

      {/* TAUX DE RECOUVREMENT GLOBAL 
      {(totalIn > 0 || totalDue > 0) && (
        <div className="shrink-0 rounded-xl border border-border-soft bg-surface/60 px-4 py-3">
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="font-medium text-text-muted">Taux de recouvrement global</span>
            <span className="font-bold text-primary">{collectionRate}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${collectionRate}%` }} />
          </div>
        </div>
      )}
      */}
      {/* CARTE LISTE — occupe le reste de l'espace, scroll interne uniquement */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        {/* Barre de filtres pro : compteurs + pastille de couleur par statut */}
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
            {filtered.length} affiché{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* En-têtes de colonnes */}
        <div className="hidden shrink-0 items-center gap-4 border-b border-border-soft bg-surface/60 px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-text-subtle sm:flex">
          <div className="w-9 shrink-0" />
          <div className="w-[84px] shrink-0">Date</div>
          <div className="min-w-0 flex-[1.3]">Patient — Acte</div>
          <div className="w-[110px] shrink-0">Montant</div>
          <div className="w-[110px] shrink-0">Méthode</div>
          <div className="w-[110px] shrink-0">Solde</div>
          <div className="w-[90px] shrink-0">Statut</div>
          <div className="w-[88px] shrink-0" />
        </div>

        {/* Liste — scroll contenu dans cette carte, jamais la page entière */}
        {filtered.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-14 text-text-subtle">
            <Inbox size={28} strokeWidth={1.5} />
            <div className="text-[13.5px]">Aucun paiement trouvé.</div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-2.5">
            <div className="flex flex-col gap-1.5">
              {filtered.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center gap-4 rounded-xl border border-transparent p-2.5 pl-3.5 transition-colors hover:border-border hover:bg-surface/60"
                  style={{ borderLeftColor: STATUS_ACCENT[payment.status], borderLeftWidth: 3 }}
                >
                  <Avatar name={payment.patient} size={30} />

                  <div className="w-[84px] shrink-0 font-mono text-[12px] text-text-subtle">
                    {formatDate(payment.date)}
                  </div>

                  <div className="min-w-0 flex-[1.3]">
                    <div className="truncate text-[13.5px] font-semibold text-text">{payment.patient}</div>
                    <div className="truncate text-xs text-text-subtle">{payment.acte}</div>
                  </div>

                  <div
                    className="w-[110px] shrink-0 font-mono text-[13.5px] font-bold"
                    style={{ color: payment.amount > 0 ? "#10B981" : "#C4CBD4" }}
                  >
                    {payment.amount > 0 ? `+${payment.amount.toLocaleString("fr-FR")} Ar` : "—"}
                  </div>

                  <div className="w-[110px] shrink-0">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-[11.5px] text-text-muted">
                      {getMethodIcon(payment.method === "—" ? null : payment.method)}
                      {payment.method}
                    </span>
                  </div>

                  <div
                    className="flex w-[110px] shrink-0 items-center gap-1 font-mono text-[13px] font-semibold"
                    style={{ color: payment.balance > 0 ? "#EF4444" : "#10B981" }}
                  >
                    {payment.balance > 0 ? (
                      `${payment.balance.toLocaleString("fr-FR")} Ar`
                    ) : (
                      <CheckCircle2 size={15} strokeWidth={2.2} />
                    )}
                  </div>

                  <div className="w-[90px] shrink-0">
                    <StatusPill status={payment.status} />
                  </div>

                  {/* Payer — uniquement pour Impayé / Partiel */}
                  <div className="w-[88px] shrink-0">
                    {payment.status !== "PAYE" ? (
                      <button
                        onClick={() => openPayModal(payment)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-primary-dark"
                      >
                        <Wallet size={12} strokeWidth={2.2} />
                        Payer
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-[11px] text-text-subtle">
                        <FileText size={12} strokeWidth={2} />
                        Soldé
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODALE — enregistrer un paiement */}
      {payingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={closePayModal}>
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-bold text-text">Enregistrer un paiement</div>
              <button
                onClick={closePayModal}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-text-subtle transition-colors hover:bg-surface-2 hover:text-text"
              >
                <X size={15} strokeWidth={2.2} />
              </button>
            </div>

            <div className="mt-1 text-[12.5px] text-text-muted">
              {payingRow.patient} — {payingRow.acte}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-[12.5px]">
              <span className="text-text-muted">Solde restant</span>
              <span className="font-bold text-red">{payingRow.balance.toLocaleString("fr-FR")} Ar</span>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-wide text-text-subtle">
                Montant à encaisser (Ar)
              </label>
              <input
                type="number"
                min={1}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border px-3 py-2 text-[14px] text-text outline-none transition-colors focus:border-primary"
                autoFocus
              />
            </div>

            <div className="mt-3.5">
              <label className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-wide text-text-subtle">
                Méthode de paiement
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border bg-white px-3 py-2 text-[14px] text-text outline-none transition-colors focus:border-primary"
              >
                {Object.entries(METHOD_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {payError && <div className="mt-3 text-[12.5px] text-red">{payError}</div>}

            <div className="mt-5 flex gap-2.5">
              <button
                onClick={closePayModal}
                disabled={paySubmitting}
                className="flex-1 rounded-lg border border-border py-2.5 text-[13px] font-semibold text-text-muted transition-colors hover:bg-surface disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={submitPayment}
                disabled={paySubmitting}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                {paySubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} strokeWidth={2.2} />}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================
// CARTE RÉSUMÉ (avec filigrane, cohérente avec le Dashboard)
// =========================

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