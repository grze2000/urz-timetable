import type { Dictionaries } from "../modules/timetable/types/Dictionaries.ts";
import { weekStart } from "./date.ts";

export function getWeekTypeFromDate(
  date: string,
  generation?: Dictionaries["generation"],
) {
  if (!generation) return null;
  const selectedMonday = weekStart(date);
  const sourceMonday = weekStart(generation.sourceWeekOneDate);
  const weeks = Math.round(
    (Date.parse(selectedMonday) - Date.parse(sourceMonday)) / (7 * 86_400_000),
  );
  return ((weeks % 2) + 2) % 2 === 0 ? 1 : 2;
}
