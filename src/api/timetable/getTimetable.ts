"use client";

import { useQuery } from "@tanstack/react-query";
import { templateRange } from "@/utils/getTemplateRange";
import { validSelection } from "@/utils/getStudyOptions";
import { withGroupName } from "@/utils/withGroupName";
import { apiHost } from "./apiClient";
import { getLessons } from "./getLessons";
import { useDictionaries } from "./getDictionaries";

export type TimetableParams = {
  week: number;
  specializationIds: string[] | null;
  majorId: string | null;
  date?: string;
  enabled?: boolean;
};

export const useGetTimetable = (params: TimetableParams) => {
  const dictionaries = useDictionaries();
  const specializationIds = [...new Set(params.specializationIds ?? [])].sort();
  const valid = dictionaries.data && validSelection(params, dictionaries.data);
  const range = params.date
    ? { from: params.date, to: params.date }
    : dictionaries.data
      ? templateRange(dictionaries.data, params.week === 2 ? "B" : "A")
      : null;

  const query = useQuery({
    queryKey: [
      "mentor-ab",
      apiHost,
      "timetable",
      params.majorId,
      specializationIds,
      dictionaries.data?.generation?.id,
      range?.from,
      range?.to,
    ],
    queryFn: async ({ signal }) => {
      if (!range || !dictionaries.data) {
        throw new Error("Nie skonfigurowano tygodni A/B.");
      }
      const lessons = await getLessons({ specializationIds, ...range, signal });
      return lessons.map((lesson) =>
        withGroupName(lesson, dictionaries.data.groups),
      );
    },
    enabled: params.enabled !== false && !!valid && !!range,
    retry: 1,
  });

  const configurationError = !!valid && !range;
  return {
    ...query,
    isLoading: dictionaries.isLoading || query.isLoading,
    isError: dictionaries.isError || query.isError || configurationError,
    error:
      dictionaries.error ??
      query.error ??
      (configurationError
        ? new Error("Nie skonfigurowano tygodni A/B.")
        : null),
  };
};
