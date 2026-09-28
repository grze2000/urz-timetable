import type { DisplayLesson } from "../modules/timetable/types/DisplayLesson.ts";
import type { Group } from "../modules/timetable/types/Group.ts";
import type { Lesson } from "../modules/timetable/types/Lesson.ts";
import { getGroupPath } from "./getGroupPath.ts";

export function withGroupName(lesson: Lesson, groups: Group[]): DisplayLesson {
  const path = getGroupPath(lesson.groupId, groups);
  const group = path.at(-1);
  return {
    ...lesson,
    groupName:
      group?.level === "WORKSHOP"
        ? path
            .slice(-2)
            .map((item) => item.name)
            .join(" / ")
        : (group?.name ?? "—"),
  };
}
