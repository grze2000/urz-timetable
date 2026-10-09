import assert from "node:assert/strict";
import test from "node:test";
import {
  appUpdateInterval,
  appUpdateManager,
  getWorkerVersion,
  hasAvailableAppVersion,
  isNewerVersion,
  refreshOutdatedClients,
} from "../src/utils/appUpdates.ts";

test("reload requires a valid online response with the requested release available", async () => {
  assert.equal(
    await hasAvailableAppVersion(Response.json({ version: "2.4.3" }), "2.4.3"),
    true,
  );
  assert.equal(
    await hasAvailableAppVersion(Response.json({ version: "2.4.4" }), "2.4.3"),
    true,
  );
  assert.equal(
    await hasAvailableAppVersion(Response.json({ version: "2.4.2" }), "2.4.3"),
    false,
  );
  assert.equal(
    await hasAvailableAppVersion(
      Response.json({ version: "2.4.3" }, { status: 503 }),
      "2.4.3",
    ),
    false,
  );
  assert.equal(
    await hasAvailableAppVersion(new Response("Captive portal"), "2.4.3"),
    false,
  );
  assert.equal(
    await hasAvailableAppVersion(
      Response.json({ version: "invalid" }),
      "2.4.3",
    ),
    false,
  );
});

function setup() {
  const state = {
    controller: { postMessage() {} } as { postMessage: () => void } | null,
    online: true,
    visible: true,
    version: "2.4.3" as string | null,
    checks: 0,
    reloads: 0,
    fail: false,
  };
  const manager = appUpdateManager({
    version: "2.4.3",
    getController: () => state.controller,
    checkForUpdate: async () => {
      state.checks++;
      if (state.fail) throw new Error("Offline");
    },
    getWorkerVersion: async () => state.version,
    isOnline: () => state.online,
    isVisible: () => state.visible,
    reload: () => {
      state.reloads++;
    },
  });
  return { state, manager };
}

test("controller replacement reloads once, while unchanged and initial controllers do not", async () => {
  const { state, manager } = setup();
  await manager.check();
  manager.controllerChanged();
  assert.equal(state.reloads, 0);
  state.controller = { postMessage() {} };
  manager.controllerChanged();
  manager.controllerChanged();
  await manager.check();
  assert.equal(state.reloads, 1);

  const initial = setup();
  initial.state.controller = null;
  const firstVisit = appUpdateManager({
    version: "2.4.3",
    getController: () => initial.state.controller,
    checkForUpdate: async () => {},
    getWorkerVersion: async () => "2.4.3",
    isOnline: () => true,
    isVisible: () => true,
    reload: () => {
      initial.state.reloads++;
    },
  });
  initial.state.controller = { postMessage() {} };
  firstVisit.controllerChanged();
  await firstVisit.check();
  assert.equal(initial.state.reloads, 0);
});

test("an offline or hidden page defers reloading until online and visible", async () => {
  for (const condition of ["online", "visible"] as const) {
    const { state, manager } = setup();
    state[condition] = false;
    await manager.check();
    assert.equal(state.checks, 0);
    state.controller = { postMessage() {} };
    manager.controllerChanged();
    assert.equal(state.reloads, 0);
    state[condition] = true;
    await manager.check();
    assert.equal(state.reloads, 1);
  }
});

test("version handshake catches a missed activation without reloading for an older worker", async () => {
  for (const version of ["2.4.2", "2.4.3", "2.4.4", null]) {
    const { state, manager } = setup();
    state.version = version;
    await manager.check();
    await manager.check();
    assert.equal(state.reloads, version === "2.4.4" ? 1 : 0);
  }
  assert.equal(isNewerVersion("2.10.0", "2.9.9"), true);
  assert.equal(isNewerVersion("3.0.0", "2.99.99"), true);
  assert.equal(isNewerVersion("invalid", "2.4.3"), false);
  assert.equal(appUpdateInterval, 300_000);
});

test("failed checks preserve the application and can retry after reconnection", async () => {
  const { state, manager } = setup();
  state.fail = true;
  await manager.check();
  assert.equal(state.reloads, 0);
  state.fail = false;
  state.version = "2.4.4";
  await manager.check();
  assert.equal(state.checks, 2);
  assert.equal(state.reloads, 1);
});

test("concurrent checks share a request and disposal prevents late reloads", async () => {
  let finish!: () => void;
  let checks = 0;
  let reloads = 0;
  const worker = { postMessage() {} };
  const manager = appUpdateManager({
    version: "2.4.3",
    getController: () => worker,
    checkForUpdate: () => {
      checks++;
      return new Promise<void>((resolve) => {
        finish = resolve;
      });
    },
    getWorkerVersion: async () => "2.4.4",
    isOnline: () => true,
    isVisible: () => true,
    reload: () => {
      reloads++;
    },
  });
  const first = manager.check();
  assert.equal(manager.check(), first);
  assert.equal(checks, 1);
  manager.dispose();
  finish();
  await first;
  await manager.check();
  manager.controllerChanged();
  assert.equal(reloads, 0);
  assert.equal(checks, 1);
});

test("worker version messaging returns the response and handles unavailable workers", async () => {
  let received: unknown;
  const version = await getWorkerVersion({
    postMessage(message, transfer) {
      received = message;
      const port = transfer[0] as MessagePort;
      port.postMessage({ type: "APP_VERSION", version: "2.4.4" });
    },
  });
  assert.equal(version, "2.4.4");
  assert.deepEqual(received, { type: "GET_APP_VERSION" });
  assert.equal(
    await getWorkerVersion({
      postMessage() {
        throw new Error("Unavailable");
      },
    }),
    null,
  );
});

test("an unavailable legacy version times out without leaving message ports open", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const request = getWorkerVersion({ postMessage() {} });
  t.mock.timers.tick(3000);
  assert.equal(await request, null);
});

test("a failed reload remains pending and retries instead of locking the page", async () => {
  let attempts = 0;
  const worker = { postMessage() {} };
  const targets: Array<string | undefined> = [];
  const manager = appUpdateManager({
    version: "2.4.3",
    getController: () => worker,
    checkForUpdate: async () => {},
    getWorkerVersion: async () => "2.4.4",
    isOnline: () => true,
    isVisible: () => true,
    reload: async (target) => {
      targets.push(target);
      attempts++;
      if (attempts === 1) throw new Error("Server unavailable");
    },
  });
  await manager.check();
  await manager.check();
  assert.equal(attempts, 2);
  assert.deepEqual(targets, ["2.4.4", "2.4.4"]);
});

test("activation migrates legacy pages and older releases only after a successful network probe", async () => {
  const versions = [null, "2.4.2", "2.4.3", "2.4.4"];
  const reloads = versions.map(() => 0);
  const clients = versions.map((version, index) => ({
    worker: { postMessage() {}, version },
    reload: async () => {
      reloads[index]++;
    },
  }));
  const options = {
    version: "2.4.3",
    clients,
    checkConnection: async () => true,
    getClientVersion: async (worker: {
      postMessage: (message: unknown, transfer: Transferable[]) => void;
    }) => {
      return clients.find((client) => client.worker === worker)!.worker.version;
    },
  };
  assert.equal(
    await refreshOutdatedClients({
      ...options,
      checkConnection: async () => false,
    }),
    false,
  );
  assert.deepEqual(reloads, [0, 0, 0, 0]);
  assert.equal(
    await refreshOutdatedClients({
      ...options,
      checkConnection: async () => {
        throw new Error("Offline");
      },
    }),
    false,
  );
  assert.deepEqual(reloads, [0, 0, 0, 0]);
  assert.equal(await refreshOutdatedClients(options), true);
  assert.deepEqual(reloads, [1, 1, 0, 0]);
});
