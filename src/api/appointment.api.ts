import { api } from "./client";

export interface ApiRendezVous {
  id: number;
  patientId: number;
  date: string;
  heure: string;
  motif: string | null;
  statut: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiRendezVousWithPatient
  extends ApiRendezVous {
  patient: {
    id: number;
    nom: string;
    prenom: string;
    telephone: string;
  };
}


// GET tous les rendez-vous
export const getRendezVous = async () => {
  const response = await api.get("/rendez-vous");

  return response.data;
};


// GET les rendez-vous d'une date
export const getRendezVousByDate = async (
  date: string
) => {
  const response = await api.get("/rendez-vous", {
    params: {
      date,
    },
  });

  return response.data;
};


// GET un rendez-vous
export const getRendezVousById = async (
  id: number
) => {
  const response = await api.get(
    `/rendez-vous/${id}`
  );

  return response.data;
};