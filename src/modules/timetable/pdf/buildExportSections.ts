import type { Dictionaries } from "../types/Dictionaries.ts";
import type { SupportedStudyMode } from "../types/StudyMode.ts";
import {
  addDays,
  isWithinTeachingPeriod,
  weekStart,
} from "../../../utils/date.ts";
import { templateRange } from "../../../utils/getTemplateRange.ts";

export type ExportSection = {
  title: string;
  week: number;
  range: { from: string; to: string };
  selectedWeekStart: string;
};

export function buildExportSections(
  studyMode: SupportedStudyMode,
  selectedWeekStart: string,
  dictionaries: Dictionaries,
): ExportSection[] {
  if (studyMode === "PART_TIME") {
    const from = addDays(selectedWeekStart, 5);
    const to = addDays(selectedWeekStart, 6);
    if (![from, to].some(isWithinTeachingPeriod)) {
      throw new Error("Wybrany weekend jest poza okresem zajęć.");
    }
    return [
      {
        title: `Weekend ${from} - ${to}`,
        week: 1,
        range: { from, to },
        selectedWeekStart,
      },
    ];
  }
  return (["A", "B"] as const).map((name, index) => {
    const range = templateRange(dictionaries, name);
    if (!range) throw new Error(`Nie skonfigurowano zakresu tygodnia ${name}.`);
    return {
      title: `Tydzień ${name}`,
      week: index + 1,
      range,
      selectedWeekStart: weekStart(range.from),
    };
  });
}
