import { useState, useMemo, useEffect } from "react";
import type { Patient } from "../../types";

import { Avatar } from "../../components/Avatar";
import { NewConsultationForm } from "../../components/NewConsultationForm";
import { NewPatientForm } from "./NewPatientForm";
import { formatDate } from "../../utils/formatDate";
import { PatientRecord } from "./PatientRecord";
import { NewAppointmentForm } from "../../components/NewAppointmentForm";
import { Search, Users2, UserRound, FileDown, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import {
  getPatients,
  getPatient,
  createPatient,
  type ApiPatient,
} from "../../api/patients.api";

// Convertit un ApiPatient (retour brut du backend) en Patient (type utilisé dans l'UI)
function toPatient(patient: ApiPatient): Patient {
  const lastConsultation = patient.consultations?.[0];

  return {
    id: patient.id,
    name: `${patient.nom} ${patient.prenom}`,
    phone: patient.telephone,
    lastVisit: lastConsultation?.dateConsultation ?? patient.createdAt,
    balance: 0,
  };
}

export function PatientsSection({
  showNewPatient = false,
  onCloseNewPatient,
  openPatientId = null,
  onPatientOpened,
}: {
  showNewPatient?: boolean;
  onCloseNewPatient?: () => void;
  // ID du patient à sélectionner automatiquement (ex: venant du bouton "Ouvrir"
  // de AppointmentsSection, via l'état du parent commun).
  openPatientId?: number | null;
  // Appelé une fois l'ouverture automatique effectuée, pour que le parent
  // puisse remettre son état "openPatientId" à null (évite de re-déclencher
  // l'ouverture à chaque re-render).
  onPatientOpened?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Patient | null>(null);
  const [showConsult, setShowConsult] = useState(false);
  const [showAppointment, setShowAppointment] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const data = await getPatients();
        setPatients(data.map(toPatient));
      } catch (error) {
        console.error("Erreur chargement patients :", error);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  // Ouverture automatique d'un patient par ID (ex: depuis l'agenda / rendez-vous).
  useEffect(() => {
    if (openPatientId == null) return;

    // Cas 1 : le patient est déjà dans la liste chargée -> sélection immédiate.
    const found = patients.find((p) => p.id === openPatientId);
    if (found) {
      setSelected(found);
      onPatientOpened?.();
      return;
    }

    // Cas 2 : liste pas encore chargée, ou patient absent de la liste en mémoire
    // -> on va le chercher directement.
    if (loading) return; // attend la fin du chargement de la liste avant de conclure à une absence

    let cancelled = false;

    const fetchSingle = async () => {
      try {
        const apiPatient = await getPatient(openPatientId);
        if (cancelled) return;
        setSelected(toPatient(apiPatient));
      } catch (error) {
        console.error("Erreur chargement du patient à ouvrir :", error);
      } finally {
        if (!cancelled) onPatientOpened?.();
      }
    };

    fetchSingle();

    return () => {
      cancelled = true;
    };
  }, [openPatientId, patients, loading, onPatientOpened]);

  const filtered = useMemo(
    () =>
      patients.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.phone.includes(search),
      ),
    [search, patients],
  );

  // =========================
  // EXPORT PDF — liste des patients actuellement filtrée/affichée
  // =========================
  const exportPatientsToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("Liste des patients - DentalF", 14, 15);
    doc.setFontSize(10);
    doc.text(`Exporté le ${new Date().toLocaleDateString("fr-FR")}`, 14, 21);
    doc.text(`Total : ${filtered.length} patient${filtered.length !== 1 ? "s" : ""}`, 14, 26);

    autoTable(doc, {
      startY: 31,
      head: [["Nom", "Téléphone", "Dernière visite"]],
      body: filtered.map((p) => [p.name, p.phone, formatDate(p.lastVisit)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [14, 165, 165] }, // couleur proche de --primary
    });

    doc.save(`patients_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // =========================
  // EXPORT EXCEL — liste des patients actuellement filtrée/affichée
  // =========================
  const exportPatientsToExcel = () => {
    const rows = filtered.map((p) => ({
      Nom: p.name,
      Téléphone: p.phone,
      "Dernière visite": formatDate(p.lastVisit),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Patients");

    worksheet["!cols"] = [{ wch: 26 }, { wch: 18 }, { wch: 16 }];

    XLSX.writeFile(workbook, `patients_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (showNewPatient) {
    return (
      <NewPatientForm
        onBack={() => onCloseNewPatient?.()}
        onSave={async (payload) => {
          const created = await createPatient(payload);
          const patient = toPatient(created);

          setPatients((prev) => [patient, ...prev]);
          setSelected(patient);

          onCloseNewPatient?.();
        }}
      />
    );
  }
  if (showAppointment && selected) {
    return (
      <NewAppointmentForm
        patient={selected}
        onBack={() => setShowAppointment(false)}
      />
    );
  }

  if (showConsult && selected) {
    return (
      <NewConsultationForm
        patient={selected}
        onBack={() => setShowConsult(false)}
      />
    );
  }

  return (
    <div className="grid h-[calc(100vh-130px)] grid-cols-[300px_1fr] gap-4">
      {/* Left panel */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className="px-3.5 pb-2.5 pt-3.5">
          <div className="relative">
            <Search
              size={14}
              strokeWidth={2}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrer les patients…"
              className="w-full rounded-lg border-[1.5px] border-border bg-surface py-2 pl-8 pr-2.5 text-[13px] text-text outline-none transition-colors focus:border-primary focus:bg-white"
            />
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11.5px] text-text-subtle">
              <Users2 size={12} strokeWidth={2} />
              {filtered.length} patient{filtered.length !== 1 ? "s" : ""}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={exportPatientsToExcel}
                disabled={filtered.length === 0}
                title="Exporter en Excel"
                className="flex h-6 w-6 items-center justify-center rounded-md text-text-subtle transition-colors hover:bg-surface-2 hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FileSpreadsheet size={13} strokeWidth={2.2} />
              </button>
              <button
                onClick={exportPatientsToPDF}
                disabled={filtered.length === 0}
                title="Exporter en PDF"
                className="flex h-6 w-6 items-center justify-center rounded-md text-text-subtle transition-colors hover:bg-surface-2 hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FileDown size={13} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-1.5 pb-1.5">
          {filtered.map((p) => {
            const isActive = selected?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className={`flex w-full items-center gap-2.5 rounded-xl border-l-[3px] px-3 py-2.5 text-left transition-colors ${
                  isActive
                    ? "border-l-primary bg-primary-light"
                    : "border-l-transparent hover:bg-surface"
                }`}
              >
                <Avatar name={p.name} size={34} />
                <div className="min-w-0 flex-1">
                  <div
                    className={`truncate text-[13.5px] ${
                      isActive ? "font-semibold text-primary-dark" : "font-medium text-text"
                    }`}
                  >
                    {p.name}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-text-subtle">
                    Dernière visite: {formatDate(p.lastVisit)}
                  </div>
                </div>
                {p.balance > 0 && <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-red" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div>
        {selected ? (
          <PatientRecord
            patient={selected}
            onBack={() => setSelected(null)}
            onNewConsult={() => setShowConsult(true)}
            onNewAppointment={() => setShowAppointment(true)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-white text-text-subtle">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2">
              <UserRound size={30} strokeWidth={1.5} className="text-text-subtle" />
            </div>
            <div className="text-sm font-medium">Sélectionnez un patient</div>
          </div>
        )}
      </div>
    </div>
  );
}