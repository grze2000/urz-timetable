/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import {
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  type SerwistPlugin,
} from "serwist";
import { parseDictionaries } from "../api/timetable/parseDictionaries";
import { parseLessons } from "../api/timetable/parseLessons";
import { appConfig } from "../config/appConfig";
import {
  getWorkerVersion,
  hasAvailableAppVersion,
  refreshOutdatedClients,
} from "../utils/appUpdates";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<string | { url: string; revision: string | null }>;
};

const maxAgeSeconds = 7 * 24 * 60 * 60;

const notifySource: SerwistPlugin = {
  async cachedResponseWillBeUsed({ cachedResponse, event, request }) {
    if (cachedResponse) {
      const clientId = (event as FetchEvent).clientId;
      const client = clientId ? await self.clients.get(clientId) : null;
      client?.postMessage({ type: "SCHEDULE_CACHE_USED", url: request.url });
    }
    return cachedResponse;
  },
  async fetchDidSucceed({ event, request, response }) {
    if (!response.ok) throw new Error("Nie udało się pobrać planu.");
    const payload: unknown = await response.clone().json();
    if (new URL(request.url).pathname.endsWith("/dictionaries")) {
      parseDictionaries(payload);
    } else {
      parseLessons(payload);
    }
    const clientId = (event as FetchEvent).clientId;
    const client = clientId ? await self.clients.get(clientId) : null;
    client?.postMessage({ type: "SCHEDULE_NETWORK_USED", url: request.url });
    return response;
  },
};

function apiCache(name: string, maxEntries: number) {
  return new NetworkFirst({
    cacheName: name,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxAgeSeconds, maxEntries }),
      notifySource,
    ],
  });
}

const serviceWorker = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      matcher: ({ url, sameOrigin }) =>
        sameOrigin && url.pathname === "/api/app-version",
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ request, url }) =>
        request.method === "GET" &&
        url.pathname === "/api/student-schedule/dictionaries",
      handler: apiCache("schedule-dictionaries-v1", 10),
    },
    {
      matcher: ({ request, url }) =>
        request.method === "GET" &&
        url.pathname === "/api/student-schedule/lessons",
      handler: apiCache("schedule-lessons-v1", 100),
    },
    ...defaultCache,
  ],
});

serviceWorker.addEventListeners();

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data?.type === "GET_APP_VERSION") {
    event.ports[0]?.postMessage({
      type: "APP_VERSION",
      version: appConfig.version,
    });
  }
  if (!legacyCheckComplete && event.data?.type === "CACHE_URLS") {
    event.waitUntil(refreshAppClients());
  }
});

// Older open pages do not have the update listener yet. Refresh them on worker
// activation too, but only after a real network request succeeds. A page already
// running this release replies with its version and is left in place.
let refreshingClients: Promise<void> | null = null;
let legacyCheckComplete = false;
function refreshAppClients() {
  if (refreshingClients) return refreshingClients;
  refreshingClients = (async () => {
    const clients = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });
    legacyCheckComplete = await refreshOutdatedClients({
      version: appConfig.version,
      clients: clients
        .filter((client) => client.url.startsWith(self.registration.scope))
        .map((client) => ({
          worker: client,
          reload: () => client.navigate(client.url),
        })),
      checkConnection: async () => {
        const response = await fetch(
          new URL("api/app-version", self.registration.scope),
          { cache: "no-store", signal: AbortSignal.timeout(10_000) },
        );
        return hasAvailableAppVersion(response, appConfig.version);
      },
      getClientVersion: (client) =>
        getWorkerVersion(client, "GET_CLIENT_VERSION"),
    });
  })().finally(() => {
    refreshingClients = null;
  });
  return refreshingClients;
}

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(refreshAppClients());
});
