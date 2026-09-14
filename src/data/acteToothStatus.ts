// =====================================================
// Association acte -> statut de dent sur l'odontogramme
// =====================================================
// Les actes non listés ici (détartrage, radio, contrôle...) ne modifient
// pas l'odontogramme automatiquement — ce sont des actes globaux, pas
// spécifiques à une dent en particulier.
//
// Les valeurs correspondent aux `ToothStatus` définis dans Odontogram.tsx.

export const ACTE_TO_TOOTH_STATUS: Record<string, string> = {
  "Obturation composite": "obturee",
  "Obturation amalgame": "obturee",
  "Extraction simple": "extraite",
  "Extraction complexe": "extraite",
  "Couronne céramique": "couronne",
  "Couronne métallo-céramique": "couronne",
  "Traitement canal (monoradiculé)": "devitalisee",
  "Traitement canal (pluriradiculé)": "devitalisee",
  "Pose implant": "implant",
};