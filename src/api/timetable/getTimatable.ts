import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export type LessonResponse = {
  id_g: string;
  godz: string;
  min: string;
  pz_data_od: string;
  licznik_g: string;
  tytul_naukowy_nazwa: string;
  imie: string;
  nazwisko: string;
  p_nazwa: string;
  spec: string;
  bs_nazwa: string;
  fz_nazwa: string;
  u_nazwa: string;
};

export type TTimetableParams = {
  week: number;
  specializationId: string | null;
  majorId: string | null;
};

export const getTimetable = ({
  week,
  specializationId,
  majorId,
}: TTimetableParams) => {
  return axios({
    method: "POST",
    url: `${process.env.NEXT_PUBLIC_API_URL}/zapytania/planzajec/`,
    data: {
      id: specializationId,
      kierunek: majorId,
      zakres_s: week,
    },
  }).then(({ data }) => data);
};

export const useGetTimetable = (params: TTimetableParams) => {
  return useQuery<LessonResponse[]>({
    queryKey: ["timetable", ...Object.values(params)],
    queryFn: () => getTimetable(params),
    enabled: !!params.specializationId && !!params.majorId,
  });
};
