import { api } from "./client";

export interface CreateConsultationPayload {
  patientId: number;

  motifConsultation: string;
  observation?: string | null;

  prochainRdvDate?: string | null;
  prochainRdvHeure?: string | null;

  actes?: {
    numeroDent: string | null;
    nomActe: string;
    description?: string | null;
    prix: number;
  }[];

  paiements?: {
    montant: number;
    modePaiement?: string | null;
  }[];
}

export const createConsultation = async (
  data: CreateConsultationPayload
) => {
  const response = await api.post(
    "/consultations",
    data
  );

  return response.data;
};