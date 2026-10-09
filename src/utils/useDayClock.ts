"use client";

import { useEffect, useState } from "react";
import { appNow } from "./appNow";

export function useDayClock() {
  const [now, setNow] = useState<Date | null>(null);
  const [resume, setResume] = useState(0);
  useEffect(() => {
    const tick = () => setNow(appNow());
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      tick();
      setResume((value) => value + 1);
    };
    refresh();
    const timer = window.setInterval(tick, 15_000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, []);
  return { now, resume };
}
