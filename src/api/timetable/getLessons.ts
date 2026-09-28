import type { Lesson } from "../../modules/timetable/types/Lesson.ts";
import { addDays, isDate } from "../../utils/date.ts";
import { isUuid } from "../../utils/isUuid.ts";
import { sortLessons } from "../../utils/sortLessons.ts";
import { apiClient } from "./apiClient.ts";
import { parseLessons } from "./parseLessons.ts";

const LESSON_LIMIT = 5000;

export class IncompleteScheduleError extends Error {
  constructor() {
    super(
      "API zwróciło zbyt wiele zajęć dla jednego dnia. Nie można pobrać kompletnego planu.",
    );
    this.name = "IncompleteScheduleError";
  }
}

export type LessonRequest = {
  groupId: string;
  from: string;
  to: string;
  limit: number;
  signal?: AbortSignal;
};

export type LessonLoader = (params: LessonRequest) => Promise<Lesson[]>;

const loadLessons: LessonLoader = async ({ signal, ...params }) =>
  parseLessons((await apiClient.get("/lessons", { params, signal })).data);

export async function getLessons(
  {
    specializationIds,
    from,
    to,
    signal,
  }: {
    specializationIds: string[];
    from: string;
    to: string;
    signal?: AbortSignal;
  },
  load: LessonLoader = loadLessons,
): Promise<Lesson[]> {
  if (
    !specializationIds.length ||
    !specializationIds.every(isUuid) ||
    !isDate(from) ||
    !isDate(to) ||
    from > to
  ) {
    throw new Error("Nieprawidłowy wybór specjalności lub zakres dat.");
  }

  async function loadRange(
    groupId: string,
    start: string,
    end: string,
  ): Promise<Lesson[]> {
    signal?.throwIfAborted();
    const lessons = await load({
      groupId,
      from: start,
      to: end,
      limit: LESSON_LIMIT,
      signal,
    });
    if (lessons.some((lesson) => lesson.date < start || lesson.date > end)) {
      throw new Error("API zwróciło zajęcia spoza wybranego zakresu.");
    }
    if (lessons.length < LESSON_LIMIT) return lessons;
    if (start === end) throw new IncompleteScheduleError();

    const days = Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000);
    const middle = addDays(start, Math.floor(days / 2));
    const left = await loadRange(groupId, start, middle);
    return left.concat(await loadRange(groupId, addDays(middle, 1), end));
  }

  const lessons: Lesson[] = [];
  for (const id of [...new Set(specializationIds)].sort()) {
    lessons.push(...(await loadRange(id, from, to)));
  }
  return sortLessons(lessons);
}
