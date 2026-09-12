import { useState } from "react";
import type { NavSection } from "./types";

import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";

import { Dashboard } from "./pages/Dashboard";
import { PatientsSection } from "./pages/patients/PatientsSection";
import { AppointmentsSection } from "./pages/AppointmentsSection";
import { NewAppointmentForm } from "./components/NewAppointmentForm";
import { BillingSection } from "./pages/billing/BillingSection";
import { PaymentsSection } from "./pages/PaymentsSection";
import { SettingsSection } from "./pages/SettingsSection";

// Formate une Date JS en "YYYY-MM-DD", format attendu par l'input type="date"
// du formulaire NewAppointmentForm.
function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function App() {
  const [nav, setNav] = useState<NavSection>("dashboard");

  const [search, setSearch] = useState("");

  const [newPatientOpen, setNewPatientOpen] = useState(false);

  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);

  // =========================
  // PRÉ-REMPLISSAGE DATE/HEURE DU NOUVEAU RENDEZ-VOUS
  // ---------------------------------------------------
  // Alimenté par AppointmentsSection quand l'utilisateur clique sur
  // "Nouveau rendez-vous" depuis un créneau libre du planning : la date
  // et l'heure sont déjà connues, donc on les transmet directement au
  // formulaire pour que l'utilisateur n'ait pas à les ressaisir.
  // Reste à null quand le formulaire est ouvert depuis la TopBar (aucun
  // créneau précis choisi à l'avance).
  // =========================
  const [newAppointmentPrefill, setNewAppointmentPrefill] = useState<{
    date: string;
    heure: string;
  } | null>(null);

  // =========================
  // OUVRIR UN PATIENT DEPUIS UNE AUTRE SECTION
  // ---------------------------------------------------
  // Alimenté par AppointmentsSection (bouton "Ouvrir" sur un
  // rendez-vous) : on bascule sur la section "patients" et on
  // indique quel patient sélectionner. PatientsSection se charge
  // ensuite de le trouver (ou de le charger) et de l'afficher.
  // =========================
  const [openPatientId, setOpenPatientId] = useState<number | null>(null);

  const handleOpenPatient = (patientId: number) => {
    setOpenPatientId(patientId);
    setNav("patients");
    // On ferme les modales éventuellement ouvertes pour éviter
    // qu'elles restent affichées par-dessus la fiche patient.
    setNewPatientOpen(false);
    setNewAppointmentOpen(false);
  };

  // =========================
  // NOUVEAU PATIENT
  // =========================
  const handleNewPatient = () => {
    setNav("patients");
    setNewPatientOpen(true);
    setNewAppointmentOpen(false);
  };

  // =========================
  // NOUVEAU RENDEZ-VOUS (depuis la TopBar — aucun créneau pré-choisi)
  // ---------------------------------------------------
  // Bug corrigé : on bascule maintenant sur la section
  // "appointments" avant d'ouvrir le formulaire, comme le
  // fait déjà handleNewPatient pour "patients". Sans ça, le
  // formulaire s'affichait par-dessus n'importe quelle page
  // active (ex: le Dashboard).
  // =========================
  const handleNewAppointment = () => {
    setNewAppointmentPrefill(null);
    setNav("appointments");
    setNewAppointmentOpen(true);
    setNewPatientOpen(false);
  };

  // =========================
  // NOUVEAU RENDEZ-VOUS DEPUIS UN CRÉNEAU LIBRE DU PLANNING
  // ---------------------------------------------------
  // Appelé par AppointmentsSection (prop onCreateAppointment) quand
  // l'utilisateur clique sur "Nouveau rendez-vous" sur un créneau libre.
  // La date et l'heure du créneau sont déjà connues : on les stocke pour
  // pré-remplir le formulaire.
  // =========================
  const handleCreateAppointmentFromSlot = (date: Date, hour: string) => {
    setNewAppointmentPrefill({ date: toDateInputValue(date), heure: hour });
    setNewAppointmentOpen(true);
    setNewPatientOpen(false);
  };

  // =========================
  // FERMER NOUVEAU RENDEZ-VOUS
  // =========================
  const handleCloseNewAppointment = () => {
    setNewAppointmentOpen(false);
    setNewAppointmentPrefill(null);
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#fafafa",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* SIDEBAR */}
      <Sidebar
        active={nav}
        onNav={(section) => {
          setNav(section);
          setNewPatientOpen(false);
          setNewAppointmentOpen(false);
        }}
      />

      <div
        style={{
          marginLeft: 220,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {/* TOP BAR */}
        <TopBar
          onNewPatient={handleNewPatient}
          onNewAppointment={handleNewAppointment}
          searchValue={search}
          onSearch={setSearch}
        />

        <main
          style={{
            marginTop: 60,
            padding: "28px 32px",
            flex: 1,
            overflowY: "auto",
          }}
        >
          {/* DASHBOARD */}
          {nav === "dashboard" && (
            <Dashboard onNav={setNav} />
          )}

          {/* PATIENTS */}
          {nav === "patients" && (
            <PatientsSection
              showNewPatient={newPatientOpen}
              onCloseNewPatient={() => {
                setNewPatientOpen(false);
              }}
              openPatientId={openPatientId}
              onPatientOpened={() => setOpenPatientId(null)}
            />
          )}

          {/* APPOINTMENTS */}
          {/*
            Bug corrigé : NewAppointmentForm était rendu en
            dehors de <main>, comme frère du conteneur flex
            principal — il s'affichait donc à côté de la page
            active quelle qu'elle soit (voir capture : à côté
            du Dashboard). Il est maintenant rendu en modal,
            uniquement à l'intérieur du bloc "appointments".
          */}
          {nav === "appointments" && (
            <>
              <AppointmentsSection
                onOpenPatient={handleOpenPatient}
                onCreateAppointment={handleCreateAppointmentFromSlot}
              />

              {newAppointmentOpen && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(17, 24, 39, 0.45)",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    padding: "60px 20px",
                    overflowY: "auto",
                    zIndex: 50,
                  }}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      handleCloseNewAppointment();
                    }
                  }}
                >
                  <div style={{ width: "100%", maxWidth: 760 }}>
                    <NewAppointmentForm
                      initialDate={newAppointmentPrefill?.date ?? ""}
                      initialHour={newAppointmentPrefill?.heure ?? ""}
                      onBack={handleCloseNewAppointment}
                      onSaved={handleCloseNewAppointment}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* BILLING */}
          {nav === "billing" && (
            <BillingSection />
          )}

          {/* PAYMENTS */}
          {nav === "payments" && (
            <PaymentsSection />
          )}

          {/* SETTINGS */}
          {nav === "settings" && (
            <SettingsSection />
          )}
        </main>
      </div>
    </div>
  );
}