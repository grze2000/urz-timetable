import type { Dictionaries } from "../modules/timetable/types/Dictionaries.ts";
import { addDays, isDate, weekStart } from "./date.ts";
import { getWeekTypeFromDate } from "./getWeekTypeFromDate.ts";

export function templateRange(dictionaries: Dictionaries, week: "A" | "B") {
  const from =
    week === "A"
      ? dictionaries.generation?.sourceWeekOneDate
      : dictionaries.generation?.sourceWeekTwoDate;
  return from && isDate(from) ? { from, to: addDays(from, 4) } : null;
}

export function templateDate(date: string, dictionaries?: Dictionaries) {
  if (!isDate(date) || !dictionaries) return null;
  const week = getWeekTypeFromDate(date, dictionaries.generation);
  if (week === null) return null;
  const range = templateRange(dictionaries, week === 1 ? "A" : "B");
  if (!range) return null;
  const weekday = Math.round(
    (Date.parse(date) - Date.parse(weekStart(date))) / 86_400_000,
  );
  return weekday < 5 ? addDays(range.from, weekday) : null;
}
