export const appUpdateInterval = 5 * 60_000;

export function isNewerVersion(candidate: string, current: string) {
  if (!/^\d+\.\d+\.\d+$/.test(candidate) || !/^\d+\.\d+\.\d+$/.test(current)) {
    return false;
  }
  const next = candidate.split(".").map(Number);
  const previous = current.split(".").map(Number);
  for (let index = 0; index < next.length; index++) {
    if (next[index] !== previous[index]) return next[index] > previous[index];
  }
  return false;
}

export async function hasAvailableAppVersion(
  response: Response,
  minimumVersion: string,
) {
  if (!response.ok) return false;
  try {
    const payload: unknown = await response.json();
    const version =
      payload && typeof payload === "object" && "version" in payload
        ? payload.version
        : null;
    return (
      typeof version === "string" &&
      /^\d+\.\d+\.\d+$/.test(version) &&
      !isNewerVersion(minimumVersion, version)
    );
  } catch {
    return false;
  }
}

type Worker = {
  postMessage: (message: unknown, transfer: Transferable[]) => void;
};

type UpdateEnvironment = {
  version: string;
  getController: () => Worker | null;
  checkForUpdate: () => Promise<void>;
  getWorkerVersion: (worker: Worker) => Promise<string | null>;
  isOnline: () => boolean;
  isVisible: () => boolean;
  reload: (targetVersion?: string) => void | Promise<void>;
};

// Controller identity detects updates within this page's lifetime; the version
// handshake also detects an update that activated before listeners were mounted.
export function appUpdateManager(environment: UpdateEnvironment) {
  let controller = environment.getController();
  let pendingReload = false;
  let targetVersion: string | undefined;
  let reloading = false;
  let disposed = false;
  let checking: Promise<void> | null = null;

  function reloadIfReady() {
    if (
      !disposed &&
      !reloading &&
      pendingReload &&
      environment.isOnline() &&
      environment.isVisible()
    ) {
      reloading = true;
      try {
        void Promise.resolve(environment.reload(targetVersion)).catch(() => {
          reloading = false;
        });
      } catch {
        reloading = false;
      }
    }
  }

  async function checkVersion() {
    const current = environment.getController();
    if (!current) return;
    const version = await environment.getWorkerVersion(current);
    if (disposed || current !== environment.getController()) return;
    if (version && isNewerVersion(version, environment.version)) {
      pendingReload = true;
      targetVersion = version;
    }
    reloadIfReady();
  }

  function controllerChanged() {
    const current = environment.getController();
    if (controller && current && current !== controller) pendingReload = true;
    controller = current;
    reloadIfReady();
    if (!disposed && !reloading) void checkVersion().catch(() => {});
  }

  function check() {
    reloadIfReady();
    if (
      disposed ||
      reloading ||
      !environment.isOnline() ||
      !environment.isVisible()
    ) {
      return Promise.resolve();
    }
    if (checking) return checking;
    checking = (async () => {
      try {
        await environment.checkForUpdate();
        if (!disposed && !reloading) await checkVersion();
      } catch {
        // A failed update check must preserve the working offline application.
      } finally {
        checking = null;
      }
    })();
    return checking;
  }

  return {
    check,
    controllerChanged,
    dispose() {
      disposed = true;
    },
  };
}

export function getWorkerVersion(
  worker: Worker,
  requestType = "GET_APP_VERSION",
): Promise<string | null> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const finish = (version: string | null) => {
      clearTimeout(timeout);
      channel.port1.close();
      channel.port2.close();
      resolve(version);
    };
    const timeout = setTimeout(() => finish(null), 3000);
    channel.port1.onmessage = (event: MessageEvent) => {
      if (
        event.data?.type === "APP_VERSION" &&
        typeof event.data.version === "string"
      ) {
        finish(event.data.version);
      }
    };
    try {
      worker.postMessage({ type: requestType }, [channel.port2]);
    } catch {
      finish(null);
    }
  });
}

export async function refreshOutdatedClients({
  version,
  clients,
  checkConnection,
  getClientVersion,
}: {
  version: string;
  clients: Array<{ reload: () => Promise<unknown>; worker: Worker }>;
  checkConnection: () => Promise<boolean>;
  getClientVersion: (worker: Worker) => Promise<string | null>;
}) {
  if (!clients.length) return false;
  try {
    if (!(await checkConnection())) return false;
  } catch {
    return false;
  }
  await Promise.all(
    clients.map(async ({ worker, reload }) => {
      const currentVersion = await getClientVersion(worker);
      if (!currentVersion || isNewerVersion(version, currentVersion)) {
        await reload().catch(() => {});
      }
    }),
  );
  return true;
}
