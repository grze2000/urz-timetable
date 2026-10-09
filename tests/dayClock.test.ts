import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { build } from "esbuild";

test("day clock refreshes every 15 seconds and on return, then removes subscriptions", async () => {
  const bundle = await build({
    entryPoints: ["src/utils/useDayClock.ts"],
    bundle: true,
    packages: "external",
    platform: "node",
    format: "cjs",
    write: false,
  });
  let effect: (() => () => void) | undefined;
  const state: unknown[] = [];
  const document = Object.assign(new EventTarget(), {
    visibilityState: "visible",
  });
  let tick: (() => void) | undefined;
  let cleared = false;
  const window = Object.assign(new EventTarget(), {
    setInterval(callback: () => void, delay: number) {
      assert.equal(delay, 15_000);
      tick = callback;
      return 42;
    },
    clearInterval(timer: number) {
      assert.equal(timer, 42);
      cleared = true;
    },
  });
  const react = {
    useState(initial: unknown) {
      const index = state.length;
      state.push(initial);
      return [
        initial,
        (value: unknown) => {
          state[index] =
            typeof value === "function" ? value(state[index]) : value;
        },
      ];
    },
    useEffect(callback: () => () => void) {
      effect = callback;
    },
  };
  const require = createRequire(import.meta.url);
  const bundledModule = { exports: {} as { useDayClock: () => unknown } };
  new Function(
    "require",
    "module",
    "exports",
    "window",
    "document",
    bundle.outputFiles[0].text,
  )(
    (name: string) => (name === "react" ? react : require(name)),
    bundledModule,
    bundledModule.exports,
    window,
    document,
  );
  bundledModule.exports.useDayClock();
  assert.deepEqual(state, [null, 0]);
  const dispose = effect!();
  assert.equal(Object.prototype.toString.call(state[0]), "[object Date]");
  assert.equal(state[1], 1);
  const first = state[0];
  tick!();
  assert.notEqual(state[0], first);
  assert.equal(state[1], 1, "regular ticks do not request auto-scroll");
  document.visibilityState = "hidden";
  document.dispatchEvent(new Event("visibilitychange"));
  window.dispatchEvent(new Event("focus"));
  assert.equal(state[1], 1);
  document.visibilityState = "visible";
  document.dispatchEvent(new Event("visibilitychange"));
  window.dispatchEvent(new Event("focus"));
  window.dispatchEvent(new Event("pageshow"));
  assert.equal(state[1], 4);
  dispose();
  assert.ok(cleared);
  const last = state[0];
  document.dispatchEvent(new Event("visibilitychange"));
  window.dispatchEvent(new Event("focus"));
  window.dispatchEvent(new Event("pageshow"));
  assert.equal(state[0], last);
  assert.equal(state[1], 4);
});
