import type { Dictionaries } from "../modules/timetable/types/Dictionaries.ts";
import { addDays, isDate } from "./date.ts";

export function templateRange(dictionaries: Dictionaries, week: "A" | "B") {
  const from =
    week === "A"
      ? dictionaries.generation?.sourceWeekOneDate
      : dictionaries.generation?.sourceWeekTwoDate;
  return from && isDate(from) ? { from, to: addDays(from, 4) } : null;
}
