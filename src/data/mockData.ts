import type { Patient, Consultation, Appointment, PaymentTransaction, PaymentMethod } from "../types";

// ─── Mock Data ────────────────────────────────────────────────────────────────
// In a real app these would come from an API / database layer instead.

export const PATIENTS: Patient[] = [
  { id: 1, name: "RAKOTO Rabe", phone: "033 00 100 03", email: "rakotor@gmail.com", dob: "1988-03-15", address: "Andohaniato", lastVisit: "2025-07-18", nextAppt: "2025-07-29 09:30", balance: 0 },
  { id: 2, name: "RASOA Soa", phone: "032 21 000 12", email: "rsoa@gmail.com", dob: "1975-11-02", address: "Analakely", lastVisit: "2025-07-15", nextAppt: "2025-08-05 14:00", balance: 60000 },

];

export const CONSULTATIONS: Consultation[] = [
  { id: 1, patientId: 1, date: "2025-07-18", motif: "Douleur dentaire", acte: "Détartrage + Blanchiment", prix: 80000, notes: "Patient sensible. Prévoir anesthésie locale au prochain rdv.", status: "Paid", paid: 80000 },
  { id: 2, patientId: 1, date: "2025-03-05", motif: "Contrôle semestriel", acte: "Bilan radiologique + Détartrage", prix: 40000, notes: "RAS. Bonne hygiène bucco-dentaire.", status: "Paid", paid: 40000   },

];

export const TODAY_APPOINTMENTS: Appointment[] = [
  { id: 1, patientId: 1, patientName: "Wilfried Delysé", time: "09:30", duration: 45, reason: "Détartrage", status: "Confirmed" },
  { id: 2, patientId: 4, patientName: "Peter Parker", time: "11:00", duration: 60, reason: "Couronne céramique – pose définitive", status: "Confirmed" },

];

export const ACTES_OPTIONS = [
  "Détartrage", "Détartrage + Blanchiment", "Blanchiment LED professionnel",
  "Obturation composite", "Obturation amalgame",
  "Extraction simple", "Extraction complexe",
  "Couronne céramique", "Couronne métallo-céramique",
  "Radio panoramique", "Bilan radiologique",
  "Traitement canal (monoradiculé)", "Traitement canal (pluriradiculé)",
  "Pose implant", "Contrôle semestriel", "Contrôle annuel",
];

export const DENT_OPTIONS = [
  "31",
  "32",
  "34"

]

export const PAYMENT_TRANSACTIONS: PaymentTransaction[] = [
  { id: 1, date: "2025-07-24", patient: "Élise Petit", amount: 0, method: "Card" as PaymentMethod, consultation: "Détartrage + Fluoration", balance: 0, status: "Paid" },
  { id: 2, date: "2025-07-22", patient: "Marie Fontaine", amount: 320, method: "Cash" as PaymentMethod, consultation: "Blanchiment LED", balance: 0, status: "Paid" },
  { id: 3, date: "2025-07-20", patient: "Lucas Bernard", amount: 500, method: "Transfer" as PaymentMethod, consultation: "Couronne céramique", balance: 350, status: "Partial" },
  { id: 4, date: "2025-07-18", patient: "Sophie Martin", amount: 280, method: "Card" as PaymentMethod, consultation: "Détartrage + Blanchiment", balance: 0, status: "Paid" },
  { id: 5, date: "2025-07-15", patient: "Thomas Dubois", amount: 0, method: "Cash" as PaymentMethod, consultation: "Obturation composite", balance: 120, status: "Unpaid" },
  { id: 6, date: "2025-06-30", patient: "Camille Leclerc", amount: 0, method: "Cash" as PaymentMethod, consultation: "Extraction dent 36", balance: 350, status: "Unpaid" },
  { id: 7, date: "2025-05-10", patient: "Antoine Moreau", amount: 60, method: "Insurance" as PaymentMethod, consultation: "Obturation + Radio", balance: 80, status: "Partial" },
];