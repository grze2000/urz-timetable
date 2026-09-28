import type { Lesson } from "../../modules/timetable/types/Lesson.ts";
import { isDate } from "../../utils/date.ts";
import { isUuid } from "../../utils/isUuid.ts";
import {
  expectObject,
  expectValid,
  isTime,
  relationText,
} from "./parseResponse.ts";

export function parseLessons(value: unknown): Lesson[] {
  expectValid(Array.isArray(value));
  return value.map((entry) => {
    const lesson = expectObject(entry);
    expectValid(
      isUuid(lesson.id) &&
        isUuid(lesson.groupId) &&
        isDate(lesson.date) &&
        isTime(lesson.startTime) &&
        isTime(lesson.endTime),
    );
    expectValid(
      typeof lesson.lessonHours === "number" &&
        Number.isFinite(lesson.lessonHours) &&
        lesson.lessonHours > 0,
    );
    expectValid(lesson.sourceLessonId == null || isUuid(lesson.sourceLessonId));
    for (const key of [
      "teacherId",
      "subjectId",
      "roomId",
      "classTypeId",
      "noteId",
      "generationId",
    ]) {
      expectValid(lesson[key] == null || isUuid(lesson[key]));
    }
    return {
      id: lesson.id,
      date: lesson.date,
      startTime: lesson.startTime,
      endTime: lesson.endTime,
      lessonHours: lesson.lessonHours,
      groupId: lesson.groupId,
      sourceLessonId: lesson.sourceLessonId ?? null,
      subjectName: relationText(lesson.subject, "name"),
      teacherName: relationText(lesson.teacher, "fullName"),
      teacherTitle: relationText(lesson.teacher, "title"),
      teacherFirstName: relationText(lesson.teacher, "firstName"),
      teacherLastName: relationText(lesson.teacher, "lastName"),
      roomName: relationText(lesson.room, "name"),
      classTypeName: relationText(lesson.classType, "name"),
      note: relationText(lesson.note, "text"),
    };
  });
}
