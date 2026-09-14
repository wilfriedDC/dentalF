// ─── Shared Types ───────────────────────────────────────────────────────────

export type NavSection = "dashboard" | "patients" | "appointments" | "billing" | "payments" | "settings";
export type PatientTab = "overview" | "consultations" | "treatments" | "payments" | "appointments" | "odontogramme";;
export type BillingStatus = "Paid" | "Partial" | "Unpaid";
export type PaymentMethod = "Cash" | "Card" | "Insurance" | "Transfer";
export type AppointmentStatus = "Confirmed" | "Pending" | "Completed" | "Cancelled";
export type ConsultationStatus = "Completed" | "Pending" | "Cancelled";


export interface Patient {
  id: number;
  name: string;
  phone: string;
  lastVisit: string;
  balance: number;
  email?: string;
  dob?: string;
  address?: string;
  nextAppt?: string;
}

export interface Consultation {
  id: number;
  patientId: number;
  date: string;
  motif: string;
  acte: string;
  prix: number;
  notes: string;
  status: BillingStatus;
  paid: number;
}

export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  time: string;
  duration: number;
  reason: string;
  status: "Confirmed" | "Pending" | "Completed" | "Cancelled";
}

export interface PaymentTransaction {
  id: number;
  date: string;
  patient: string;
  amount: number;
  method: PaymentMethod;
  consultation: string;
  balance: number;
  status: BillingStatus;
}
