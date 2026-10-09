import { isDate } from "./date.ts";

export function resolveSelectedDay(
  selectedDate: string | null,
  availableDates: readonly string[],
  today: string,
) {
  if (!isDate(selectedDate) || selectedDate < today) return 0;
  const index = availableDates.indexOf(selectedDate);
  return index >= 0 ? index : 0;
}
