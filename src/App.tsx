import { useState } from "react";
import type { NavSection } from "./types";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { Dashboard } from "./pages/Dashboard";
import { PatientsSection } from "./pages/patients/PatientsSection";
import { AppointmentsSection } from "./pages/AppointmentsSection";
import { BillingSection } from "./pages/billing/BillingSection";
import { PaymentsSection } from "./pages/PaymentsSection";
import { SettingsSection } from "./pages/SettingsSection";

export default function App() {
  const [nav, setNav] = useState<NavSection>("dashboard");
  const [search, setSearch] = useState("");
  const [newPatientOpen, setNewPatientOpen] = useState(false);

  const handleNewPatient = () => {
    setNav("patients");
    setNewPatientOpen(true);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#e2e2e2", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar active={nav} onNav={setNav} />

      <div style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <TopBar onNewPatient={handleNewPatient} searchValue={search} onSearch={setSearch} />

        <main style={{ marginTop: 60, padding: "28px 32px", flex: 1, overflowY: "auto" }}>
          {nav === "dashboard" && <Dashboard onNav={setNav} />}
          {nav === "patients" && (
            <PatientsSection
              showNewPatient={newPatientOpen}
              onCloseNewPatient={() => setNewPatientOpen(false)}
            />
          )}
          {nav === "appointments" && <AppointmentsSection />}
          {nav === "billing" && <BillingSection />}
          {nav === "settings" && <SettingsSection />}
        </main>
      </div>
    </div>
  );
}