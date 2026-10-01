"use client";

import { useOnlineStatus } from "@/utils/useOnlineStatus";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const dismissalKey = "urz-timetable-install-banner-dismissed";

function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari() {
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return (
    ios &&
    /Safari/.test(navigator.userAgent) &&
    !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent)
  );
}

export function InstallBanner({ visible }: { visible: boolean }) {
  const pathname = usePathname();
  const online = useOnlineStatus();
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(
    null,
  );
  const [showIosBanner] = useState(
    () => typeof window !== "undefined" && isIosSafari(),
  );
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return localStorage.getItem(dismissalKey) === "true";
    } catch {
      return false;
    }
  });
  const [installed, setInstalled] = useState(
    () => typeof window !== "undefined" && isInstalled(),
  );

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (
    process.env.NODE_ENV !== "production" ||
    !visible ||
    !["/day", "/timetable", "/settings"].includes(pathname) ||
    !online ||
    dismissed ||
    installed ||
    (!promptEvent && !showIosBanner)
  ) {
    return null;
  }

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(dismissalKey, "true");
    } catch {
      /* Storage can be disabled by the browser. */
    }
  };

  const install = async () => {
    if (!promptEvent) return;
    setPromptEvent(null);
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
  };

  return (
    <aside
      aria-label="Zainstaluj aplikację"
      className="flex items-center gap-3 border-b border-[#c8dbff] bg-[#e8f0ff] px-4 py-3 text-[#16489b]"
    >
      <p className="min-w-0 grow text-sm font-semibold">
        Dodaj Plan zajęć URz do ekranu głównego
      </p>
      {promptEvent && (
        <button
          type="button"
          className="shrink-0 rounded bg-primary px-3 py-2 text-sm font-semibold text-white"
          onClick={() => void install()}
        >
          Zainstaluj
        </button>
      )}
      <button
        type="button"
        aria-label="Zamknij zachętę do instalacji"
        className="shrink-0 rounded p-1"
        onClick={dismiss}
      >
        <IoMdClose size={20} />
      </button>
    </aside>
  );
}
