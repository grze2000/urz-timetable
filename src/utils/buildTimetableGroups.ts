import type { DisplayLesson } from "../modules/timetable/types/DisplayLesson.ts";
import type { ScheduledLesson } from "../modules/timetable/types/ScheduledLesson.ts";
import type { SupportedStudyMode } from "../modules/timetable/types/StudyMode.ts";
import { addDays, isWithinTeachingPeriod } from "./date.ts";
import { withBreaks } from "./withBreaks.ts";

export type TimetableGroup = {
  date: string;
  from: string | null;
  to: string | null;
  lessons: ScheduledLesson[];
  label: string;
  emptyLabel: string;
};

const dayNames = [
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
  "Niedziela",
];

export function buildTimetableGroups({
  lessons,
  studyMode,
  selectedWeekStart,
  excludedGroups,
}: {
  lessons: DisplayLesson[];
  studyMode: SupportedStudyMode;
  selectedWeekStart: string;
  excludedGroups: string[] | null;
}): TimetableGroup[] {
  const indexes = studyMode === "PART_TIME" ? [5, 6] : [0, 1, 2, 3, 4];
  return indexes.map((index) => {
    const date = addDays(selectedWeekStart, index);
    const dayLessons = withBreaks(
      lessons.filter(
        (lesson) =>
          (studyMode === "PART_TIME"
            ? lesson.date === date && isWithinTeachingPeriod(date)
            : new Date(`${lesson.date}T12:00:00Z`).getUTCDay() === index + 1) &&
          !excludedGroups?.includes(lesson.groupId),
      ),
    );
    return {
      date,
      from: dayLessons[0]?.startTime ?? null,
      to: dayLessons.length
        ? dayLessons.reduce(
            (latest, lesson) =>
              lesson.endTime > latest ? lesson.endTime : latest,
            dayLessons[0].endTime,
          )
        : null,
      lessons: dayLessons,
      label:
        studyMode === "PART_TIME"
          ? `${dayNames[index]} ${Number(date.slice(8))}.${date.slice(5, 7)}`
          : dayNames[index],
      emptyLabel:
        studyMode === "PART_TIME" && !isWithinTeachingPeriod(date)
          ? "Poza okresem zajęć"
          : "Brak zajęć w tym dniu",
    };
  });
}
