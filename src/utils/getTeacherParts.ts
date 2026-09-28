import type { Lesson } from "../modules/timetable/types/Lesson.ts";

export function teacherParts(lesson: Lesson): [string, string, string] {
  const title = lesson.teacherTitle === "—" ? "" : lesson.teacherTitle;
  const firstName =
    lesson.teacherFirstName === "—" ? "" : lesson.teacherFirstName;
  const lastName = lesson.teacherLastName === "—" ? "" : lesson.teacherLastName;
  if (!title && !firstName && !lastName && lesson.teacherName === "—") {
    return ["", "—", ""];
  }
  return [
    title,
    firstName ||
      (!lastName && lesson.teacherName !== "—" ? lesson.teacherName : ""),
    lastName,
  ];
}
