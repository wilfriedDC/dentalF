import { useEffect, useState } from "react";
import type { ApiToothNote } from "../api/patients.api";
import type { ReactElement } from "react";

// =====================================================
// DISPOSITION DES DENTS — Notation FDI (internationale)
// =====================================================
// Arcade supérieure (vue de face, patient en face de vous) :
//   Quadrant 1 (droite du patient)   Quadrant 2 (gauche du patient)
//   18 17 16 15 14 13 12 11          21 22 23 24 25 26 27 28
// Arcade inférieure :
//   Quadrant 4                        Quadrant 3
//   48 47 46 45 44 43 42 41          31 32 33 34 35 36 37 38

const QUADRANT_1 = [18, 17, 16, 15, 14, 13, 12, 11];
const QUADRANT_2 = [21, 22, 23, 24, 25, 26, 27, 28];
const QUADRANT_4 = [48, 47, 46, 45, 44, 43, 42, 41];
const QUADRANT_3 = [31, 32, 33, 34, 35, 36, 37, 38];

// Types de dents par position dans le quadrant (index 0 = la plus au fond,
// dent de sagesse ; index 7 = incisive centrale). Détermine la forme du SVG.
type ToothKind = "molar" | "premolar" | "canine" | "incisor";

const TOOTH_KIND_BY_POSITION: ToothKind[] = [
  "molar", // 8 - dent de sagesse
  "molar", // 7
  "molar", // 6
  "premolar", // 5
  "premolar", // 4
  "canine", // 3
  "incisor", // 2
  "incisor", // 1 - incisive centrale
];

function getToothKind(numeroDent: number): ToothKind {
  const positionInQuadrant = numeroDent % 10; // 1 à 8
  return TOOTH_KIND_BY_POSITION[8 - positionInQuadrant];
}

// =====================================================
// STATUTS DE DENT
// =====================================================

export type ToothStatus =
  | "sain"
  | "carie"
  | "obturee"
  | "couronne"
  | "devitalisee"
  | "implant"
  | "a_extraire"
  | "extraite";

interface StatusVisualConfig {
  label: string;
  badge: string; // code court affiché dans la pastille
  badgeColor: string;
  fill?: string;
  stroke?: string;
  opacity?: number;
  dashed?: boolean;
}

const STATUS_VISUAL: Record<ToothStatus, StatusVisualConfig> = {
  sain: {
    label: "Saine",
    badge: "",
    badgeColor: "",
  },
  carie: {
    label: "Carie",
    badge: "CAR",
    badgeColor: "#DC2626",
    fill: "#FEF2F2",
    stroke: "#EF4444",
  },
  obturee: {
    label: "Obturée",
    badge: "OBT",
    badgeColor: "#64748B",
    fill: "#F1F5F9",
    stroke: "#64748B",
  },
  couronne: {
    label: "Couronne",
    badge: "CRN",
    badgeColor: "#CA8A04",
    fill: "#FEF9C3",
    stroke: "#CA8A04",
  },
  devitalisee: {
    label: "Dévitalisée",
    badge: "DEV",
    badgeColor: "#7C3AED",
    fill: "#F5F3FF",
    stroke: "#7C3AED",
  },
  implant: {
    label: "Implant",
    badge: "IMP",
    badgeColor: "#2563EB",
    fill: "#EFF6FF",
    stroke: "#2563EB",
  },
  a_extraire: {
    label: "À extraire",
    badge: "AEX",
    badgeColor: "#EA580C",
    fill: "#FFF7ED",
    stroke: "#EA580C",
    dashed: true,
  },
  extraite: {
    label: "Extraite",
    badge: "EXT",
    badgeColor: "#78716C",
    fill: "#F5F5F4",
    stroke: "#A8A29E",
    opacity: 0.4,
    dashed: true,
  },
};

const STATUS_OPTIONS: ToothStatus[] = [
  "sain",
  "carie",
  "obturee",
  "couronne",
  "devitalisee",
  "implant",
  "a_extraire",
  "extraite",
];

interface ResolvedVisual {
  fill: string;
  stroke: string;
  opacity: number;
  dashed: boolean;
}

function resolveVisual(
  status: ToothStatus,
  hasNote: boolean,
  isSelected: boolean
): ResolvedVisual {
  if (isSelected) {
    return { fill: "#CCFBF1", stroke: "#0EA5A5", opacity: 1, dashed: false };
  }
  if (status !== "sain") {
    const cfg = STATUS_VISUAL[status];
    return {
      fill: cfg.fill ?? "#FAFAFA",
      stroke: cfg.stroke ?? "#C4CBD4",
      opacity: cfg.opacity ?? 1,
      dashed: !!cfg.dashed,
    };
  }
  if (hasNote) {
    return { fill: "#F0FDFA", stroke: "#14B8A6", opacity: 1, dashed: false };
  }
  return { fill: "#FAFAFA", stroke: "#C4CBD4", opacity: 1, dashed: false };
}

// =====================================================
// SVG D'UNE DENT — couronne + racine(s), style réaliste simplifié
// =====================================================

interface ToothShapeProps {
  kind: ToothKind;
  flipped: boolean; // true pour l'arcade inférieure (racine vers le bas -> haut)
  fill: string;
  stroke: string;
  opacity: number;
  dashed: boolean;
  status: ToothStatus;
}

function ToothShape({
  kind,
  flipped,
  fill,
  stroke,
  opacity,
  dashed,
  status,
}: ToothShapeProps) {
  // Chaque forme est dessinée "racine en haut, couronne en bas" (comme une
  // dent du bas), puis retournée verticalement pour l'arcade du haut.
  const crownPaths: Record<ToothKind, string> = {
    molar:
      "M6 30 C4 22 5 14 8 10 C10 7 13 6 16 6 C19 6 22 7 24 10 C27 14 28 22 26 30 C25 34 21 36 16 36 C11 36 7 34 6 30 Z",
    premolar:
      "M8 30 C6 22 7 13 10 9 C12 6.5 14 6 16 6 C18 6 20 6.5 22 9 C25 13 26 22 24 30 C23 34 20 36 16 36 C12 36 9 34 8 30 Z",
    canine:
      "M11 32 C8 26 8 16 11 10 C12.5 7 14 6 16 6 C18 6 19.5 7 21 10 C24 16 24 26 21 32 C19.5 35 18 36 16 36 C14 36 12.5 35 11 32 Z",
    incisor:
      "M10 31 C8.5 24 9 14 11 9 C12 6.5 14 6 16 6 C18 6 20 6.5 21 9 C23 14 23.5 24 22 31 C21 35 19 37 16 37 C13 37 11 35 10 31 Z",
  };

  // Couleur des racines : assombrie pour une dent dévitalisée (canal traité).
  const rootColor = status === "devitalisee" ? "#5B21B6" : stroke;
  const rootWidth = status === "devitalisee" ? 2.4 : 2;

  const rootLines: Record<ToothKind, ReactElement> = {
    molar: (
      <>
        <path d="M11 30 L9 44" stroke={rootColor} strokeWidth={rootWidth} strokeLinecap="round" fill="none" />
        <path d="M16 32 L16 46" stroke={rootColor} strokeWidth={rootWidth} strokeLinecap="round" fill="none" />
        <path d="M21 30 L23 44" stroke={rootColor} strokeWidth={rootWidth} strokeLinecap="round" fill="none" />
      </>
    ),
    premolar: (
      <>
        <path d="M13 31 L12 45" stroke={rootColor} strokeWidth={rootWidth} strokeLinecap="round" fill="none" />
        <path d="M19 31 L20 45" stroke={rootColor} strokeWidth={rootWidth} strokeLinecap="round" fill="none" />
      </>
    ),
    canine: (
      <path d="M16 33 L16 48" stroke={rootColor} strokeWidth={rootWidth + 0.2} strokeLinecap="round" fill="none" />
    ),
    incisor: (
      <path d="M16 34 L16 46" stroke={rootColor} strokeWidth={rootWidth} strokeLinecap="round" fill="none" />
    ),
  };

  // Pour un implant, on remplace la racine naturelle par une vis simplifiée.
  const implantRoot = (
    <>
      <path d="M16 33 L16 47" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M12.5 37 L19.5 37 M12.5 41 L19.5 41 M12.5 45 L19.5 45" stroke="#EFF6FF" strokeWidth="1" fill="none" />
      <circle cx="16" cy="48" r="2.2" fill="#2563EB" />
    </>
  );

  // Marquages spécifiques par statut, dessinés par-dessus la couronne.
  let overlay: ReactElement | null = null;
  if (status === "carie") {
    overlay = <ellipse cx="14.5" cy="17" rx="3.2" ry="2.6" fill="#7C2D12" opacity={0.85} />;
  } else if (status === "obturee") {
    overlay = <rect x="12" y="14" width="8" height="6" rx="2" fill="#94A3B8" />;
  } else if (status === "couronne") {
    overlay = (
      <path
        d="M9 11 L12 8 L16 11 L20 8 L23 11"
        stroke="#CA8A04"
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      />
    );
  } else if (status === "extraite") {
    overlay = (
      <path
        d="M9 10 L23 33 M23 10 L9 33"
        stroke="#B91C1C"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    );
  }

  return (
    <svg
      viewBox="0 0 32 50"
      width="30"
      height="46"
      style={{
        transform: flipped ? "scaleY(-1)" : undefined,
        display: "block",
        opacity,
      }}
    >
      {status === "implant" ? implantRoot : rootLines[kind]}
      <path
        d={crownPaths[kind]}
        fill={fill}
        stroke={stroke}
        strokeWidth="1.6"
        strokeDasharray={dashed ? "2.5 2" : undefined}
      />
      {overlay}
    </svg>
  );
}

// =====================================================
// PROPS DU COMPOSANT PRINCIPAL
// =====================================================

// Consultation minimale nécessaire pour le sélecteur (pas besoin de tous les
// champs de ApiConsultation ici).
export interface OdontogramConsultationOption {
  id: number;
  dateConsultation: string;
  motifConsultation: string;
}

interface OdontogramProps {
  notes: ApiToothNote[];
  // Liste des consultations du patient, utilisée pour choisir à laquelle
  // rattacher la remarque/le statut d'une dent (l'odontogramme est un
  // historique par consultation, pas un champ libre sur le patient).
  consultations: OdontogramConsultationOption[];
  onSaveNote: (
    numeroDent: number,
    note: string,
    statut: ToothStatus,
    consultationId: number
  ) => Promise<void>;
}

// Formatte une date ISO en "12/03/2026" pour le sélecteur de consultation
function formatShortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR");
}

export function Odontogram({ notes, consultations, onSaveNote }: OdontogramProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [draftStatus, setDraftStatus] = useState<ToothStatus>("sain");
  const [saving, setSaving] = useState(false);

  // Consultation ciblée par l'enregistrement en cours. Par défaut, la plus
  // récente (on suppose `consultations` triée du plus récent au plus ancien,
  // comme le fait déjà le reste de la fiche patient).
  const [selectedConsultationId, setSelectedConsultationId] = useState<number | "">(
    consultations[0]?.id ?? ""
  );

  // Si la liste des consultations change (ex: nouvelle consultation créée
  // pendant que l'onglet est ouvert) et qu'aucune n'était encore choisie, on
  // pré-sélectionne la plus récente.
  useEffect(() => {
    if (selectedConsultationId === "" && consultations[0]) {
      setSelectedConsultationId(consultations[0].id);
    }
  }, [consultations, selectedConsultationId]);

  const hasConsultations = consultations.length > 0;

  const getNote = (numeroDent: number) =>
    notes.find((n) => n.numeroDent === numeroDent)?.note ?? "";

  const getStatus = (numeroDent: number): ToothStatus =>
    (notes.find((n) => n.numeroDent === numeroDent) as { statut?: ToothStatus } | undefined)
      ?.statut ?? "sain";

  const handleSelectTooth = (numeroDent: number) => {
    setSelectedTooth(numeroDent);
    setDraft(getNote(numeroDent));
    setDraftStatus(getStatus(numeroDent));
  };

  const handleSave = async () => {
    if (selectedTooth == null) return;
    if (!selectedConsultationId) return; // bouton désactivé dans ce cas, sécurité supplémentaire

    setSaving(true);
    try {
      await onSaveNote(selectedTooth, draft.trim(), draftStatus, Number(selectedConsultationId));
    } catch (err) {
      console.error("Erreur enregistrement remarque dent :", err);
    } finally {
      setSaving(false);
    }
  };

  const Tooth = ({
    numeroDent,
    isLower,
  }: {
    numeroDent: number;
    isLower: boolean;
  }) => {
    const note = getNote(numeroDent);
    const hasNote = note.length > 0;
    const status = getStatus(numeroDent);
    const isSelected = selectedTooth === numeroDent;
    const kind = getToothKind(numeroDent);
    const visual = resolveVisual(status, hasNote, isSelected);
    const statusCfg = STATUS_VISUAL[status];

    const tooltip = [
      `Dent ${numeroDent}`,
      status !== "sain" ? statusCfg.label : null,
      hasNote ? note : null,
    ]
      .filter(Boolean)
      .join(" — ");

    const numberLabel = (
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          fontWeight: 600,
          color: isSelected ? "#0EA5A5" : "#6B7280",
        }}
      >
        {numeroDent}
      </div>
    );

    return (
      <button
        onClick={() => handleSelectTooth(numeroDent)}
        title={tooltip}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        {/* Sur l'arcade du bas, le numéro est affiché au-dessus de la dent
            (proche de la gencive / ligne médiane) ; en haut, en dessous. */}
        {isLower && numberLabel}

        <div style={{ position: "relative" }}>
          <ToothShape
            kind={kind}
            flipped={isLower}
            fill={visual.fill}
            stroke={visual.stroke}
            opacity={visual.opacity}
            dashed={visual.dashed}
            status={status}
          />

          {/* Pastille de statut */}
          {status !== "sain" && (
            <span
              style={{
                position: "absolute",
                top: isLower ? "auto" : -2,
                bottom: isLower ? -2 : "auto",
                left: -4,
                padding: "1px 3px",
                borderRadius: 4,
                background: statusCfg.badgeColor,
                color: "#fff",
                fontSize: 6.5,
                fontWeight: 700,
                fontFamily: "'Inter', sans-serif",
                letterSpacing: 0.2,
                lineHeight: "8px",
                whiteSpace: "nowrap",
              }}
            >
              {statusCfg.badge}
            </span>
          )}

          {/* Pastille de remarque texte */}
          {hasNote && (
            <span
              style={{
                position: "absolute",
                top: isLower ? "auto" : 0,
                bottom: isLower ? 0 : "auto",
                right: 2,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#14B8A6",
              }}
            />
          )}
        </div>

        {!isLower && numberLabel}
      </button>
    );
  };

  const Quadrant = ({
    teeth,
    isLower,
  }: {
    teeth: number[];
    isLower: boolean;
  }) => (
    <div style={{ display: "flex", gap: 2 }}>
      {teeth.map((n) => (
        <Tooth key={n} numeroDent={n} isLower={isLower} />
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* SCHEMA DENTAIRE */}
      <div
        style={{
          background: "#F8F9FA",
          borderRadius: 10,
          padding: "28px 20px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflowX: "auto",
        }}
      >
        {/* Arcade supérieure */}
        <div style={{ display: "flex", gap: 18 }}>
          <Quadrant teeth={QUADRANT_1} isLower={false} />
          <Quadrant teeth={QUADRANT_2} isLower={false} />
        </div>

        {/* Ligne médiane */}
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            height: 1,
            background: "#E5E7EB",
            margin: "6px 0",
          }}
        />

        {/* Arcade inférieure */}
        <div style={{ display: "flex", gap: 18 }}>
          <Quadrant teeth={QUADRANT_4} isLower={true} />
          <Quadrant teeth={QUADRANT_3} isLower={true} />
        </div>

        {/* Légende */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "6px 14px",
            marginTop: 18,
            maxWidth: 560,
          }}
        >
          <div
            style={{
              fontSize: 11.5,
              color: "#9CA3AF",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#14B8A6",
                display: "inline-block",
              }}
            />
            Remarque
          </div>
          {STATUS_OPTIONS.filter((s) => s !== "sain").map((s) => (
            <div
              key={s}
              style={{
                fontSize: 11.5,
                color: "#9CA3AF",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  padding: "1px 4px",
                  borderRadius: 4,
                  background: STATUS_VISUAL[s].badgeColor,
                  color: "#fff",
                  fontSize: 8,
                  fontWeight: 700,
                }}
              >
                {STATUS_VISUAL[s].badge}
              </span>
              {STATUS_VISUAL[s].label}
            </div>
          ))}
        </div>
      </div>

      {/* PANNEAU DETAIL DENT */}
      <div
        style={{
          border: "1px solid #E5E7EB",
          borderRadius: 10,
          padding: "16px 18px",
        }}
      >
        {!hasConsultations ? (
          <div
            style={{
              color: "#92400E",
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderRadius: 8,
              fontSize: 13,
              textAlign: "center",
              padding: 16,
              lineHeight: 1.5,
            }}
          >
            Aucune consultation enregistrée pour ce patient. Créez d'abord une
            consultation avant de renseigner l'odontogramme — chaque remarque
            de dent est rattachée à une consultation.
          </div>
        ) : selectedTooth == null ? (
          <div
            style={{
              color: "#9CA3AF",
              fontSize: 13.5,
              textAlign: "center",
              padding: 20,
            }}
          >
            Sélectionnez une dent sur le schéma pour définir son statut ou
            ajouter une remarque.
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2937" }}>
                Dent {selectedTooth}
              </div>

              {/* Sélecteur de consultation : détermine à quelle consultation
                  cette remarque/ce statut sera rattaché. */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "#6B7280",
                    whiteSpace: "nowrap",
                  }}
                >
                  Consultation :
                </label>
                <select
                  value={selectedConsultationId}
                  onChange={(e) => setSelectedConsultationId(Number(e.target.value))}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid #D1D5DB",
                    fontSize: 12.5,
                    color: "#374151",
                    fontFamily: "'Inter', sans-serif",
                    background: "#fff",
                  }}
                >
                  {consultations.map((c) => (
                    <option key={c.id} value={c.id}>
                      {formatShortDate(c.dateConsultation)} — {c.motifConsultation || "Consultation"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sélecteur de statut */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 12,
              }}
            >
              {STATUS_OPTIONS.map((s) => {
                const cfg = STATUS_VISUAL[s];
                const active = draftStatus === s;
                return (
                  <button
                    key={s}
                    onClick={() => setDraftStatus(s)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 999,
                      border: `1.5px solid ${
                        active ? cfg.badgeColor || "#0EA5A5" : "#E5E7EB"
                      }`,
                      background: active
                        ? cfg.badgeColor
                          ? `${cfg.badgeColor}15`
                          : "#CCFBF1"
                        : "#fff",
                      color: active
                        ? cfg.badgeColor || "#0EA5A5"
                        : "#6B7280",
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "'Inter', sans-serif",
                      cursor: "pointer",
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ex : carie détectée, couronne posée, sensibilité..."
              rows={3}
              style={{
                width: "100%",
                border: "1.5px solid #E5E7EB",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 13,
                fontFamily: "'Inter', sans-serif",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#0EA5A5")}
              onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 10,
              }}
            >
              <button
                onClick={handleSave}
                disabled={saving || !selectedConsultationId}
                style={{
                  padding: "7px 16px",
                  background: "#0EA5A5",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: saving || !selectedConsultationId ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  opacity: saving || !selectedConsultationId ? 0.7 : 1,
                }}
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}