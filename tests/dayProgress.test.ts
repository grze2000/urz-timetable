import assert from "node:assert/strict";
import test from "node:test";
import { appNow } from "../src/utils/appNow.ts";
import { todayInWarsaw } from "../src/utils/date.ts";
import {
  dayClock,
  remainingDay,
  remainingBreak,
  segmentProgress,
  timelineScrollTop,
} from "../src/utils/dayProgress.ts";

test("day clock uses Warsaw time including DST and seconds", () => {
  assert.equal(dayClock(new Date("2026-10-15T10:30:30Z")), 750.5);
  assert.equal(dayClock(new Date("2026-12-15T10:30:00Z")), 690);
  assert.equal(dayClock(new Date("2026-10-15T22:00:00Z")), 0);
});

test("development override changes both current date and time and ignores invalid values", () => {
  const now = new Date("2026-10-15T10:30:00Z");
  const override = "2026-12-31T23:59:00+01:00";
  const fixed = appNow(now, "development", override);
  assert.equal(todayInWarsaw(fixed), "2026-12-31");
  assert.equal(dayClock(fixed), 1439);
  assert.equal(
    appNow(new Date("2027-01-01T12:00:00Z"), "development", override).getTime(),
    fixed.getTime(),
  );
  const midnight = appNow(now, "development", "2027-01-01T00:00:00+01:00");
  assert.equal(todayInWarsaw(midnight), "2027-01-01");
  assert.equal(dayClock(midnight), 0);
  for (const value of [null, "", "invalid", "2026-13-15T12:00:00+02:00"]) {
    assert.equal(appNow(now, "development", value), now);
  }
  assert.equal(appNow(now, "production", override), now);
  assert.equal(appNow(now, "test", override), now);
});

test("segment fills proportionally and clamps at lesson and break boundaries", () => {
  assert.equal(segmentProgress(500, 600, 690), 0);
  assert.equal(segmentProgress(600, 600, 690), 0);
  assert.equal(segmentProgress(645, 600, 690), 0.5);
  assert.equal(segmentProgress(690, 600, 690), 1);
  assert.equal(segmentProgress(900, 600, 690), 1);
  assert.equal(segmentProgress(600, 600, 600), 1);
});

test("day countdown uses the latest end, rounds up and disappears at the end", () => {
  const ends = ["13:00", "12:30", "14:00"];
  assert.equal(remainingDay(600, ends), "4 h 0 min do końca");
  assert.equal(remainingDay(765, ends), "1 h 15 min do końca");
  assert.equal(remainingDay(825, ends), "15 min do końca");
  assert.equal(remainingDay(839.5, ends), "1 min do końca");
  assert.equal(remainingDay(840, ends), null);
  assert.equal(remainingDay(900, ends), null);
  assert.equal(remainingDay(600, []), null);
});

test("break countdown is active only within a real break and rounds minutes up", () => {
  assert.equal(remainingBreak(599, 720, 120), null);
  assert.equal(remainingBreak(600, 720, 120), "Pozostało Ci 2 h 0 min przerwy");
  assert.equal(
    remainingBreak(655.5, 720, 120),
    "Pozostało Ci 1 h 5 min przerwy",
  );
  assert.equal(remainingBreak(660, 720, 120), "Pozostało Ci 1 h 0 min przerwy");
  assert.equal(remainingBreak(719.5, 720, 120), "Pozostało Ci 1 min przerwy");
  assert.equal(remainingBreak(720, 720, 120), null);
  assert.equal(remainingBreak(750, 720, 120), null);
  assert.equal(remainingBreak(600, 720, 0), null);
});

test("scroll follows the current segment, clamps at the bottom and handles overlap", () => {
  const segments = [
    { start: 600, end: 660, top: 30, height: 180 },
    { start: 660, end: 690, top: 210, height: 40 },
    { start: 690, end: 780, top: 250, height: 180 },
  ];
  assert.equal(timelineScrollTop(segments, 590, 300), 0);
  assert.equal(timelineScrollTop(segments, 630, 300), 120);
  assert.equal(timelineScrollTop(segments, 675, 300), 230);
  assert.equal(timelineScrollTop(segments, 690, 300), 250);
  assert.equal(timelineScrollTop(segments, 770, 300), 300);
  assert.equal(timelineScrollTop(segments, 800, 300), 300);
  assert.equal(timelineScrollTop(segments, 630, 0), 0);
  assert.equal(timelineScrollTop([], 630, 300), 0);
  const overlap = [
    segments[0],
    { start: 600, end: 800, top: 210, height: 180 },
  ];
  assert.equal(timelineScrollTop(overlap, 630, 300), 120);
  assert.equal(timelineScrollTop(overlap, 790, 300), 300);
});
