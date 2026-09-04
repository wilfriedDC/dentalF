import { api } from "./client";

export interface CreatePatientPayload {
  nom: string;
  prenom: string;
  sexe?: string | null;
  telephone: string;
  email?: string | null;
  dateNaissance?: string | null;
  adresse?: string | null;
}

export interface ApiActe {
  id: number;
  consultationId: number;
  numeroDent: string | null;
  nomActe: string;
  description: string | null;
  prix: number;
}

export interface ApiPaiement {
  id: number;
  consultationId: number;
  datePaiement: string;
  montant: number;
  modePaiement: string | null;
}

export interface ApiRendezVous {
  id: number;
  patientId: number;
  date: string;
  heure: string;
  motif: string | null;
  statut: string;
}

export interface ApiConsultation {
  id: number;
  patientId: number;
  dateConsultation: string;

  motifConsultation: string;
  observation: string | null;

  prochainRdvDate: string | null;
  prochainRdvHeure: string | null;

  actes: ApiActe[];
  paiements: ApiPaiement[];
}

export interface ApiPatient {
  id: number;
  nom: string;
  prenom: string;
  sexe: string | null;
  dateNaissance: string | null;
  adresse: string | null;
  telephone: string;
  email: string | null;

  createdAt: string;
  updatedAt: string;

  consultations: ApiConsultation[];
  rendezVous: ApiRendezVous[];
}


// GET tous les patients
export const getPatients = async (search?: string) => {
  const response = await api.get("/patients", {
    params: search ? { search } : undefined,
  });

  return response.data;
};


// GET un patient
export const getPatient = async (id: number) => {
  const response = await api.get(`/patients/${id}`);
  return response.data;
};

// POST nouveau patient
export const createPatient = async (
  data: CreatePatientPayload
) => {
  try {
    const response = await api.post(
      "/patients",
      data
    );

    return response.data;

  } catch (error: any) {
    console.error(
      "ERREUR CREATE PATIENT:",
      error.response?.data
    );

    throw error;
  }
};