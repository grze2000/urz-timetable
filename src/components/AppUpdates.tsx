"use client";

import { useEffect } from "react";
import { appConfig } from "@/config/appConfig";
import {
  appUpdateInterval,
  appUpdateManager,
  getWorkerVersion,
  hasAvailableAppVersion,
} from "@/utils/appUpdates";

export function AppUpdates() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    const serviceWorkers = navigator.serviceWorker;
    const manager = appUpdateManager({
      version: appConfig.version,
      getController: () => serviceWorkers.controller,
      checkForUpdate: async () => {
        const registration = await serviceWorkers.getRegistration();
        await registration?.update();
      },
      getWorkerVersion,
      isOnline: () => navigator.onLine,
      isVisible: () => document.visibilityState === "visible",
      reload: async (targetVersion) => {
        const response = await fetch("/api/app-version", {
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        });
        if (
          !(await hasAvailableAppVersion(
            response,
            targetVersion ?? appConfig.version,
          ))
        ) {
          throw new Error("Nowa wersja aplikacji nie jest dostępna online.");
        }
        if (navigator.onLine && document.visibilityState === "visible") {
          window.location.reload();
        } else {
          throw new Error("Odświeżenie poczeka na powrót do aplikacji online.");
        }
      },
    });
    const check = () => void manager.check();
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "GET_CLIENT_VERSION") {
        event.ports[0]?.postMessage({
          type: "APP_VERSION",
          version: appConfig.version,
        });
      }
    };
    window.addEventListener("online", check);
    window.addEventListener("focus", check);
    window.addEventListener("pageshow", check);
    document.addEventListener("visibilitychange", check);
    serviceWorkers.addEventListener(
      "controllerchange",
      manager.controllerChanged,
    );
    serviceWorkers.addEventListener("message", onMessage);
    const interval = window.setInterval(check, appUpdateInterval);
    // The provider may still be registering the worker on the first visit.
    void serviceWorkers.ready.then(check).catch(() => {});
    check();

    return () => {
      manager.dispose();
      window.clearInterval(interval);
      window.removeEventListener("online", check);
      window.removeEventListener("focus", check);
      window.removeEventListener("pageshow", check);
      document.removeEventListener("visibilitychange", check);
      serviceWorkers.removeEventListener(
        "controllerchange",
        manager.controllerChanged,
      );
      serviceWorkers.removeEventListener("message", onMessage);
    };
  }, []);

  return null;
}
