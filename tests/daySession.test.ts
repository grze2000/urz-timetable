import assert from "node:assert/strict";
import test from "node:test";
import { resolveSelectedDay } from "../src/utils/resolveSelectedDay.ts";
import { useDaySession } from "../src/store/useDaySession.ts";

test("a new session defaults to the first available day and keeps a selected date in memory", () => {
  assert.equal(useDaySession.getInitialState().selectedDate, null);
  const firstVisit = useDaySession.getState();
  firstVisit.selectDate("2026-10-15");
  const returnToDay = useDaySession.getState();
  assert.equal(returnToDay.selectedDate, "2026-10-15");
  assert.equal(
    resolveSelectedDay(
      returnToDay.selectedDate,
      ["2026-10-14", "2026-10-15"],
      "2026-10-14",
    ),
    1,
  );
  assert.equal(
    resolveSelectedDay(
      useDaySession.getInitialState().selectedDate,
      ["2026-10-14", "2026-10-15"],
      "2026-10-14",
    ),
    0,
  );
  returnToDay.selectDate(null);
});

test("selection follows its date when the calendar shifts instead of keeping an old index", () => {
  assert.equal(
    resolveSelectedDay(
      "2026-10-15",
      ["2026-10-13", "2026-10-14", "2026-10-15"],
      "2026-10-13",
    ),
    2,
  );
  assert.equal(
    resolveSelectedDay(
      "2026-10-15",
      ["2026-10-14", "2026-10-15", "2026-10-16"],
      "2026-10-14",
    ),
    1,
  );
  assert.equal(
    resolveSelectedDay(
      "2026-10-15",
      ["2026-10-15", "2026-10-16"],
      "2026-10-15",
    ),
    0,
  );
});

test("past, malformed and out-of-range dates fall back to the current calendar", () => {
  const dates = ["2026-10-15", "2026-10-16", "2026-10-19"];
  for (const date of [
    null,
    "",
    "invalid",
    "2026-02-30",
    "2026-10-14",
    "2026-10-20",
  ]) {
    assert.equal(resolveSelectedDay(date, dates, "2026-10-15"), 0);
  }
  assert.equal(
    resolveSelectedDay("2026-10-14", ["2026-10-14", ...dates], "2026-10-15"),
    0,
  );
  assert.equal(resolveSelectedDay("2026-10-19", dates, "2026-10-15"), 2);
});

test("a weekend selection is rejected when switching to a weekday-only calendar", () => {
  const fullTime = ["2026-10-16", "2026-10-19", "2026-10-20"];
  const partTime = ["2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19"];
  assert.equal(resolveSelectedDay("2026-10-17", partTime, "2026-10-16"), 1);
  assert.equal(resolveSelectedDay("2026-10-17", fullTime, "2026-10-16"), 0);
  assert.equal(resolveSelectedDay("2026-10-20", partTime, "2026-10-16"), 0);
});

test("selection validates correctly across year boundaries", () => {
  const dates = ["2026-12-31", "2027-01-01", "2027-01-04"];
  assert.equal(resolveSelectedDay("2027-01-04", dates, "2026-12-31"), 2);
  assert.equal(
    resolveSelectedDay("2026-12-31", dates.slice(1), "2027-01-01"),
    0,
  );
});
