// ─── Shared Types ───────────────────────────────────────────────────────────

export type NavSection = "dashboard" | "patients" | "appointments" | "billing" | "payments" | "settings";
export type PatientTab = "overview" | "consultations" | "treatments" | "payments" | "appointments";
export type BillingStatus = "Paid" | "Partial" | "Unpaid";
export type PaymentMethod = "Cash" | "Card" | "Insurance" | "Transfer";

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  dob: string;
  address: string;
  lastVisit: string;
  nextAppt: string | null;
  balance: number;
}

export interface Consultation {
  id: string;
  patientId: string;
  date: string;
  motif: string;
  acte: string;
  prix: number;
  notes: string;
  status: BillingStatus;
  paid: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  time: string;
  duration: number;
  reason: string;
  status: "Confirmed" | "Pending" | "Completed" | "Cancelled";
}

export interface PaymentTransaction {
  id: string;
  date: string;
  patient: string;
  amount: number;
  method: PaymentMethod;
  consultation: string;
  balance: number;
  status: BillingStatus;
}
