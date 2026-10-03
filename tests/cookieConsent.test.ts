import assert from "node:assert/strict";
import test from "node:test";
import {
  getConsentSnapshot,
  saveConsentSnapshot,
  subscribeConsent,
} from "../src/privacy/consentStorage.ts";
import {
  analyticsCookieNames,
  consentLifetimeMs,
  cookieDomains,
  cookiePaths,
  createConsent,
  parseConsent,
  readConsentCookie,
  serializeConsentCookie,
} from "../src/privacy/consent.ts";

const now = Date.UTC(2026, 9, 3);
const gaId = "G-TEST000001";

test("deleting a cookie immediately after saving consent notifies subscribers", () => {
  const names = ["window", "document", "BroadcastChannel"] as const;
  const originals = names.map((name) =>
    Object.getOwnPropertyDescriptor(globalThis, name),
  );
  let cookieHeader = "";
  let poll: (() => void) | undefined;
  const cookieDocument = {
    get cookie() {
      return cookieHeader;
    },
    set cookie(value: string) {
      cookieHeader = value.includes("Max-Age=0;") ? "" : value.split(";")[0];
    },
  };
  let unsubscribe: (() => void) | undefined;
  try {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: cookieDocument,
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { protocol: "https:" },
        setInterval: (callback: () => void) => {
          poll = callback;
          return 1;
        },
        clearInterval: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
    Object.defineProperty(globalThis, "BroadcastChannel", {
      configurable: true,
      value: class {
        constructor() {
          throw new Error("unavailable");
        }
      },
    });
    let notifications = 0;
    unsubscribe = subscribeConsent(() => {
      notifications += 1;
    });
    saveConsentSnapshot(JSON.stringify(createConsent(true, gaId)));
    assert.equal(notifications, 1);
    assert.ok(getConsentSnapshot());
    cookieHeader = "";
    poll?.();
    assert.equal(notifications, 2);
    assert.equal(getConsentSnapshot(), null);
  } finally {
    unsubscribe?.();
    names.forEach((name, index) => {
      const original = originals[index];
      if (original) Object.defineProperty(globalThis, name, original);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
});

test("consent cookie encodes the choice and restricts its scope and lifetime", () => {
  const record = createConsent(true, gaId, now);
  const cookie = serializeConsentCookie(record, true, now);
  assert.equal(
    readConsentCookie(`other=value; ${cookie.split(";")[0]}`),
    JSON.stringify(record),
  );
  assert.match(cookie, /; Path=\//);
  assert.match(cookie, /; SameSite=Lax/);
  assert.match(cookie, /; Max-Age=15552000;/);
  assert.match(cookie, /; Secure$/);
  assert.doesNotMatch(cookie, /; Domain=/);
  assert.doesNotMatch(serializeConsentCookie(record, false, now), /; Secure/);
  assert.match(serializeConsentCookie(null, true, now), /; Max-Age=0;/);
  assert.equal(readConsentCookie("urz-timetable-cookie-consent=%broken"), null);
  assert.equal(readConsentCookie("other=value"), null);
});

test("analytics requires an explicit valid choice for the configured service", () => {
  for (const raw of [null, "", "true", "{}", "broken", "null"]) {
    assert.equal(parseConsent(raw, gaId, now), null);
  }
  const accepted = createConsent(true, gaId, now);
  assert.deepEqual(parseConsent(JSON.stringify(accepted), gaId, now), accepted);
  assert.equal(parseConsent(JSON.stringify(accepted), "G-CHANGED", now), null);
  assert.equal(parseConsent(JSON.stringify(accepted), null, now), null);
});

test("acceptance and refusal have the same retention and remain distinct", () => {
  const refused = createConsent(false, gaId, now);
  const accepted = createConsent(true, gaId, now);
  assert.equal(refused.expiresAt, accepted.expiresAt);
  assert.equal(
    parseConsent(JSON.stringify(refused), gaId, now)?.analytics,
    false,
  );
  assert.equal(
    parseConsent(JSON.stringify(accepted), gaId, now + consentLifetimeMs - 1)
      ?.analytics,
    true,
  );
  assert.equal(
    parseConsent(JSON.stringify(accepted), gaId, now + consentLifetimeMs),
    null,
  );
});

test("old notices and malformed or future dates cannot authorize analytics", () => {
  const accepted = createConsent(true, gaId, now);
  for (const changes of [
    { version: 0 },
    { analytics: "true" },
    { decidedAt: "not-a-date" },
    { expiresAt: "not-a-date" },
    { decidedAt: new Date(now + 1).toISOString() },
    { expiresAt: accepted.decidedAt },
    { expiresAt: new Date(now + consentLifetimeMs + 1).toISOString() },
  ]) {
    assert.equal(
      parseConsent(JSON.stringify({ ...accepted, ...changes }), gaId, now),
      null,
    );
  }
});

test("analytics cookie cleanup preserves functional and unrelated cookies", () => {
  assert.deepEqual(
    analyticsCookieNames(
      "preferences=ok; _ga=123; _ga_TEST=456; session=abc; _gallery=789",
    ),
    ["_ga", "_ga_TEST"],
  );
  assert.deepEqual(analyticsCookieNames(""), []);
  assert.deepEqual(cookieDomains("plan.quiix.tech"), [
    "plan.quiix.tech",
    "quiix.tech",
    "tech",
  ]);
  assert.deepEqual(cookieDomains("localhost"), ["localhost"]);
  assert.deepEqual(cookiePaths("/settings"), ["/", "/settings"]);
  assert.deepEqual(cookiePaths("/a/b/"), ["/", "/a", "/a/b"]);
});
