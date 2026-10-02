import test from "node:test";
import assert from "node:assert/strict";
import { buildTimetableGroups } from "../src/utils/buildTimetableGroups.ts";
import { buildExportSections } from "../src/modules/timetable/pdf/buildExportSections.ts";
import { paginateColumns } from "../src/modules/timetable/pdf/paginateColumns.ts";
import type { DisplayLesson } from "../src/modules/timetable/types/DisplayLesson.ts";
import type { Dictionaries } from "../src/modules/timetable/types/Dictionaries.ts";

const lesson = (
  id: string,
  overrides: Partial<DisplayLesson> = {},
): DisplayLesson => ({
  id,
  date: "2026-10-05",
  startTime: "08:00",
  endTime: "09:30",
  lessonHours: 2,
  groupId: "group-1",
  groupName: "Grupa 1",
  sourceLessonId: null,
  subjectName: "Ćwiczenia z matematyki",
  teacherName: "dr Anna Żółć",
  teacherTitle: "dr",
  teacherFirstName: "Anna",
  teacherLastName: "Żółć",
  roomName: "213",
  classTypeName: "Ćwiczenia",
  note: "",
  ...overrides,
});

const dictionaries: Dictionaries = {
  groups: [],
  studyModes: ["FULL_TIME", "PART_TIME"],
  holidays: [],
  lessonRange: null,
  generation: {
    id: "generation",
    sourceWeekOneDate: "2026-10-05",
    sourceWeekTwoDate: "2026-10-12",
  },
};

test("export uses A then B source ranges and rejects a missing week", () => {
  const sections = buildExportSections("FULL_TIME", "2026-12-07", dictionaries);
  assert.deepEqual(
    sections.map((section) => [section.title, section.range]),
    [
      ["Tydzień A", { from: "2026-10-05", to: "2026-10-09" }],
      ["Tydzień B", { from: "2026-10-12", to: "2026-10-16" }],
    ],
  );
  assert.throws(
    () =>
      buildExportSections("FULL_TIME", "2026-10-05", {
        ...dictionaries,
        generation: null,
      }),
    /tygodnia A/,
  );
  assert.throws(
    () =>
      buildExportSections("FULL_TIME", "2026-10-05", {
        ...dictionaries,
        generation: { ...dictionaries.generation!, sourceWeekTwoDate: "" },
      }),
    /tygodnia B/,
  );
});

test("weekend export respects the selected dates and the teaching period", () => {
  const [section] = buildExportSections(
    "PART_TIME",
    "2026-10-05",
    dictionaries,
  );
  assert.deepEqual(section.range, { from: "2026-10-10", to: "2026-10-11" });
  assert.throws(
    () => buildExportSections("PART_TIME", "2026-07-06", dictionaries),
    /poza okresem/,
  );
  assert.equal(
    buildExportSections("PART_TIME", "2029-06-25", dictionaries).length,
    1,
  );
});

test("screen and PDF groups filter before computing breaks, sort and deduplicate", () => {
  const early = lesson("1");
  const groups = buildTimetableGroups({
    studyMode: "FULL_TIME",
    selectedWeekStart: "2026-10-05",
    excludedGroups: ["excluded"],
    lessons: [
      lesson("3", { startTime: "11:00", endTime: "12:00" }),
      lesson("2", {
        groupId: "excluded",
        startTime: "09:30",
        endTime: "11:00",
      }),
      early,
      early,
      lesson("4", { date: "2026-10-06" }),
    ],
  });
  assert.equal(groups.length, 5);
  assert.equal(groups[0].label, "Poniedziałek");
  assert.deepEqual(
    groups[0].lessons.map((item) => [item.id, item.breakBefore]),
    [
      ["1", 0],
      ["3", 90],
    ],
  );
  assert.equal(groups[0].from, "08:00");
  assert.equal(groups[0].to, "12:00");
  assert.equal(groups[1].lessons[0].id, "4");
  assert.equal(groups[2].from, null);
  assert.equal(groups[2].emptyLabel, "Brak zajęć w tym dniu");
});

test("weekend columns contain only that weekend and retain outside-period labels", () => {
  const groups = buildTimetableGroups({
    studyMode: "PART_TIME",
    selectedWeekStart: "2029-06-25",
    excludedGroups: null,
    lessons: [
      lesson("1", { date: "2029-06-30" }),
      lesson("2", { date: "2029-07-01" }),
      lesson("3", { date: "2029-06-23" }),
    ],
  });
  assert.equal(groups.length, 2);
  assert.equal(groups[0].label, "Sobota 30.06");
  assert.deepEqual(
    groups[0].lessons.map((item) => item.id),
    ["1"],
  );
  assert.equal(groups[1].lessons.length, 0);
  assert.equal(groups[1].emptyLabel, "Poza okresem zajęć");
});

test("pagination retains whole blocks, day columns and lesson order on multiple pages", () => {
  const heights = [[40, 60, 30, 80], [], [100, 10], [10], []];
  const pages = paginateColumns(heights, 100);
  assert.deepEqual(pages, [
    [[0, 1], [], [0], [0], []],
    [[2], [], [1], [], []],
    [[3], [], [], [], []],
  ]);
  heights.forEach((blocks, column) => {
    assert.deepEqual(
      pages.flatMap((page) => page[column]),
      blocks.map((_, index) => index),
    );
    pages.forEach((page) =>
      assert.ok(
        page[column].reduce((sum, index) => sum + blocks[index], 0) <= 100,
      ),
    );
  });
});

test("empty weeks produce one page and exact boundary blocks fit", () => {
  assert.deepEqual(paginateColumns([[], [], [], [], []], 100), [
    [[], [], [], [], []],
  ]);
  assert.deepEqual(paginateColumns([[40, 60]], 100), [[[0, 1]]]);
  assert.deepEqual(paginateColumns([[100, 1]], 100), [[[0]], [[1]]]);
});

test("oversized blocks and invalid page measurements fail instead of losing content", () => {
  assert.throws(() => paginateColumns([[101]], 100), /Karta zajęć/);
  assert.throws(() => paginateColumns([[NaN]], 100), /Karta zajęć/);
  assert.throws(() => paginateColumns([[10]], 0), /Brak miejsca/);
});
