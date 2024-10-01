import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export type GetMajorsResponse = {
  id_k: string;
  k_nazwa: string;
  hierarchia: string;
  status: string;
  id_podzial: string;
  id_kierunek: string;
  podzial: string;
};

export const getMajors = () => {
  return axios({
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_URL}/zapytania/kierunki/1`,
  }).then(({ data }) => data);
};

export const useGetMajors = () => {
  return useQuery<GetMajorsResponse[]>({
    queryKey: ["majors"],
    queryFn: getMajors,
  });
};
