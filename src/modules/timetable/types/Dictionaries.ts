import type { Group } from "./Group.ts";
import type { StudyMode } from "./StudyMode.ts";

export type Dictionaries = {
  groups: Group[];
  studyModes: StudyMode[];
  holidays: { date: string; name: string }[];
  lessonRange: {
    startDate: string;
    endDate: string;
    weekOneName: string;
    weekTwoName: string;
  } | null;
  generation: {
    id: string;
    sourceWeekOneDate: string;
    sourceWeekTwoDate: string;
  } | null;
};
