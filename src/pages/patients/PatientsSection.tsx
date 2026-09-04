import { useState, useMemo, useEffect } from "react";
import type { Patient } from "../../types";

import { Avatar } from "../../components/Avatar";
import { NewConsultationForm } from "../../components/NewConsultationForm";
import { NewPatientForm } from "./NewPatientForm";
import { formatDate } from "../../utils/formatDate";
import { PatientRecord } from "./PatientRecord";

import {
  getPatients,
  getPatient,
  createPatient,
  type ApiPatient,
} from "../../api/patients.api";

export function PatientsSection({
  showNewPatient = false,
  onCloseNewPatient,
}: {
  showNewPatient?: boolean;
  onCloseNewPatient?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Patient | null>(null);
  const [showConsult, setShowConsult] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const data = await getPatients();

        const formattedPatients: Patient[] = data.map((patient: ApiPatient) => {
          const lastConsultation = patient.consultations?.[0];

          return {
            id: patient.id,

            name: `${patient.nom} ${patient.prenom}`,

            phone: patient.telephone,

            lastVisit: lastConsultation?.dateConsultation ?? patient.createdAt,

            balance: 0,
          };
        });

        setPatients(formattedPatients);
      } catch (error) {
        console.error("Erreur chargement patients :", error);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  const filtered = useMemo(
    () =>
      patients.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.phone.includes(search),
      ),
    [search, patients],
  );

  if (showNewPatient) {
    return (
      <NewPatientForm
        onBack={() => onCloseNewPatient?.()}
        onSave={async (payload) => {
          const created = await createPatient(payload);

          const patient: Patient = {
            id: created.id,
            name: `${created.nom} ${created.prenom}`,
            phone: created.telephone,
            lastVisit: created.createdAt,
            balance: 0,
          };

          setPatients((prev) => [patient, ...prev]);
          setSelected(patient);

          onCloseNewPatient?.();
        }}
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
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        gap: 16,
        height: "calc(100vh - 130px)",
      }}
    >
      {/* Left panel */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ padding: "14px 14px 10px" }}>
          <div style={{ position: "relative" }}>
            <svg
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9CA3AF",
              }}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrer les patients…"
              style={{
                width: "100%",
                padding: "8px 10px 8px 32px",
                border: "1.5px solid #E5E7EB",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "'Inter', sans-serif",
                background: "#F8F9FA",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#0EA5A5")}
              onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
            />
          </div>
          <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 8 }}>
            {filtered.length} patient{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "11px 14px",
                width: "100%",
                textAlign: "left",
                border: "none",
                cursor: "pointer",
                background: selected?.id === p.id ? "#E0F5F5" : "transparent",
                borderLeft:
                  selected?.id === p.id
                    ? "3px solid #0EA5A5"
                    : "3px solid transparent",
                fontFamily: "'Inter', sans-serif",
                transition: "all 0.1s",
              }}
              onMouseEnter={(e) => {
                if (selected?.id !== p.id)
                  (e.currentTarget as HTMLElement).style.background = "#F9FAFB";
              }}
              onMouseLeave={(e) => {
                if (selected?.id !== p.id)
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
              }}
            >
              <Avatar name={p.name} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: "#1F2937",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.name}
                </div>
                <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 1 }}>
                  Dernière visite: {formatDate(p.lastVisit)}
                </div>
              </div>
              {p.balance > 0 && (
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#EF4444",
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div>
        {selected ? (
          <PatientRecord
            patient={selected}
            onBack={() => setSelected(null)}
            onNewConsult={() => setShowConsult(true)}
          />
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #E5E7EB",
              color: "#9CA3AF",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D1D5DB"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            <div style={{ fontSize: 14 }}>Sélectionnez un patient</div>
          </div>
        )}
      </div>
    </div>
  );
}
