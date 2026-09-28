import type { DisplayLesson } from "../modules/timetable/types/DisplayLesson.ts";
import type { ScheduledLesson } from "../modules/timetable/types/ScheduledLesson.ts";
import { sortLessons } from "./sortLessons.ts";

export function withBreaks(lessons: DisplayLesson[]): ScheduledLesson[] {
  let occupiedDate: string | null = null;
  let occupiedUntil: number | null = null;

  return sortLessons(lessons).map((lesson) => {
    if (lesson.date !== occupiedDate) {
      occupiedDate = lesson.date;
      occupiedUntil = null;
    }
    const [hour, minute] = lesson.startTime.split(":").map(Number);
    const [endHour, endMinute] = lesson.endTime.split(":").map(Number);
    const start = hour * 60 + minute;
    const end = endHour * 60 + endMinute;
    const breakBefore =
      occupiedUntil === null ? 0 : Math.max(0, start - occupiedUntil);
    occupiedUntil = Math.max(occupiedUntil ?? 0, end);
    return { ...lesson, breakBefore };
  });
}
