import { api } from "./client";

export interface Cabinet {
  id: number;
  nom: string;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
}

export interface Praticien {
  id: number;
  cabinetId: number;
  nomComplet: string;
  numeroRPPS: string | null;
  specialite: string | null;
}

// Cabinet

export const getCabinet = async (): Promise<Cabinet | null> => {
  const response = await api.get("/settings/cabinet");

  return response.data;
};

export const updateCabinet = async (
  data: Omit<Cabinet, "id">
): Promise<Cabinet> => {
  const response = await api.put(
    "/settings/cabinet",
    data
  );

  return response.data;
};

// Praticiens

export const getPraticiens = async (): Promise<Praticien[]> => {
  const response = await api.get("/settings/praticiens");

  return response.data;
};

export const createPraticien = async (
  data: Omit<Praticien, "id" | "cabinetId">
): Promise<Praticien> => {
  const response = await api.post(
    "/settings/praticiens",
    data
  );

  return response.data;
};

export const updatePraticien = async (
  id: number,
  data: Omit<Praticien, "id" | "cabinetId">
): Promise<Praticien> => {
  const response = await api.put(
    `/settings/praticiens/${id}`,
    data
  );

  return response.data;
};