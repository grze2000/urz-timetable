import type { Dictionaries } from "../../modules/timetable/types/Dictionaries.ts";
import type { Group } from "../../modules/timetable/types/Group.ts";
import { studyModes } from "../../modules/timetable/types/StudyMode.ts";
import { isDate } from "../../utils/date.ts";
import { isUuid } from "../../utils/isUuid.ts";
import { displayText, expectObject, expectValid } from "./parseResponse.ts";

export function parseDictionaries(value: unknown): Dictionaries {
  const data = expectObject(value);
  expectValid(
    Array.isArray(data.groups) &&
      Array.isArray(data.studyModes) &&
      Array.isArray(data.holidays),
  );

  const holidays = data.holidays.map((entry) => {
    const holiday = expectObject(entry);
    expectValid(
      isDate(holiday.date) &&
        typeof holiday.name === "string" &&
        holiday.name.trim().length > 0,
    );
    return { date: holiday.date, name: holiday.name.trim() };
  });

  const groups = data.groups.map((entry) => {
    const group = expectObject(entry);
    expectValid(
      isUuid(group.id) &&
        (group.parentId === null || isUuid(group.parentId)) &&
        typeof group.active === "boolean",
    );
    expectValid(
      ["COURSE", "SPECIALIZATION", "GROUP", "WORKSHOP"].includes(
        String(group.level),
      ),
    );
    expectValid(
      [...studyModes, "UNASSIGNED"].includes(String(group.studyMode)),
    );
    return {
      id: group.id,
      name: displayText(group.name),
      parentId: group.parentId,
      active: group.active,
      level: group.level as Group["level"],
      studyMode: group.studyMode as Group["studyMode"],
    };
  });
  expectValid(new Set(groups.map((group) => group.id)).size === groups.length);

  let lessonRange: Dictionaries["lessonRange"] = null;
  if (data.lessonRange != null) {
    const range = expectObject(data.lessonRange);
    expectValid(
      isDate(range.startDate) &&
        isDate(range.endDate) &&
        range.startDate <= range.endDate,
    );
    lessonRange = {
      startDate: range.startDate,
      endDate: range.endDate,
      weekOneName:
        displayText(range.weekOneName) === "—"
          ? "Tydzień A"
          : displayText(range.weekOneName),
      weekTwoName:
        displayText(range.weekTwoName) === "—"
          ? "Tydzień B"
          : displayText(range.weekTwoName),
    };
  }

  let generation: Dictionaries["generation"] = null;
  if (data.generation != null) {
    const current = expectObject(data.generation);
    expectValid(
      isUuid(current.id) &&
        isDate(current.sourceWeekOneDate) &&
        isDate(current.sourceWeekTwoDate),
    );
    generation = {
      id: current.id,
      sourceWeekOneDate: current.sourceWeekOneDate,
      sourceWeekTwoDate: current.sourceWeekTwoDate,
    };
  }

  return {
    groups,
    holidays,
    lessonRange,
    generation,
    studyModes: studyModes.filter((mode) =>
      (data.studyModes as unknown[]).includes(mode),
    ),
  };
}
