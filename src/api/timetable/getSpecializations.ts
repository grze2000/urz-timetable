import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export type GetSpetializationsResponse = {
  id_k: string;
  k_nazwa: string;
  hierarchia: string;
  status: string;
};

export const getSpetializations = (majorId?: string | null) => {
  return axios({
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_URL}/zapytania/specjalnosci/${majorId}`,
  }).then(({ data }) => data);
};

export const useGetSpetializations = (majorId?: string | null) => {
  return useQuery<GetSpetializationsResponse[]>({
    queryKey: ["spetializations", majorId],
    queryFn: () => getSpetializations(majorId),
    enabled: !!majorId,
  });
};
