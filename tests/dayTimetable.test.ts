import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test, { before } from "node:test";
import { build } from "esbuild";
import { QueryClient } from "@tanstack/react-query";
import type { Dictionaries } from "../src/modules/timetable/types/Dictionaries.ts";
import type { DisplayLesson } from "../src/modules/timetable/types/DisplayLesson.ts";
import type { Preferences } from "../src/store/preferences.ts";
import { emptyPreferences } from "../src/store/preferences.ts";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const dictionaries: Dictionaries = {
  groups: [
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
  ],
  holidays: [],
  studyModes: ["FULL_TIME", "PART_TIME"],
  lessonRange: null,
  generation: {
    id: id(9),
    sourceWeekOneDate: "2026-09-28",
    sourceWeekTwoDate: "2026-10-05",
  },
};

const preferences: Preferences = {
  ...emptyPreferences(),
  majorId: id(1),
  specializationIds: [id(2)],
};

const lesson = (
  n: number,
  overrides: Partial<DisplayLesson> = {},
): DisplayLesson => ({
  id: id(n),
  date: "2026-10-01",
  startTime: "09:45",
  endTime: "11:15",
  lessonHours: 2,
  groupId: id(2),
  groupName: "Specjalność",
  sourceLessonId: null,
  subjectName: "Metodologia ze wzorca",
  teacherName: "dr Anna Nowak",
  teacherTitle: "dr",
  teacherFirstName: "Anna",
  teacherLastName: "Nowak",
  roomName: "213",
  classTypeName: "Wykład",
  note: "—",
  ...overrides,
});

type Runtime = {
  fixture: {
    date: string;
    dates?: string[];
    savedDate: string | null;
    preferences: Preferences;
    online: boolean;
  };
  apiHost: string;
  apiClient: typeof import("../src/api/timetable/apiClient.ts").apiClient;
  timetableQueryOptions: typeof import("../src/api/timetable/getTimetable.ts").timetableQueryOptions;
  render: (client: QueryClient) => string;
};

// Keep the real page, query hooks and renderer; control only the selected day,
// stored preferences and connection status without a browser or live API.
let runtime: Runtime;
before(async () => {
  const result = await build({
    stdin: {
      contents: `
      import { createElement } from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { QueryClientProvider } from "@tanstack/react-query";
      import { MantineProvider } from "@mantine/core";
      import MyDay from "./src/app/day/page.tsx";
      export { fixture } from "day-test-fixture";
      export { apiHost, apiClient } from "./src/api/timetable/apiClient.ts";
      export { timetableQueryOptions } from "./src/api/timetable/getTimetable.ts";
      export function render(client) {
        return renderToStaticMarkup(
          createElement(QueryClientProvider, { client },
            createElement(MantineProvider, null, createElement(MyDay)))
        );
      }
    `,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    packages: "external",
    platform: "node",
    format: "cjs",
    write: false,
    plugins: [
      {
        name: "day-fixture",
        setup(plugin) {
          plugin.onResolve({ filter: /^day-test-fixture$/ }, () => ({
            path: "fixture",
            namespace: "day-test",
          }));
          plugin.onLoad({ filter: /.*/, namespace: "day-test" }, () => ({
            contents: "export const fixture = {};",
          }));
          plugin.onLoad({ filter: /\/store\/useAppState\.ts$/ }, () => ({
            contents: `
            import { fixture } from "day-test-fixture";
            export const useAppState = () => fixture.preferences;
          `,
          }));
          plugin.onLoad({ filter: /\/store\/useDaySession\.ts$/ }, () => ({
            contents: `
              import { fixture } from "day-test-fixture";
              export const useDaySession = () => ({
                selectedDate: fixture.savedDate,
                selectDate: (date) => { fixture.savedDate = date; }
              });
            `,
          }));
          plugin.onLoad({ filter: /\/utils\/useOnlineStatus\.ts$/ }, () => ({
            contents: `
            import { fixture } from "day-test-fixture";
            export const useOnlineStatus = () => fixture.online;
          `,
          }));
          plugin.onLoad({ filter: /\/utils\/getNextDays\.ts$/ }, () => ({
            contents: `
            import { fixture } from "day-test-fixture";
            export const getNextDays = () => (fixture.dates ?? [fixture.date]).map((date) => ({
              date: new Date(date + "T12:00:00Z"),
              day: date.slice(8),
              label: date,
              weekday: "dzień"
            }));
          `,
          }));
        },
      },
    ],
  });
  const bundledModule = { exports: {} as Runtime };
  new Function("require", "module", "exports", result.outputFiles[0].text)(
    createRequire(import.meta.url),
    bundledModule,
    bundledModule.exports,
  );
  runtime = bundledModule.exports;
});

function setup(
  date = "2026-10-15",
  data = dictionaries,
  selection = preferences,
) {
  Object.assign(runtime.fixture, {
    date,
    dates: undefined,
    savedDate: null,
    preferences: selection,
    online: true,
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, retryOnMount: false } },
  });
  client.setQueryData(["mentor", runtime.apiHost, "dictionaries"], data);
  return client;
}

test("My Day restores the selected calendar date on repeated visits and rejects dates outside its range", () => {
  const client = setup("2099-10-15");
  runtime.fixture.dates = ["2099-10-15", "2099-10-16", "2099-10-19"];
  runtime.fixture.savedDate = "2099-10-16";
  for (let visit = 0; visit < 2; visit++) {
    assert.match(runtime.render(client), /<span>2099-10-16 <\/span>/);
  }
  runtime.fixture.savedDate = "2099-10-20";
  assert.match(runtime.render(client), /<span>2099-10-15 <\/span>/);
  runtime.fixture.savedDate = "2020-10-15";
  assert.match(runtime.render(client), /<span>2099-10-15 <\/span>/);
  runtime.fixture.savedDate = null;
  assert.match(runtime.render(client), /<span>2099-10-15 <\/span>/);
  client.clear();
});

test("My Day shares the A/B cache and shows source records instead of dated lessons", () => {
  const client = setup();
  const a = runtime.timetableQueryOptions(
    { ...preferences, week: 1 },
    dictionaries,
  );
  const source = lesson(10);
  const later = lesson(11, {
    startTime: "13:15",
    endTime: "14:45",
    subjectName: "Angielski ze wzorca",
  });
  client.setQueryData(a.queryKey, [source, later]);
  const dated = runtime.timetableQueryOptions(
    { ...preferences, week: 1, date: "2026-10-15" },
    dictionaries,
  );
  client.setQueryData(dated.queryKey, [
    lesson(12, {
      date: "2026-10-15",
      subjectName: "Inny przyszły plan",
    }),
  ]);

  const html = runtime.render(client);
  assert.match(html, /Metodologia ze wzorca/);
  assert.match(html, /Angielski ze wzorca/);
  assert.match(html, /2 lekcje/);
  assert.match(html, /2 h 0 min/);
  assert.doesNotMatch(html, /Inny przyszły plan/);
  assert.equal(client.getQueryData<DisplayLesson[]>(a.queryKey)?.[0], source);

  runtime.fixture.date = "2026-10-22";
  const b = runtime.timetableQueryOptions(
    { ...preferences, week: 2 },
    dictionaries,
  );
  client.setQueryData(b.queryKey, [
    lesson(13, {
      date: "2026-10-08",
      subjectName: "Plan B",
    }),
  ]);
  runtime.fixture.online = false;
  assert.match(runtime.render(client), /Plan B/);
  assert.doesNotMatch(runtime.render(client), /Metodologia ze wzorca/);
  client.clear();
});

test("week queries request the configured API ranges and share their key across days", async () => {
  const client = setup();
  const requests: unknown[] = [];
  const originalAdapter = runtime.apiClient.defaults.adapter;
  runtime.apiClient.defaults.adapter = async (config) => {
    requests.push(config.params);
    return { data: [], status: 200, statusText: "OK", headers: {}, config };
  };
  try {
    const a = runtime.timetableQueryOptions(
      { ...preferences, week: 1 },
      dictionaries,
    );
    const b = runtime.timetableQueryOptions(
      { ...preferences, week: 2 },
      dictionaries,
    );
    await client.fetchQuery(a);
    await client.fetchQuery(b);
    assert.deepEqual(requests, [
      { groupId: id(2), from: "2026-09-28", to: "2026-10-02", limit: 5000 },
      { groupId: id(2), from: "2026-10-05", to: "2026-10-09", limit: 5000 },
    ]);
    runtime.render(client);
    runtime.fixture.date = "2026-10-16";
    runtime.render(client);
    runtime.fixture.date = "2026-10-22";
    runtime.render(client);
    assert.equal(
      client.getQueryCache().findAll({ queryKey: ["mentor-ab"] }).length,
      2,
    );
    assert.equal(requests.length, 2);
  } finally {
    runtime.apiClient.defaults.adapter = originalAdapter;
    client.clear();
  }
});

test("My Day follows changed template metadata without using the old source dates", () => {
  const data: Dictionaries = {
    ...dictionaries,
    generation: {
      ...dictionaries.generation!,
      sourceWeekOneDate: "2026-10-12",
      sourceWeekTwoDate: "2026-10-19",
    },
  };
  const client = setup("2026-10-29", data);
  const options = runtime.timetableQueryOptions(
    { ...preferences, week: 1 },
    data,
  );
  client.setQueryData(options.queryKey, [
    lesson(10, { date: "2026-10-01", subjectName: "Stary wzorzec" }),
    lesson(11, { date: "2026-10-15", subjectName: "Nowy wzorzec" }),
  ]);
  const html = runtime.render(client);
  assert.match(html, /Nowy wzorzec/);
  assert.doesNotMatch(html, /Stary wzorzec/);
  client.clear();
});

test("My Day respects excluded groups and source lesson exclusions", () => {
  const client = setup("2026-10-15", dictionaries, {
    ...preferences,
    excludedGroups: [id(3)],
    excludedLessons: [id(20)],
  });
  const options = runtime.timetableQueryOptions(
    { ...preferences, week: 1 },
    dictionaries,
  );
  client.setQueryData(options.queryKey, [
    lesson(10, { sourceLessonId: id(20) }),
    lesson(11, { groupId: id(3), subjectName: "Wykluczona grupa" }),
  ]);
  const html = runtime.render(client);
  assert.match(html, /Metodologia ze wzorca/);
  assert.match(html, /line-through/);
  assert.match(html, /0 lekcji/);
  assert.doesNotMatch(html, /Wykluczona grupa/);
  client.clear();
});

test("holidays and vacations use the selected date rather than the template date", () => {
  for (const date of ["2026-10-15", "2027-07-15"]) {
    const data = {
      ...dictionaries,
      holidays: [{ date: "2026-10-15", name: "Dzień wolny" }],
    };
    const client = setup(date, data);
    const options = runtime.timetableQueryOptions(
      { ...preferences, week: 1 },
      data,
    );
    client.setQueryData(options.queryKey, [lesson(10)]);
    const html = runtime.render(client);
    assert.match(
      html,
      date === "2026-10-15" ? /Dzień wolny/ : /Trwają wakacje/,
    );
    assert.doesNotMatch(html, /Metodologia ze wzorca/);
    client.clear();
  }
});

test("missing generation reports configuration failure even offline, without a dated fallback", () => {
  const client = setup("2026-10-15", { ...dictionaries, generation: null });
  runtime.fixture.online = false;
  assert.match(
    runtime.render(client),
    /Nie skonfigurowano tygodni wzorcowych w API/,
  );
  const query = client.getQueryCache().findAll({ queryKey: ["mentor-ab"] })[0];
  assert.deepEqual(query.queryKey.slice(-2), [undefined, undefined]);
  assert.equal(query.state.fetchStatus, "idle");
  client.clear();
});

test("an uncached full-time week has a template-specific offline message", () => {
  const client = setup();
  const options = runtime.timetableQueryOptions(
    { ...preferences, week: 1 },
    dictionaries,
  );
  client
    .getQueryCache()
    .build(client, { queryKey: options.queryKey })
    .setState({
      status: "error",
      error: new Error("Offline"),
    });
  runtime.fixture.online = false;
  assert.match(
    runtime.render(client),
    /Brak zapisanych danych dla tego tygodnia wzorcowego/,
  );
  client.clear();
});

test("part-time My Day continues to use actual dates without generation", () => {
  const data: Dictionaries = {
    ...dictionaries,
    generation: null,
    groups: dictionaries.groups.map((group) => ({
      ...group,
      studyMode: group.level === "COURSE" ? "PART_TIME" : "UNASSIGNED",
    })),
  };
  const selection: Preferences = { ...preferences, studyMode: "PART_TIME" };
  const client = setup("2026-10-17", data, selection);
  const options = runtime.timetableQueryOptions(
    { ...selection, week: 1, date: "2026-10-17" },
    data,
  );
  client.setQueryData(options.queryKey, [lesson(10, { date: "2026-10-17" })]);
  const html = runtime.render(client);
  assert.match(html, /Metodologia ze wzorca/);
  assert.doesNotMatch(html, /Nie skonfigurowano/);
  client.clear();
});
