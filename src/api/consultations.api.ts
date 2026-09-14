import { api } from "./client";

export interface CreateConsultationPayload {
  patientId: number;

  motifConsultation: string;
  observation?: string | null;

  prochainRdvDate?: string | null;
  prochainRdvHeure?: string | null;

  // Rétrocompatibilité : un seul acte envoyé directement.
  acte?: {
    numeroDent?: string | null;
    nomActe: string;
    description?: string | null;
    prix: number;
  } | null;

  // Nouveau : plusieurs actes dans la même consultation (panier style
  // "articles de supermarché"), créés tous ensemble côté backend.
  actes?: {
    numeroDent?: string | null;
    nomActe: string;
    description?: string | null;
    prix: number;
  }[];

  // Paiement
  paiement?: {
    montant: number;
    modePaiement?: string | null;
  } | null;
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

  patient?: ApiPatient;
}

export interface FullConsultation extends ApiConsultation {
  odontogrammes?: any[];
}


// POST /consultations
export const createConsultation = async (
  data: CreateConsultationPayload
) => {
  const response = await api.post(
    "/consultations",
    data
  );

  return response.data;
};


// GET /consultations
export const getConsultations = async () => {
  const response = await api.get(
    "/consultations"
  );

  return response.data;
};


// GET /consultations/:id
export const getConsultation = async (
  id: number
) => {
  const response = await api.get(
    `/consultations/${id}`
  );

  return response.data;
};


// GET /consultations/:id/full
export const getFullConsultation = async (
  id: number
) => {
  const response = await api.get(
    `/consultations/${id}/full`
  );

  return response.data;
};


// GET /consultations/:id/summary
export const getConsultationSummary = async (
  id: number
) => {
  const response = await api.get(
    `/consultations/${id}/summary`
  );

  return response.data;
};


// PUT /consultations/:id
export const updateConsultation = async (
  id: number,
  data: Partial<CreateConsultationPayload>
) => {
  const response = await api.put(
    `/consultations/${id}`,
    data
  );

  return response.data;
};


// POST /consultations/:id/paiements
export const addPaiement = async (
  id: number,
  data: { montant: number; modePaiement?: string | null }
) => {
  const response = await api.post(
    `/consultations/${id}/paiements`,
    data
  );

  return response.data;
};


// DELETE /consultations/:id
export const deleteConsultation = async (
  id: number
) => {
  const response = await api.delete(
    `/consultations/${id}`
  );

  return response.data;
};