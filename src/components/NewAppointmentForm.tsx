import { useEffect, useRef, useState } from "react";
import type { Patient } from "../types";

import {
  getPatients,
  createPatient,
  type ApiPatient,
} from "../api/patients.api";

import { createRendezVous } from "../api/rendezvous.api";
import { RENDEZVOUS_UPDATED_EVENT } from "../pages/AppointmentsSection";

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

// Mode de sélection du patient quand aucun patient n'est déjà imposé par le parent
type PatientMode = "existing" | "new";

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

  // ===================================================
  // RECHERCHE DE PATIENT (combobox)
  // ===================================================
  const [patientMode, setPatientMode] = useState<PatientMode>("existing");
  const [patientQuery, setPatientQuery] = useState(patient ? patient.name : "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsBlurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ===================================================
  // PATIENT SANS DOSSIER (pas encore créé en base)
  // ===================================================
  const [newPatientNom, setNewPatientNom] = useState("");
  const [newPatientPrenom, setNewPatientPrenom] = useState("");
  const [newPatientTelephone, setNewPatientTelephone] = useState("");

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
    setPatientQuery(patient ? patient.name : "");
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
  // RECHERCHE : filtrage des patients par nom/prénom/téléphone
  // ===================================================

  const normalizedQuery = patientQuery.trim().toLowerCase();

  const filteredPatients =
    normalizedQuery.length === 0
      ? patients.slice(0, 8)
      : patients
          .filter((p) => {
            const fullName = `${p.nom} ${p.prenom}`.toLowerCase();
            return (
              fullName.includes(normalizedQuery) ||
              (p.telephone ?? "").includes(normalizedQuery)
            );
          })
          .slice(0, 8);

  const handleSelectPatient = (p: ApiPatient) => {
    setSelectedPatientId(String(p.id));
    setPatientQuery(`${p.nom} ${p.prenom}`);
    setShowSuggestions(false);
  };

  const handlePatientQueryChange = (value: string) => {
    setPatientQuery(value);
    setShowSuggestions(true);
    // Si l'utilisateur retouche le texte, on invalide la sélection précédente
    // tant qu'il n'a pas re-choisi un patient dans la liste.
    setSelectedPatientId("");
  };

  // Petit délai avant de fermer la liste au blur, pour laisser le temps au
  // clic sur une suggestion de s'exécuter (onMouseDown déclenché avant onBlur).
  const handlePatientInputBlur = () => {
    suggestionsBlurTimeout.current = setTimeout(() => {
      setShowSuggestions(false);
    }, 120);
  };

  const handlePatientInputFocus = () => {
    if (suggestionsBlurTimeout.current) {
      clearTimeout(suggestionsBlurTimeout.current);
    }
    setShowSuggestions(true);
  };

  // ===================================================
  // CHANGEMENT DE MODE (existant / sans dossier)
  // ===================================================

  const handleSwitchMode = (mode: PatientMode) => {
    setPatientMode(mode);
    setError("");
    // On nettoie les champs de l'autre mode pour éviter d'envoyer des
    // données incohérentes au moment de l'enregistrement.
    if (mode === "existing") {
      setNewPatientNom("");
      setNewPatientPrenom("");
      setNewPatientTelephone("");
    } else {
      setSelectedPatientId("");
      setPatientQuery("");
    }
  };

  // ===================================================
  // ENREGISTRER
  // ===================================================

  const handleSave = async () => {
    setError("");

    const usingExistingPatient = Boolean(patient) || patientMode === "existing";

    // --- Validation patient ---
    if (usingExistingPatient) {
      if (!selectedPatientId) {
        setError("Veuillez sélectionner un patient dans la liste.");
        return;
      }
    } else {
      if (newPatientNom.trim().length < 2) {
        setError("Le nom doit contenir au moins 2 caractères.");
        return;
      }
      if (newPatientPrenom.trim().length < 2) {
        setError("Le prénom doit contenir au moins 2 caractères.");
        return;
      }
      if (newPatientTelephone.trim().length < 8) {
        setError("Veuillez indiquer un numéro de téléphone valide (8 chiffres minimum).");
        return;
      }
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

      let finalPatientId: number;

      if (usingExistingPatient) {
        finalPatientId = Number(selectedPatientId);
      } else {
        // Mode "Sans dossier" : on crée d'abord le patient (nom, prénom,
        // téléphone obligatoires ; sexe, date de naissance et adresse restent
        // vides/null, comme autorisé par le schéma backend), puis on récupère
        // son ID pour créer le rendez-vous.
        const createdPatient = await createPatient({
          nom: newPatientNom.trim(),
          prenom: newPatientPrenom.trim(),
          telephone: newPatientTelephone.trim(),
        });

        finalPatientId = createdPatient.id;
      }

      await createRendezVous({
        patientId: finalPatientId,
        date,
        heure,
        motif: motif.trim() || undefined,
        statut: "PLANIFIE",
      });

      // Prévient AppointmentsSection qu'un rendez-vous vient d'être créé,
      // pour qu'il recharge sa liste automatiquement sans reload de page.
      window.dispatchEvent(new Event(RENDEZVOUS_UPDATED_EVENT));

      onSaved?.();

      onBack();
    } catch (err: any) {
      console.error(
        "Erreur création rendez-vous :",
        err?.response?.data ?? err
      );

      // Remonte le message d'erreur du backend si disponible (ex: validation Zod),
      // plutôt qu'un message générique qui masque la vraie cause.
      const backendMessage = err?.response?.data?.message;

      setError(
        typeof backendMessage === "string"
          ? backendMessage
          : "Impossible d'enregistrer le rendez-vous."
      );
    } finally {
      setSaving(false);
    }
  };

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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 7,
            }}
          >
            <label
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: "#374151",
              }}
            >
              Patient *
            </label>

            {/* Le choix du mode n'a de sens que si aucun patient n'est déjà imposé
                par le parent (ex: venant de la fiche patient). */}
            {!patient && (
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  background: "#F3F4F6",
                  borderRadius: 8,
                  padding: 3,
                }}
              >
                <button
                  type="button"
                  onClick={() => handleSwitchMode("existing")}
                  disabled={saving}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 6,
                    border: "none",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontSize: 11.5,
                    fontWeight: 600,
                    background: patientMode === "existing" ? "#fff" : "transparent",
                    color: patientMode === "existing" ? "#0EA5A5" : "#6B7280",
                    boxShadow:
                      patientMode === "existing" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  Patient existant
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchMode("new")}
                  disabled={saving}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 6,
                    border: "none",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontSize: 11.5,
                    fontWeight: 600,
                    background: patientMode === "new" ? "#fff" : "transparent",
                    color: patientMode === "new" ? "#0EA5A5" : "#6B7280",
                    boxShadow: patientMode === "new" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  Sans dossier
                </button>
              </div>
            )}
          </div>

          {patient ? (
            // Patient déjà imposé par le parent (ex: depuis la fiche patient)
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
          ) : patientMode === "existing" ? (
            // --- Recherche de patient existant (combobox) ---
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={patientQuery}
                onChange={(e) => handlePatientQueryChange(e.target.value)}
                onFocus={handlePatientInputFocus}
                onBlur={handlePatientInputBlur}
                disabled={loadingPatients || saving}
                placeholder={
                  loadingPatients ? "Chargement des patients..." : "Rechercher un patient (nom ou téléphone)…"
                }
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 12px",
                  border: `1px solid ${selectedPatientId ? "#0EA5A5" : "#D1D5DB"}`,
                  borderRadius: 8,
                  outline: "none",
                  fontSize: 13,
                  fontFamily: "'Inter', sans-serif",
                  background: "#fff",
                  color: "#374151",
                }}
              />

              {selectedPatientId && (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 11.5,
                    color: "#0EA5A5",
                    fontWeight: 600,
                  }}
                >
                  ✓ Patient sélectionné
                </div>
              )}

              {showSuggestions && !loadingPatients && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                    maxHeight: 220,
                    overflowY: "auto",
                    zIndex: 30,
                  }}
                >
                  {filteredPatients.length === 0 ? (
                    <div
                      style={{
                        padding: "12px 14px",
                        fontSize: 12.5,
                        color: "#9CA3AF",
                      }}
                    >
                      Aucun patient trouvé.{" "}
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSwitchMode("new")}
                        style={{
                          border: "none",
                          background: "none",
                          color: "#0EA5A5",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: 0,
                          fontSize: 12.5,
                        }}
                      >
                        Créer sans dossier →
                      </button>
                    </div>
                  ) : (
                    filteredPatients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        // onMouseDown (avant le blur de l'input) pour garantir que le clic
                        // soit bien pris en compte avant la fermeture de la liste.
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectPatient(p)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 14px",
                          border: "none",
                          borderBottom: "1px solid #F3F4F6",
                          background:
                            String(p.id) === selectedPatientId ? "#F0FDFA" : "#fff",
                          cursor: "pointer",
                          display: "block",
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2937" }}>
                          {p.nom} {p.prenom}
                        </div>
                        {p.telephone && (
                          <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 2 }}>
                            {p.telephone}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            // --- Patient sans dossier : saisie directe des coordonnées ---
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                background: "#FFFBEB",
                border: "1px solid #FDE68A",
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 11.5, color: "#92400E", lineHeight: 1.5 }}>
                Ce patient ne sera pas créé dans votre base "Patients". Ses coordonnées
                seront simplement enregistrées avec ce rendez-vous.
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input
                  type="text"
                  value={newPatientNom}
                  onChange={(e) => setNewPatientNom(e.target.value)}
                  placeholder="Nom *"
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
                <input
                  type="text"
                  value={newPatientPrenom}
                  onChange={(e) => setNewPatientPrenom(e.target.value)}
                  placeholder="Prénom *"
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

              <input
                type="tel"
                value={newPatientTelephone}
                onChange={(e) => setNewPatientTelephone(e.target.value)}
                placeholder="Téléphone *"
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