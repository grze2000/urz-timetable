import type { Lesson } from "../modules/timetable/types/Lesson.ts";

export const sortLessons = <T extends Lesson>(lessons: T[]): T[] =>
  [...new Map(lessons.map((lesson) => [lesson.id, lesson])).values()].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.startTime.localeCompare(b.startTime) ||
      a.id.localeCompare(b.id),
  );
