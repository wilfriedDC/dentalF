// =====================================================
// NUMÉROTATION FDI COMPLÈTE (32 dents), partagée entre
// NewConsultationForm et Odontogram pour rester cohérente.
// =====================================================

export const QUADRANT_1 = [18, 17, 16, 15, 14, 13, 12, 11]; // haut droit (patient)
export const QUADRANT_2 = [21, 22, 23, 24, 25, 26, 27, 28]; // haut gauche
export const QUADRANT_3 = [31, 32, 33, 34, 35, 36, 37, 38]; // bas gauche
export const QUADRANT_4 = [48, 47, 46, 45, 44, 43, 42, 41]; // bas droit

// Groupé par quadrant, pour un <select> avec <optgroup> lisible
export const FDI_QUADRANTS: { label: string; teeth: number[] }[] = [
  { label: "Haut droit", teeth: QUADRANT_1 },
  { label: "Haut gauche", teeth: QUADRANT_2 },
  { label: "Bas gauche", teeth: QUADRANT_3 },
  { label: "Bas droit", teeth: QUADRANT_4 },
];

// Liste à plat, si besoin d'itérer les 32 dents sans les quadrants
export const FDI_TEETH: number[] = [
  ...QUADRANT_1,
  ...QUADRANT_2,
  ...QUADRANT_3,
  ...QUADRANT_4,
];