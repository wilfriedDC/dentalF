import { useEffect, useState } from "react";
import type { Patient } from "../types";

import {
  getPatients,
  type ApiPatient,
} from "../api/patients.api";

import { createRendezVous } from "../api/rendezvous.api";

// =====================================================
// PROPS
// =====================================================

interface NewAppointmentFormProps {
  patient?: Patient;
  initialDate?: string;
  initialHour?: string;
  initialMotif?: string;
  onBack: () => void;
  onSaved?: () => void;
}

// =====================================================
// COMPONENT
// =====================================================

export function NewAppointmentForm({
  patient,
  initialDate = "",
  initialHour = "",
  initialMotif = "",
  onBack,
  onSaved,
}: NewAppointmentFormProps) {
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(
    patient ? String(patient.id) : ""
  );

  const [date, setDate] = useState(initialDate);
  const [heure, setHeure] = useState(initialHour);
  const [motif, setMotif] = useState(initialMotif);

  const [loadingPatients, setLoadingPatients] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ===================================================
  // SYNCHRONISER LE FORMULAIRE QUAND LES PROPS CHANGENT
  // ---------------------------------------------------
  // Bug corrigé : useState ne lit ses props qu'au premier
  // rendu. Si ce formulaire est réutilisé (même instance)
  // pour un autre patient/créneau sans être démonté, les
  // anciennes valeurs restaient affichées. On resynchronise
  // explicitement à chaque changement de prop.
  // ===================================================

  useEffect(() => {
    setSelectedPatientId(patient ? String(patient.id) : "");
  }, [patient]);

  useEffect(() => {
    setDate(initialDate);
  }, [initialDate]);

  useEffect(() => {
    setHeure(initialHour);
  }, [initialHour]);

  useEffect(() => {
    setMotif(initialMotif);
  }, [initialMotif]);

  // ===================================================
  // CHARGER LES PATIENTS
  // ===================================================

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoadingPatients(true);

        const data = await getPatients();

        setPatients(data);
      } catch (err) {
        console.error(
          "Erreur chargement patients :",
          err
        );

        setError(
          "Impossible de charger la liste des patients."
        );
      } finally {
        setLoadingPatients(false);
      }
    };

    loadPatients();
  }, []);

  // ===================================================
  // ENREGISTRER
  // ===================================================

  const handleSave = async () => {
    setError("");

    // Patient obligatoire
    if (!selectedPatientId) {
      setError("Veuillez sélectionner un patient.");
      return;
    }

    // Date obligatoire
    if (!date) {
      setError("Veuillez sélectionner une date.");
      return;
    }

    // Heure obligatoire
    if (!heure) {
      setError("Veuillez sélectionner une heure.");
      return;
    }

    try {
      setSaving(true);

      await createRendezVous({
        patientId: Number(selectedPatientId),
        date,
        heure,
        motif: motif.trim() || undefined,
        statut: "PLANIFIE",
      });

      onSaved?.();

      onBack();
    } catch (err) {
      console.error(
        "Erreur création rendez-vous :",
        err
      );

      setError(
        "Impossible d'enregistrer le rendez-vous."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // PATIENT SÉLECTIONNÉ
  // ===================================================

  const selectedPatient = patients.find(
    (p) => p.id === Number(selectedPatientId)
  );

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #E5E7EB",
        overflow: "hidden",
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid #F3F4F6",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#6B7280",
            padding: 4,
            display: "flex",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#1F2937",
            }}
          >
            Nouveau rendez-vous
          </div>

          <div
            style={{
              fontSize: 12.5,
              color: "#9CA3AF",
              marginTop: 3,
            }}
          >
            Planifier un rendez-vous pour un patient
          </div>
        </div>
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div
        style={{
          padding: "24px",
          maxWidth: 700,
        }}
      >
        {/* =================================================
            PATIENT
        ================================================= */}

        <div style={{ marginBottom: 22 }}>
          <label
            style={{
              display: "block",
              fontSize: 12.5,
              fontWeight: 600,
              color: "#374151",
              marginBottom: 7,
            }}
          >
            Patient *
          </label>

          {patient ? (
            // Patient déjà sélectionné
            <div
              style={{
                background: "#F8F9FA",
                borderRadius: 10,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#1F2937",
                }}
              >
                {patient.name}
              </div>

              {patient.phone && (
                <div
                  style={{
                    fontSize: 12.5,
                    color: "#6B7280",
                    marginTop: 3,
                  }}
                >
                  {patient.phone}
                </div>
              )}
            </div>
          ) : (
            // Aucun patient sélectionné
            <>
              <select
                value={selectedPatientId}
                onChange={(e) =>
                  setSelectedPatientId(e.target.value)
                }
                disabled={loadingPatients || saving}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: 8,
                  outline: "none",
                  fontSize: 13,
                  fontFamily: "'Inter', sans-serif",
                  background: "#fff",
                  color: "#374151",
                }}
              >
                <option value="">
                  {loadingPatients
                    ? "Chargement des patients..."
                    : "Sélectionner un patient"}
                </option>

                {patients.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                  >
                    {p.nom} {p.prenom}
                    {p.telephone
                      ? ` — ${p.telephone}`
                      : ""}
                  </option>
                ))}
              </select>

              {/* Aperçu du patient sélectionné */}
              {selectedPatient && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: "#6B7280",
                  }}
                >
                  Téléphone :{" "}
                  {selectedPatient.telephone || "Non renseigné"}
                </div>
              )}
            </>
          )}
        </div>

        {/* =================================================
            INFO
        ================================================= */}

        <div
          style={{
            background: "#ECFEFF",
            border: "1px solid #CFFAFE",
            borderRadius: 9,
            padding: "12px 14px",
            marginBottom: 22,
            fontSize: 12.5,
            color: "#155E75",
            lineHeight: 1.5,
          }}
        >
          Ce rendez-vous est indépendant d'une consultation.
          Vous pourrez créer la consultation plus tard lorsque
          le patient arrivera.
        </div>

        {/* =================================================
            FORM
        ================================================= */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* DATE + HEURE */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            {/* DATE */}

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 7,
                }}
              >
                Date *
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(e.target.value)
                }
                disabled={saving}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: 8,
                  outline: "none",
                  fontSize: 13,
                  fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>

            {/* HEURE */}

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 7,
                }}
              >
                Heure *
              </label>

              <input
                type="time"
                value={heure}
                onChange={(e) =>
                  setHeure(e.target.value)
                }
                disabled={saving}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: 8,
                  outline: "none",
                  fontSize: 13,
                  fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>
          </div>

          {/* MOTIF */}

          <div>
            <label
              style={{
                display: "block",
                fontSize: 12.5,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 7,
              }}
            >
              Motif
            </label>

            <textarea
              value={motif}
              onChange={(e) =>
                setMotif(e.target.value)
              }
              placeholder="Ex : Contrôle, douleur dentaire, détartrage..."
              rows={3}
              disabled={saving}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 12px",
                border: "1px solid #D1D5DB",
                borderRadius: 8,
                resize: "vertical",
                outline: "none",
                fontSize: 13,
                fontFamily: "'Inter', sans-serif",
              }}
            />
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            style={{
              marginTop: 18,
              padding: "10px 12px",
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 8,
              color: "#B91C1C",
              fontSize: 12.5,
            }}
          >
            {error}
          </div>
        )}

        {/* =================================================
            BUTTONS
        ================================================= */}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 24,
          }}
        >
          <button
            onClick={onBack}
            disabled={saving}
            style={{
              padding: "9px 18px",
              background: "#fff",
              color: "#374151",
              border: "1px solid #D1D5DB",
              borderRadius: 8,
              cursor: saving
                ? "not-allowed"
                : "pointer",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Annuler
          </button>

          <button
            onClick={handleSave}
            disabled={saving || loadingPatients}
            style={{
              padding: "9px 18px",
              background:
                saving || loadingPatients
                  ? "#99D5D5"
                  : "#0EA5A5",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor:
                saving || loadingPatients
                  ? "not-allowed"
                  : "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {saving
              ? "Enregistrement..."
              : "Enregistrer le rendez-vous"}
          </button>
        </div>
      </div>
    </div>
  );
}