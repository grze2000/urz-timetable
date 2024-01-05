import { dateRanges } from "@/config/dates";
import { getWeekTypeFromDate } from "@/utils/getWeekTypeFromDate";
import axios from "axios";
import { useQuery } from "react-query";

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

export const getTimetable = (week: number, id: string, major: string) => {
  return axios({
    method: "POST",
    url: `https://planurz2.grzegorzbabiarz.com/api/zapytania/planzajec/`,
    data: {
      id,
      kierunek: major,
      zakres_s: week,
    },
  }).then(({ data }) => data)
};

export const useGetTimetable = (week: number, id: string, major: string) => {
  return useQuery<LessonResponse[]>({
    queryKey: ["timetable", week, id, major],
    queryFn: () => getTimetable(week, id, major),
  });
};
