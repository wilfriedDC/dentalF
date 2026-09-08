import { api } from "./client";

export interface CreateRendezVousPayload {
  patientId: number;
  date: string;
  heure: string;
  motif?: string;
  statut?: string;
}

export interface UpdateRendezVousPayload {
  date?: string;
  heure?: string;
  motif?: string;
  statut?: string;
}

export interface ApiRendezVous {
  id: number;
  patientId: number;
  date: string;
  heure: string;
  motif: string | null;
  statut: string;
  patient?: {
    id: number;
    nom: string;
    prenom: string;
    telephone?: string;
  };
}

/**
 * Créer un rendez-vous
 */
export const createRendezVous = async (
  data: CreateRendezVousPayload
) => {
  const response = await api.post("/rendez-vous", data);
  return response.data;
};

/**
 * Récupérer tous les rendez-vous
 */
export const getRendezVous = async () => {
  const response = await api.get("/rendez-vous");
  return response.data;
};

/**
 * Récupérer un rendez-vous par son ID
 */
export const getRendezVousById = async (id: number) => {
  const response = await api.get(`/rendez-vous/${id}`);
  return response.data;
};

/**
 * Modifier un rendez-vous
 */
export const updateRendezVous = async (
  id: number,
  data: UpdateRendezVousPayload
) => {
  const response = await api.put(`/rendez-vous/${id}`, data);
  return response.data;
};

/**
 * Supprimer un rendez-vous
 */
export const deleteRendezVous = async (id: number) => {
  const response = await api.delete(`/rendez-vous/${id}`);
  return response.data;
};