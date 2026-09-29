"use client";

import { useQuery } from "@tanstack/react-query";
import { templateRange } from "@/utils/getTemplateRange";
import { validSelection } from "@/utils/getStudyOptions";
import { withGroupName } from "@/utils/withGroupName";
import { apiHost } from "./apiClient";
import { getLessons } from "./getLessons";
import { useDictionaries } from "./getDictionaries";
import type { SupportedStudyMode } from "@/modules/timetable/types/StudyMode";
import type { Dictionaries } from "@/modules/timetable/types/Dictionaries";

export type TimetableParams = {
  studyMode: SupportedStudyMode;
  week: number;
  specializationIds: string[] | null;
  majorId: string | null;
  date?: string;
  range?: { from: string; to: string };
  enabled?: boolean;
};

function getRange(params: TimetableParams, dictionaries?: Dictionaries) {
  if (params.date) return { from: params.date, to: params.date };
  if (params.range) return params.range;
  if (!dictionaries) return null;

  if (params.studyMode === "PART_TIME") {
    const period = dictionaries.lessonRange;
    return period ? { from: period.startDate, to: period.endDate } : null;
  }

  return templateRange(dictionaries, params.week === 2 ? "B" : "A");
}

export const useGetTimetable = (params: TimetableParams) => {
  const dictionaries = useDictionaries();
  const specializationIds = [...new Set(params.specializationIds ?? [])].sort();
  const valid = dictionaries.data && validSelection(params, dictionaries.data);
  const range = getRange(params, dictionaries.data);

  const query = useQuery({
    queryKey: [
      "mentor-ab",
      apiHost,
      "timetable",
      params.studyMode,
      params.majorId,
      specializationIds,
      dictionaries.data?.generation?.id,
      range?.from,
      range?.to,
    ],
    queryFn: async ({ signal }) => {
      if (!range || !dictionaries.data) {
        throw new Error("Nie skonfigurowano zakresu planu.");
      }
      const lessons = await getLessons({ specializationIds, ...range, signal });
      return lessons.map((lesson) =>
        withGroupName(lesson, dictionaries.data.groups),
      );
    },
    enabled: params.enabled !== false && !!valid && !!range,
    retry: 1,
  });

  const configurationError = params.enabled !== false && !!valid && !range;
  return {
    ...query,
    isLoading: dictionaries.isLoading || query.isLoading,
    isError: dictionaries.isError || query.isError || configurationError,
    error:
      dictionaries.error ??
      query.error ??
      (configurationError
        ? new Error("Nie skonfigurowano zakresu planu.")
        : null),
  };
};
