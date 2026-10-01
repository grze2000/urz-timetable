/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import {
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkFirst,
  Serwist,
  type SerwistPlugin,
} from "serwist";
import { parseDictionaries } from "../api/timetable/parseDictionaries";
import { parseLessons } from "../api/timetable/parseLessons";

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
