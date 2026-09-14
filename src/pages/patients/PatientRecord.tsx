import { useEffect, useState } from "react";
import type { Patient, PatientTab } from "../../types";

import { Avatar } from "../../components/Avatar";
import { StatusBadge } from "../../components/StatusBadge";
import { ApptStatusBadge } from "../../components/ApptStatusBadge";
import { formatDate } from "../../utils/formatDate";
import { Odontogram } from "../../components/Odontogram";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  getPatient,
  getOdontogrammeByPatient,
  updateToothNote,
  type ApiPatient,
  type ApiConsultation,
  type ApiToothNote,
  type ToothStatus,
} from "../../api/patients.api";

import {
  ArrowLeft,
  Phone,
  Mail,
  Cake,
  MapPin,
  Plus,
  CalendarPlus,
  AlertCircle,
  CheckCircle2,
  LayoutGrid,
  Stethoscope,
  Wallet,
  CalendarDays,
  Grid3x3,
  Receipt,
  CreditCard,
  Clock,
  FileDown,
} from "lucide-react";

// =====================================================
// PROPS
// =====================================================
interface PatientRecordProps {
  patient: Patient;
  onBack: () => void;
  onNewConsult: () => void;
  onNewAppointment: () => void;
}

// =====================================================
// FORMAT MONNAIE
// =====================================================

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value) + " Ar";
}

// =====================================================
// TABS (config avec icônes)
// =====================================================

const TABS: { id: PatientTab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Aperçu", icon: <LayoutGrid size={14} strokeWidth={2.2} /> },
  { id: "consultations", label: "Consultations", icon: <Stethoscope size={14} strokeWidth={2.2} /> },
  { id: "payments", label: "Paiements", icon: <Wallet size={14} strokeWidth={2.2} /> },
  { id: "appointments", label: "Rendez-vous", icon: <CalendarDays size={14} strokeWidth={2.2} /> },
  { id: "odontogramme", label: "Odontogramme", icon: <Grid3x3 size={14} strokeWidth={2.2} /> },
];

// =====================================================
// COMPONENT
// =====================================================

export function PatientRecord({ patient, onBack, onNewConsult, onNewAppointment }: PatientRecordProps) {
  const [tab, setTab] = useState<PatientTab>("overview");
  const [data, setData] = useState<ApiPatient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Remarques par dent (odontogramme) — état séparé pour pouvoir les mettre
  // à jour localement sans recharger tout le patient à chaque sauvegarde.
  const [toothNotes, setToothNotes] = useState<ApiToothNote[]>([]);

  // ===================================================
  // CHARGER LE PATIENT
  // ===================================================

  useEffect(() => {
    const loadPatient = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getPatient(patient.id);
        setData(result);

        // L'odontogramme est chargé séparément : il agrège, pour chaque dent,
        // la ligne la plus récente parmi toutes les consultations du patient.
        try {
          const notes = await getOdontogrammeByPatient(patient.id);
          setToothNotes(notes);
        } catch (odontoErr) {
          console.error("Erreur chargement odontogramme :", odontoErr);
          // On n'affiche pas d'erreur bloquante pour ça : le reste de la
          // fiche patient reste utilisable même si l'odontogramme échoue.
          setToothNotes([]);
        }
      } catch (err) {
        console.error("Erreur chargement patient :", err);
        setError("Impossible de charger les informations du patient.");
      } finally {
        setLoading(false);
      }
    };

    loadPatient();
  }, [patient.id]);

  // ===================================================
  // SAUVEGARDER UNE REMARQUE DE DENT
  // ===================================================

  const handleSaveToothNote = async (
    numeroDent: number,
    note: string,
    statut: ToothStatus,
    consultationId: number
  ) => {
    const saved = await updateToothNote(patient.id, numeroDent, note, statut, consultationId);

    setToothNotes((prev) => {
      const withoutThisTooth = prev.filter((n) => n.numeroDent !== numeroDent);
      // Si la remarque est vide ET que le statut est "sain", on la retire
      // simplement de la liste (dent redevenue neutre).
      if (!saved.note && (!saved.statut || saved.statut === "sain")) return withoutThisTooth;
      return [...withoutThisTooth, saved];
    });
  };

  // ===================================================
  // EXPORT PDF — fiche complète du patient (SANS odontogramme)
  // ===================================================

  const exportPatientToPDF = () => {
    if (!data) return;

    const consultationsList = data.consultations ?? [];
    const rendezVousList = data.rendezVous ?? [];

    const totalPaidPdf = consultationsList.reduce((total, consultation) => {
      const payments = consultation.paiements ?? [];
      return total + payments.reduce((sum, payment) => sum + payment.montant, 0);
    }, 0);

    const totalAmountPdf = consultationsList.reduce((total, consultation) => {
      const actes = consultation.actes ?? [];
      return total + actes.reduce((sum, acte) => sum + acte.prix, 0);
    }, 0);

    const totalOwedPdf = Math.max(totalAmountPdf - totalPaidPdf, 0);

    const doc = new jsPDF();
    let y = 15;

    // --- En-tête ---
    doc.setFontSize(15);
    doc.text(`Fiche patient - ${data.nom} ${data.prenom}`, 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Exporté le ${new Date().toLocaleDateString("fr-FR")}`, 14, y);
    doc.setTextColor(0);
    y += 8;

    // --- Informations générales ---
    doc.setFontSize(11);
    doc.text("Informations", 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 1 },
      body: [
        ["Téléphone", data.telephone || "—"],
        ["Email", data.email || "—"],
        ["Adresse", data.adresse || "—"],
        ["Date de naissance", data.dateNaissance ? formatDate(data.dateNaissance) : "—"],
        ["Consultations", String(consultationsList.length)],
      ],
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // --- Résumé financier ---
    doc.setFontSize(11);
    doc.text("Résumé financier", 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [["Total des actes", "Total payé", "Reste dû"]],
      body: [[formatMoney(totalAmountPdf), formatMoney(totalPaidPdf), formatMoney(totalOwedPdf)]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [14, 165, 165] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // --- Consultations ---
    doc.setFontSize(11);
    doc.text("Consultations", 14, y);
    y += 2;
    if (consultationsList.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Date", "Motif", "Actes", "Montant", "Payé", "Reste"]],
        body: consultationsList.map((c) => {
          const actes = c.actes ?? [];
          const payments = c.paiements ?? [];
          const montantActes = actes.reduce((sum, acte) => sum + acte.prix, 0);
          const montantPaye = payments.reduce((sum, p) => sum + p.montant, 0);
          const reste = Math.max(montantActes - montantPaye, 0);
          return [
            formatDate(c.dateConsultation),
            c.motifConsultation || "—",
            actes.length > 0 ? actes.map((a) => a.nomActe).join(", ") : "—",
            formatMoney(montantActes),
            formatMoney(montantPaye),
            formatMoney(reste),
          ];
        }),
        styles: { fontSize: 8.5 },
        headStyles: { fillColor: [14, 165, 165] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(140);
      doc.text("Aucune consultation enregistrée.", 14, y + 5);
      doc.setTextColor(0);
      y += 12;
    }

    // --- Paiements ---
    if (y > 260) {
      doc.addPage();
      y = 15;
    }
    doc.setFontSize(11);
    doc.text("Paiements", 14, y);
    y += 2;

    const allPayments = consultationsList.flatMap((c) =>
      (c.paiements ?? []).map((p) => ({
        date: p.datePaiement,
        consultationId: c.id,
        montant: p.montant,
        mode: p.modePaiement || "—",
      })),
    );

    if (allPayments.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Date", "Consultation", "Montant", "Méthode"]],
        body: allPayments.map((p) => [
          formatDate(p.date),
          `#${p.consultationId}`,
          formatMoney(p.montant),
          p.mode,
        ]),
        styles: { fontSize: 8.5 },
        headStyles: { fillColor: [14, 165, 165] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(140);
      doc.text("Aucun paiement enregistré.", 14, y + 5);
      doc.setTextColor(0);
      y += 12;
    }

    // --- Rendez-vous ---
    if (y > 260) {
      doc.addPage();
      y = 15;
    }
    doc.setFontSize(11);
    doc.text("Rendez-vous", 14, y);
    y += 2;

    if (rendezVousList.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Date", "Heure", "Motif", "Statut"]],
        body: rendezVousList.map((rdv) => [
          formatDate(rdv.date),
          rdv.heure || "—",
          rdv.motif || "Rendez-vous",
          rdv.statut,
        ]),
        styles: { fontSize: 8.5 },
        headStyles: { fillColor: [14, 165, 165] },
      });
    } else {
      doc.setFontSize(9);
      doc.setTextColor(140);
      doc.text("Aucun rendez-vous enregistré.", 14, y + 5);
      doc.setTextColor(0);
    }

    doc.save(`fiche_${data.nom}_${data.prenom}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border border-border bg-white text-sm text-text-subtle">
        <div className="flex items-center gap-2.5">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
          Chargement du patient...
        </div>
      </div>
    );
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (error || !data) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-white">
        <AlertCircle size={28} strokeWidth={1.5} className="text-red" />
        <div className="text-sm text-red">{error || "Patient introuvable."}</div>
        <button
          onClick={onBack}
          className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-text transition-colors hover:bg-surface"
        >
          Retour
        </button>
      </div>
    );
  }

  // ===================================================
  // DONNEES
  // ===================================================

  const consultations = data.consultations ?? [];
  const rendezVous = data.rendezVous ?? [];

  // ===================================================
  // CALCUL FINANCES
  // ===================================================

  const totalPaid = consultations.reduce((total, consultation) => {
    const payments = consultation.paiements ?? [];
    return total + payments.reduce((sum, payment) => sum + payment.montant, 0);
  }, 0);

  const totalAmount = consultations.reduce((total, consultation) => {
    const actes = consultation.actes ?? [];
    return total + actes.reduce((sum, acte) => sum + acte.prix, 0);
  }, 0);

  const totalOwed = Math.max(totalAmount - totalPaid, 0);
  const collectionRate = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="border-b border-border-soft bg-surface/60 px-6 py-5">
        <div className="flex items-start gap-4">
          <button
            onClick={onBack}
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            <ArrowLeft size={16} strokeWidth={2} />
          </button>

          <Avatar name={`${data.nom} ${data.prenom}`} size={52} />

          <div className="min-w-0 flex-1">
            <div className="text-lg font-bold text-text">
              {data.nom} {data.prenom}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <InfoPill icon={<Phone size={11.5} strokeWidth={2.2} />}>{data.telephone}</InfoPill>
              {data.email && <InfoPill icon={<Mail size={11.5} strokeWidth={2.2} />}>{data.email}</InfoPill>}
              {data.adresse && <InfoPill icon={<MapPin size={11.5} strokeWidth={2.2} />}>{data.adresse}</InfoPill>}
              {data.dateNaissance && (
                <InfoPill icon={<Cake size={11.5} strokeWidth={2.2} />}>
                  Né(e) le {formatDate(data.dateNaissance)}
                </InfoPill>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            {totalOwed > 0 ? (
              <div className="flex items-center gap-1.5 rounded-full bg-red-light px-3.5 py-1.5 text-[12.5px] font-semibold text-red">
                <AlertCircle size={13} strokeWidth={2.2} />
                Solde dû : {formatMoney(totalOwed)}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full bg-green-light px-3.5 py-1.5 text-[12.5px] font-semibold text-green">
                <CheckCircle2 size={13} strokeWidth={2.2} />À jour
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={exportPatientToPDF}
                title="Exporter la fiche patient en PDF"
                className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-[12.5px] font-medium text-text transition-colors hover:border-primary hover:text-primary-dark"
              >
                <FileDown size={14} strokeWidth={2.2} />
                Export PDF
              </button>
              <button
                onClick={onNewAppointment}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-[12.5px] font-medium text-text transition-colors hover:border-primary hover:text-primary-dark"
              >
                <CalendarPlus size={14} strokeWidth={2.2} />
                Nouveau RDV
              </button>
              <button
                onClick={onNewConsult}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-[0_3px_10px_rgba(14,165,165,0.35)] transition-colors hover:bg-primary-dark"
              >
                <Plus size={14} strokeWidth={2.5} />
                Ajouter consultation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          TABS — segmented control
      ================================================= */}

      <div className="border-b border-border-soft px-6 py-3">
        <div className="inline-flex gap-1 rounded-full bg-surface-2 p-1">
          {TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${
                  isActive ? "bg-white text-primary-dark shadow-sm" : "text-text-muted hover:text-text"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="max-h-[calc(100vh-380px)] overflow-y-auto px-6 py-5">
        {/* =================================================
            APERCU
        ================================================= */}

        {tab === "overview" && (
          <div className="flex flex-col gap-5">
            {/* KPIs finances */}
            <div className="grid grid-cols-3 gap-3.5">
              <MiniStat icon={<Receipt size={15} strokeWidth={2.2} />} color="#0EA5A5" label="Total des actes" value={formatMoney(totalAmount)} />
              <MiniStat icon={<Wallet size={15} strokeWidth={2.2} />} color="#10B981" label="Total payé" value={formatMoney(totalPaid)} />
              <MiniStat
                icon={<AlertCircle size={15} strokeWidth={2.2} />}
                color={totalOwed > 0 ? "#EF4444" : "#10B981"}
                label="Reste dû"
                value={formatMoney(totalOwed)}
              />
            </div>

            {/* Barre de recouvrement */}
            {totalAmount > 0 && (
              <div className="rounded-xl border border-border-soft bg-surface/60 px-4 py-3.5">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-medium text-text-muted">Taux de recouvrement</span>
                  <span className="font-bold text-primary">{collectionRate}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${collectionRate}%` }}
                  />
                </div>
              </div>
            )}

            {/* Informations */}
            <div className="rounded-xl border border-border-soft bg-surface/60 p-4">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
                Informations
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <InfoRow label="Téléphone" value={data.telephone} />
                <InfoRow label="Email" value={data.email || "—"} />
                <InfoRow label="Adresse" value={data.adresse || "—"} />
                <InfoRow
                  label="Date de naissance"
                  value={data.dateNaissance ? formatDate(data.dateNaissance) : "—"}
                />
                <InfoRow
                  label="Dernière visite"
                  value={consultations.length > 0 ? formatDate(consultations[0].dateConsultation) : "Aucune"}
                />
                <InfoRow label="Consultations" value={String(consultations.length)} />
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            CONSULTATIONS
        ================================================= */}

        {tab === "consultations" && (
          <div className="flex flex-col gap-3">
            {consultations.length === 0 && <EmptyState text="Aucune consultation enregistrée." />}

            {consultations.map((consultation: ApiConsultation) => {
              const actes = consultation.actes ?? [];
              const payments = consultation.paiements ?? [];
              const montantActes = actes.reduce((sum, acte) => sum + acte.prix, 0);
              const montantPaye = payments.reduce((sum, paiement) => sum + paiement.montant, 0);
              const reste = Math.max(montantActes - montantPaye, 0);
              const status = reste === 0 ? "Paid" : montantPaye > 0 ? "Partial" : "Unpaid";
              const barColor = status === "Paid" ? "#10B981" : status === "Partial" ? "#F59E0B" : "#EF4444";

              return (
                <div
                  key={consultation.id}
                  className="flex gap-3.5 rounded-xl border border-border p-4 transition-shadow hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)]"
                  style={{ borderLeftColor: barColor, borderLeftWidth: 3 }}
                >
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <div className="text-[13.5px] font-semibold text-text">
                        {actes.length > 0 ? actes.map((acte) => acte.nomActe).join(", ") : "Consultation"}
                      </div>
                      <StatusBadge status={status} />
                    </div>

                    <div className="mb-1.5 flex items-center gap-1.5 text-[12.5px] text-text-muted">
                      <Clock size={12} strokeWidth={2} />
                      {formatDate(consultation.dateConsultation)} — {consultation.motifConsultation}
                    </div>

                    {consultation.observation && (
                      <div className="text-xs italic text-text-subtle">{consultation.observation}</div>
                    )}

                    {actes.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {actes.map((acte) => (
                          <span
                            key={acte.id}
                            className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[11.5px] text-text-muted"
                          >
                            {acte.numeroDent ? `Dent ${acte.numeroDent} — ` : ""}
                            {acte.nomActe}
                            <strong className="text-text">{formatMoney(acte.prix)}</strong>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-4 border-t border-border-soft pt-2.5 text-[12.5px]">
                      <span className="text-text-muted">
                        Total : <strong className="text-text">{formatMoney(montantActes)}</strong>
                      </span>
                      <span className="text-text-muted">
                        Payé : <strong className="text-green">{formatMoney(montantPaye)}</strong>
                      </span>
                      {reste > 0 && (
                        <span className="text-text-muted">
                          Reste : <strong className="text-red">{formatMoney(reste)}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =================================================
            PAIEMENTS
        ================================================= */}

        {tab === "payments" && (
          <div className="flex flex-col gap-2">
            {consultations.every((c) => (c.paiements ?? []).length === 0) && (
              <EmptyState text="Aucun paiement enregistré." />
            )}

            {consultations.map((consultation) =>
              (consultation.paiements ?? []).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center gap-3.5 rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-border hover:bg-surface/60"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-light text-green">
                    <CreditCard size={15} strokeWidth={2.2} />
                  </div>

                  <div className="w-24 shrink-0 font-mono text-[12px] text-text-subtle">
                    {formatDate(payment.datePaiement)}
                  </div>

                  <div className="flex-1 text-[13px] text-text">
                    Paiement consultation #{consultation.id}
                    {payment.modePaiement && (
                      <span className="ml-2 text-text-subtle">({payment.modePaiement})</span>
                    )}
                  </div>

                  <div className="text-[13.5px] font-bold text-green">{formatMoney(payment.montant)}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* =================================================
            RENDEZ-VOUS
        ================================================= */}

        {tab === "appointments" && (
          <div className="flex flex-col gap-2">
            {rendezVous.length === 0 ? (
              <EmptyState text="Aucun rendez-vous enregistré." />
            ) : (
              rendezVous.map((rdv) => (
                <div
                  key={rdv.id}
                  className="flex items-center gap-3.5 rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-border hover:bg-surface/60"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                    <CalendarDays size={15} strokeWidth={2.2} />
                  </div>

                  <div className="w-24 shrink-0 font-mono text-[12px] text-text-subtle">{formatDate(rdv.date)}</div>
                  <div className="w-12 shrink-0 font-mono text-[12.5px] text-text-muted">{rdv.heure}</div>

                  <div className="flex-1 text-[13.5px] text-text">{rdv.motif || "Rendez-vous"}</div>

                  <ApptStatusBadge status={rdv.statut} />
                </div>
              ))
            )}
          </div>
        )}

        {/* =================================================
            ODONTOGRAMME
        ================================================= */}

        {tab === "odontogramme" && (
          <Odontogram
            notes={toothNotes}
            consultations={consultations}
            onSaveNote={handleSaveToothNote}
          />
        )}
      </div>
    </div>
  );
}

// =====================================================
// SOUS-COMPOSANTS
// =====================================================

function InfoPill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[12px] text-text-muted">
      {icon}
      {children}
    </span>
  );
}

function MiniStat({
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
    <div className="rounded-xl border border-border-soft bg-surface/60 p-3.5">
      <div className="flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: `${color}18`, color }}
        >
          {icon}
        </div>
        <div className="text-[11.5px] font-medium text-text-muted">{label}</div>
      </div>
      <div className="mt-2 text-[15px] font-bold text-text">{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-[120px] shrink-0 text-[12.5px] text-text-muted">{label}</span>
      <span className="truncate text-[12.5px] font-medium text-text">{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="py-10 text-center text-[13.5px] text-text-subtle">{text}</div>;
}