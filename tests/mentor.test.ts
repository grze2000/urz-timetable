import test from "node:test";
import assert from "node:assert/strict";
import { parseDictionaries } from "../src/api/timetable/parseDictionaries.ts";
import { parseLessons } from "../src/api/timetable/parseLessons.ts";
import {
  getLessons,
  IncompleteScheduleError,
} from "../src/api/timetable/getLessons.ts";
import type { Group } from "../src/modules/timetable/types/Group.ts";
import type { Dictionaries } from "../src/modules/timetable/types/Dictionaries.ts";
import type { Lesson } from "../src/modules/timetable/types/Lesson.ts";
import {
  addDays,
  isWithinTeachingPeriod,
  todayInWarsaw,
} from "../src/utils/date.ts";
import { getWeekTypeFromDate } from "../src/utils/getWeekTypeFromDate.ts";
import { templateRange } from "../src/utils/getTemplateRange.ts";
import { sortLessons } from "../src/utils/sortLessons.ts";
import {
  majorOptions,
  specializationOptions,
  validSelection,
} from "../src/utils/getStudyOptions.ts";
import { withGroupName } from "../src/utils/withGroupName.ts";
import { withBreaks } from "../src/utils/withBreaks.ts";
import { teacherParts } from "../src/utils/getTeacherParts.ts";
import {
  emptyPreferences,
  readPreferences,
  preferencesFromLink,
  createShareUrl,
} from "../src/store/preferences.ts";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const groups: Group[] = [
  {
    id: id(1),
    name: "Kierunek",
    parentId: null,
    level: "COURSE",
    studyMode: "FULL_TIME",
    active: true,
  },
  {
    id: id(2),
    name: "Specjalność",
    parentId: id(1),
    level: "SPECIALIZATION",
    studyMode: "UNASSIGNED",
    active: true,
  },
  {
    id: id(3),
    name: "Grupa 1",
    parentId: id(2),
    level: "GROUP",
    studyMode: "UNASSIGNED",
    active: true,
  },
  {
    id: id(4),
    name: "Warsztat 1",
    parentId: id(3),
    level: "WORKSHOP",
    studyMode: "UNASSIGNED",
    active: true,
  },
  {
    id: id(5),
    name: "Grupa 1",
    parentId: id(2),
    level: "GROUP",
    studyMode: "UNASSIGNED",
    active: true,
  },
  {
    id: id(6),
    name: "Niestacjonarne",
    parentId: null,
    level: "COURSE",
    studyMode: "PART_TIME",
    active: true,
  },
];
const dictionaries: Dictionaries = {
  groups,
  studyModes: ["FULL_TIME", "PART_TIME"],
  lessonRange: null,
  generation: {
    id: id(9),
    sourceWeekOneDate: "2026-09-28",
    sourceWeekTwoDate: "2026-10-05",
  },
};
const preferences = {
  ...emptyPreferences(),
  majorId: id(1),
  specializationIds: [id(2)],
};
const lesson = (n: number, overrides: Partial<Lesson> = {}): Lesson => ({
  id: id(n),
  date: "2026-09-28",
  startTime: "08:00",
  endTime: "09:30",
  lessonHours: 2,
  groupId: id(2),
  sourceLessonId: null,
  subjectName: "Przedmiot",
  teacherName: "dr Anna Nowak",
  teacherTitle: "dr",
  teacherFirstName: "Anna",
  teacherLastName: "Nowak",
  roomName: "213",
  classTypeName: "Wykład",
  note: "—",
  ...overrides,
});

test("Warsaw date and calendar arithmetic handle timezones, DST and leap years", () => {
  assert.equal(todayInWarsaw(new Date("2026-09-25T22:30:00Z")), "2026-09-26");
  assert.equal(addDays("2026-10-25", 1), "2026-10-26");
  assert.equal(addDays("2026-03-29", 1), "2026-03-30");
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
});
test("the teaching period runs from October through June in every year", () => {
  assert.equal(isWithinTeachingPeriod("2026-09-30"), false);
  assert.equal(isWithinTeachingPeriod("2026-10-01"), true);
  assert.equal(isWithinTeachingPeriod("2026-12-31"), true);
  assert.equal(isWithinTeachingPeriod("2027-01-01"), true);
  assert.equal(isWithinTeachingPeriod("2027-06-30"), true);
  assert.equal(isWithinTeachingPeriod("2027-07-01"), false);
  assert.equal(isWithinTeachingPeriod("2027-09-30"), false);
  assert.equal(isWithinTeachingPeriod("2027-10-01"), true);
  assert.equal(isWithinTeachingPeriod("2028-06-30"), true);
});
test("A/B uses source metadata and missing configuration is not invented", () => {
  assert.equal(getWeekTypeFromDate("2026-09-28", dictionaries.generation), 1);
  assert.equal(getWeekTypeFromDate("2026-10-05", dictionaries.generation), 2);
  assert.equal(getWeekTypeFromDate("2026-10-12", dictionaries.generation), 1);
  assert.equal(getWeekTypeFromDate("2026-09-21", dictionaries.generation), 2);
  assert.equal(getWeekTypeFromDate("2026-10-25", null), null);
  assert.deepEqual(templateRange(dictionaries, "B"), {
    from: "2026-10-05",
    to: "2026-10-09",
  });
  assert.equal(templateRange({ ...dictionaries, generation: null }, "A"), null);
});
test("existing course and specialty controls receive only valid active full-time options", () => {
  assert.deepEqual(majorOptions(dictionaries), [
    { value: id(1), label: "Kierunek" },
  ]);
  assert.deepEqual(specializationOptions(dictionaries, id(1)), [
    { value: id(2), label: "Specjalność" },
  ]);
  assert.deepEqual(specializationOptions(dictionaries, id(6)), []);
});
test("cards use Mentor lesson fields and the API end time", () => {
  const result = withGroupName(lesson(50, { endTime: "09:40" }), groups);
  assert.equal(result.startTime, "08:00");
  assert.equal(result.endTime, "09:40");
  assert.equal(result.subjectName, "Przedmiot");
  assert.equal(result.roomName, "213");
  assert.equal(result.groupName, "Specjalność");
  assert.deepEqual(teacherParts(result), ["dr", "Anna", "Nowak"]);
  assert.deepEqual(
    teacherParts(
      lesson(51, {
        teacherName: "—",
        teacherTitle: "—",
        teacherFirstName: "—",
        teacherLastName: "—",
      }),
    ),
    ["", "—", ""],
  );
});
test("same-name groups retain distinct UUIDs; workshop labels include their parent", () => {
  const first = withGroupName(lesson(50, { groupId: id(3) }), groups);
  const second = withGroupName(lesson(51, { groupId: id(5) }), groups);
  assert.equal(first.groupName, second.groupName);
  assert.notEqual(first.groupId, second.groupId);
  assert.equal(
    withGroupName(lesson(52, { groupId: id(4) }), groups).groupName,
    "Grupa 1 / Warsztat 1",
  );
});
test("personal marking keeps its identity across source and generated records", () => {
  const source = lesson(50);
  const dated = lesson(51, { sourceLessonId: id(50), date: "2026-10-12" });
  assert.equal(
    source.sourceLessonId ?? source.id,
    dated.sourceLessonId ?? dated.id,
  );
  assert.notEqual(source.id, dated.id);
});
test("new UUID settings and links validate parent membership and reject legacy links", () => {
  assert.equal(validSelection(preferences, dictionaries), true);
  assert.equal(
    validSelection(
      { ...preferences, specializationIds: [id(3)] },
      dictionaries,
    ),
    false,
  );
  assert.equal(
    readPreferences({ majorId: "old", specializationIds: ["old"] }).majorId,
    null,
  );
  assert.equal(
    preferencesFromLink(
      new URLSearchParams("majorId=1&specializationIds=2"),
      dictionaries,
    ),
    null,
  );
  const shared = createShareUrl(
    "https://example.org/timetable?old=1#old",
    preferences,
  );
  assert.deepEqual(
    preferencesFromLink(new URL(shared).searchParams, dictionaries),
    { ...preferences, excludedGroups: [] },
  );
  assert.equal(new URL(shared).searchParams.has("old"), false);
  const params = new URLSearchParams({
    api: "mentor-ab",
    majorId: id(1),
    specializationIds: id(2),
    excludedGroups: id(3),
  });
  assert.deepEqual(preferencesFromLink(params, dictionaries), {
    ...preferences,
    excludedGroups: [id(3)],
  });
  params.set("excludedGroups", id(6));
  assert.equal(preferencesFromLink(params, dictionaries), null);
});
test("deduplication uses UUID and deterministic chronological order", () => {
  assert.deepEqual(
    sortLessons([lesson(51), lesson(50), lesson(51)]).map((l) => l.id),
    [id(50), id(51)],
  );
});
test("breaks are calculated after sorting and overlapping classes", () => {
  const rows = [
    lesson(53, { startTime: "10:00", endTime: "11:00" }),
    lesson(51, { startTime: "08:00", endTime: "10:30" }),
    lesson(52, { startTime: "09:00", endTime: "09:45" }),
    lesson(54, { startTime: "11:30", endTime: "12:00" }),
  ].map((row) => withGroupName(row, groups));
  assert.deepEqual(
    withBreaks(rows).map((row) => [row.id, row.breakBefore]),
    [
      [id(51), 0],
      [id(52), 0],
      [id(53), 0],
      [id(54), 30],
    ],
  );
});
test("breaks reset when the next date starts", () => {
  const rows = [
    lesson(55, { date: "2026-09-29", startTime: "08:00", endTime: "09:30" }),
    lesson(56, { date: "2026-09-28", startTime: "16:00", endTime: "17:30" }),
  ].map((row) => withGroupName(row, groups));
  assert.deepEqual(
    withBreaks(rows).map((row) => [row.date, row.breakBefore]),
    [
      ["2026-09-28", 0],
      ["2026-09-29", 0],
    ],
  );
});
test("parsers accept additional fields and optional text but reject malformed core fields", () => {
  assert.equal(
    parseDictionaries({ ...dictionaries, extra: true }).groups.length,
    6,
  );
  assert.throws(() =>
    parseDictionaries({
      ...dictionaries,
      groups: [{ ...groups[0], id: "bad" }],
    }),
  );
  const raw = {
    ...lesson(50),
    subject: { name: "Test" },
    teacher: null,
    note: null,
  };
  assert.equal(parseLessons([raw])[0].subjectName, "Test");
  assert.equal(parseLessons([raw])[0].teacherName, "—");
  const { sourceLessonId: _sourceLessonId, ...withoutSource } = raw;
  assert.equal(_sourceLessonId, null);
  assert.equal(parseLessons([withoutSource])[0].sourceLessonId, null);
  assert.throws(() => parseLessons([{ ...raw, startTime: "24:90" }]));
  assert.throws(() => parseLessons([{ ...raw, date: "2026-02-30" }]));
  assert.throws(() => parseLessons({ data: [raw] }));
});
test("actual-day requests keep the requested date and merge specialty UUIDs", async () => {
  const calls: string[] = [];
  const result = await getLessons(
    {
      specializationIds: [id(3), id(2), id(2)],
      from: "2026-09-28",
      to: "2026-09-28",
    },
    async (p) => {
      calls.push(p.groupId);
      assert.equal(p.limit, 5000);
      assert.equal(p.from, p.to);
      return [lesson(50), lesson(p.groupId === id(2) ? 51 : 52)];
    },
  );
  assert.deepEqual(calls, [id(2), id(3)]);
  assert.equal(result.length, 3);
});
test("truncation splits dates without overlaps or returning the truncated response", async () => {
  const result = await getLessons(
    { specializationIds: [id(2)], from: "2026-09-28", to: "2026-09-29" },
    async (p) => {
      return p.from !== p.to
        ? Array.from({ length: 5000 }, () => lesson(90))
        : [lesson(p.from.endsWith("28") ? 50 : 51, { date: p.from })];
    },
  );
  assert.deepEqual(
    result.map((l) => l.date),
    ["2026-09-28", "2026-09-29"],
  );
});
test("incomplete days, failed requests and cancellation never become empty successful plans", async () => {
  await assert.rejects(
    getLessons(
      { specializationIds: [id(2)], from: "2026-09-28", to: "2026-09-28" },
      async () => Array.from({ length: 5000 }, () => lesson(50)),
    ),
    IncompleteScheduleError,
  );
  await assert.rejects(
    getLessons(
      {
        specializationIds: [id(2), id(3)],
        from: "2026-09-28",
        to: "2026-09-28",
      },
      async (p) => {
        if (p.groupId === id(3)) throw new Error("network");
        return [lesson(50)];
      },
    ),
    /network/,
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    getLessons(
      {
        specializationIds: [id(2)],
        from: "2026-09-28",
        to: "2026-09-28",
        signal: controller.signal,
      },
      async () => [],
    ),
  );
  await assert.rejects(
    getLessons(
      { specializationIds: [id(2)], from: "2026-09-28", to: "2026-09-28" },
      async () => [lesson(50, { date: "2026-10-01" })],
    ),
    /spoza/,
  );
});
