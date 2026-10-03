import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { startAnalytics, stopAnalytics } from "../src/privacy/analytics.ts";
import {
  consentStorageKey,
  createConsent,
  parseConsent,
  readConsentCookie,
  serializeConsentCookie,
} from "../src/privacy/consent.ts";
import {
  checkConsentExpiry,
  chooseConsent,
  startConsentedAnalytics,
} from "../src/privacy/consentLifecycle.ts";
import {
  getConsentSnapshot,
  saveConsentSnapshot,
} from "../src/privacy/consentStorage.ts";

const gaId = "G-REGRESSION";

function browserFixture(t: TestContext) {
  const names = ["window", "document"] as const;
  const originals = names.map((name) =>
    Object.getOwnPropertyDescriptor(globalThis, name),
  );
  const session = new Map<string, string>();
  let cookieHeader = "";
  let blockCookies = false;
  let blockSession = false;
  let reloads = 0;
  class Script {
    id = "";
    async = false;
    src = "";
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    remove() {
      active.delete(this);
    }
  }
  const scripts: Script[] = [];
  const active = new Set<Script>();
  const browser = {
    location: {
      protocol: "https:",
      hostname: "plan.example.test",
      pathname: "/settings",
      reload: () => {
        reloads += 1;
      },
    },
    sessionStorage: {
      getItem: (key: string) => {
        if (blockSession) throw new Error("Storage disabled");
        return session.get(key) ?? null;
      },
      setItem: (key: string, value: string) => {
        if (blockSession) throw new Error("Storage disabled");
        session.set(key, value);
      },
      removeItem: (key: string) => {
        if (blockSession) throw new Error("Storage disabled");
        session.delete(key);
      },
    },
  };
  const document = {
    get cookie() {
      return cookieHeader;
    },
    set cookie(value: string) {
      if (blockCookies) return;
      if (!value.startsWith(`${consentStorageKey}=`)) return;
      cookieHeader = value.includes("Max-Age=0;") ? "" : value.split(";")[0];
    },
    createElement: () => new Script(),
    getElementById: (id: string) =>
      [...active].find((script) => script.id === id) ?? null,
    head: {
      appendChild: (script: Script) => {
        scripts.push(script);
        active.add(script);
      },
    },
  };
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browser,
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: document,
  });
  t.after(() => {
    blockCookies = false;
    blockSession = false;
    stopAnalytics(gaId);
    saveConsentSnapshot(null);
    names.forEach((name, index) => {
      const original = originals[index];
      if (original) Object.defineProperty(globalThis, name, original);
      else Reflect.deleteProperty(globalThis, name);
    });
  });
  return {
    scripts,
    session,
    browser,
    setCookie: (record: ReturnType<typeof createConsent>) => {
      cookieHeader = serializeConsentCookie(record, true).split(";")[0];
    },
    blockWrites: (sessionToo = false) => {
      blockCookies = true;
      blockSession = sessionToo;
    },
    allowWrites: () => {
      blockCookies = false;
      blockSession = false;
    },
    get reloads() {
      return reloads;
    },
    get cookie() {
      return cookieHeader;
    },
  };
}

test("failed revocation blocks an old accepted cookie after reload", async (t) => {
  const fixture = browserFixture(t);
  fixture.setCookie(createConsent(true, gaId));
  startConsentedAnalytics(gaId);
  fixture.scripts[0].onload?.();
  fixture.blockWrites();

  assert.equal(chooseConsent(false, gaId), false);
  assert.equal(fixture.reloads, 1);
  assert.equal(parseConsent(getConsentSnapshot(), gaId)?.analytics, false);
  assert.equal(
    parseConsent(readConsentCookie(fixture.cookie), gaId)?.analytics,
    true,
  );

  // A fresh module represents the in-memory state being lost on a reload.
  const reloaded = await import(
    new URL("../src/privacy/consentStorage.ts?reload", import.meta.url).href
  );
  assert.equal(reloaded.getConsentSnapshot(), null);
  assert.equal(reloaded.canReloadConsent(), true);

  fixture.allowWrites();
  assert.equal(chooseConsent(false, gaId), true);
  assert.equal(fixture.session.size, 0);
  assert.equal(
    parseConsent(reloaded.getConsentSnapshot(), gaId)?.analytics,
    false,
  );
});

test("revocation avoids reload when both cookie and session writes fail", (t) => {
  const fixture = browserFixture(t);
  fixture.setCookie(createConsent(true, gaId));
  startConsentedAnalytics(gaId);
  fixture.scripts[0].onload?.();
  fixture.blockWrites(true);

  assert.equal(chooseConsent(false, gaId), false);
  assert.equal(fixture.reloads, 0);
  assert.equal(parseConsent(getConsentSnapshot(), gaId)?.analytics, false);
  startConsentedAnalytics(gaId);
  assert.equal(fixture.scripts.length, 1);
  assert.equal(Reflect.get(fixture.browser, `ga-disable-${gaId}`), true);
});

test("failed tag downloads can retry without duplicating config or active scripts", (t) => {
  const fixture = browserFixture(t);
  fixture.setCookie(createConsent(true, gaId));
  let failures = 0;
  const start = () => startConsentedAnalytics(gaId, () => failures++);
  start();
  start();
  assert.equal(fixture.scripts.length, 1);
  fixture.scripts[0].onerror?.();
  assert.equal(failures, 1);
  start();
  assert.equal(fixture.scripts.length, 2);
  const queue = Reflect.get(fixture.browser, "dataLayer") as IArguments[];
  assert.equal(queue.filter((args) => args[0] === "config").length, 1);
  fixture.scripts[1].onload?.();
  start();
  assert.equal(fixture.scripts.length, 2);
});

test("a queued retry and late load event cannot restart revoked analytics", (t) => {
  const fixture = browserFixture(t);
  fixture.setCookie(createConsent(true, gaId));
  startConsentedAnalytics(gaId);
  const pending = fixture.scripts[0];
  assert.equal(chooseConsent(false, gaId), true);
  pending.onload?.();
  startConsentedAnalytics(gaId);
  assert.equal(fixture.scripts.length, 1);
  assert.equal(stopAnalytics(gaId), false);
});

test("an old expiry callback preserves a renewed choice from another tab", (t) => {
  const fixture = browserFixture(t);
  fixture.setCookie(createConsent(true, gaId));
  startConsentedAnalytics(gaId);
  const renewed = createConsent(false, gaId, Date.now() - 1000);
  fixture.setCookie(renewed);
  const cookie = fixture.cookie;

  assert.ok((checkConsentExpiry(gaId) ?? 0) > 0);
  assert.equal(fixture.cookie, cookie);
  assert.equal(fixture.reloads, 0);
  assert.equal(parseConsent(getConsentSnapshot(), gaId)?.analytics, false);
});

test("expired consent stops analytics and is removed", (t) => {
  const fixture = browserFixture(t);
  fixture.setCookie(createConsent(true, gaId));
  startAnalytics(gaId);
  fixture.setCookie({
    ...createConsent(true, gaId, Date.now() - 10000),
    expiresAt: new Date(Date.now() - 1).toISOString(),
  });

  assert.equal(checkConsentExpiry(gaId), null);
  assert.equal(getConsentSnapshot(), null);
  assert.equal(fixture.reloads, 1);
  startConsentedAnalytics(gaId);
  assert.equal(fixture.scripts.length, 1);
});
