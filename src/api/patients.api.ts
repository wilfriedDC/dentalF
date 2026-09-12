import { api } from "./client";

export interface CreatePatientPayload {
  nom: string;
  prenom: string;
  sexe?: string;
  telephone: string;
  email?: string;
  dateNaissance?: string;
  adresse?: string;
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

// =====================================================
// ODONTOGRAMME
// =====================================================

export type ToothStatus =
  | "sain"
  | "carie"
  | "obturee"
  | "couronne"
  | "devitalisee"
  | "implant"
  | "a_extraire"
  | "extraite";

export interface ApiToothNote {
  numeroDent: number; // notation FDI (11-18, 21-28, 31-38, 41-48)
  note: string;
  statut?: ToothStatus;
  updatedAt?: string;
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
  odontogramme?: ApiToothNote[];
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

/**
 * Récupère l'état actuel du schéma dentaire d'un patient (une entrée par
 * dent annotée, correspondant à sa consultation la plus récente).
 */
export const getOdontogrammeByPatient = async (
  patientId: number
): Promise<ApiToothNote[]> => {
  const response = await api.get(`/patients/${patientId}/odontogramme`);

  return (response.data as any[]).map((row) => ({
    numeroDent: Number(row.numeroDent),
    note: row.commentaire ?? "",
    statut: row.statut as ToothStatus,
    updatedAt: row.updatedAt,
  }));
};

/**
 * Crée ou met à jour le statut/la remarque d'une dent, rattachée à une
 * consultation précise du patient (l'odontogramme est un historique par
 * consultation, pas un simple champ libre sur le patient).
 */
export const updateToothNote = async (
  patientId: number,
  numeroDent: number,
  note: string,
  statut: ToothStatus,
  consultationId: number
) => {
  const response = await api.put(
    `/patients/${patientId}/odontogramme/${numeroDent}`,
    { consultationId, statut, commentaire: note }
  );

  const saved = response.data;

  return {
    numeroDent: Number(saved.numeroDent),
    note: saved.commentaire ?? "",
    statut: saved.statut as ToothStatus,
    updatedAt: saved.updatedAt,
  } as ApiToothNote;
};