import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("application refuses to start without NEXT_PUBLIC_API_URL", () => {
  const result = spawnSync(
    process.execPath,
    ["-e", 'require("./next.config.js")'],
    {
      cwd: process.cwd(),
      env: { ...process.env, NEXT_PUBLIC_API_URL: "" },
      encoding: "utf8",
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Brak wymaganej zmiennej NEXT_PUBLIC_API_URL/);
});

test("API client refuses to create a relative URL without configuration", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      'import("./src/api/timetable/apiClient.ts")',
    ],
    {
      cwd: process.cwd(),
      env: { ...process.env, NEXT_PUBLIC_API_URL: "" },
      encoding: "utf8",
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Brak wymaganej zmiennej NEXT_PUBLIC_API_URL/);
});
