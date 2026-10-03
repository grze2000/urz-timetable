"use client";

import { parseConsent, privacyPolicyUrl } from "@/privacy/consent";
import {
  checkConsentExpiry,
  chooseConsent,
  startConsentedAnalytics,
  stopConsentedAnalytics,
} from "@/privacy/consentLifecycle";
import {
  getConsentSnapshot,
  getServerConsentSnapshot,
  subscribeConsent,
} from "@/privacy/consentStorage";
import { Modal } from "@mantine/core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

const CookieConsentContext = createContext<{
  openCookieModal: () => void;
} | null>(null);

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) throw new Error("Brak dostawcy ustawień cookies.");
  return context;
}

export function CookieConsentProvider({
  children,
  gaId,
}: {
  children: React.ReactNode;
  gaId: string | null;
}) {
  const subscribe = useCallback(
    (notify: () => void) =>
      subscribeConsent(() => {
        const current = parseConsent(getConsentSnapshot(), gaId);
        if (!current?.analytics) stopConsentedAnalytics(gaId);
        notify();
      }),
    [gaId],
  );
  const rawConsent = useSyncExternalStore(
    subscribe,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );
  const [manuallyOpened, setManuallyOpened] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const consent = parseConsent(rawConsent, gaId);
  const analyticsAllowed = !!gaId && consent?.analytics === true;
  const expiresAt = consent?.expiresAt;
  const modalOpened = manuallyOpened || !consent;

  useEffect(() => {
    if (!analyticsAllowed) {
      stopConsentedAnalytics(gaId);
      return;
    }
    let timer: number | undefined;
    let cancelled = false;
    let retries = 0;
    const start = () => {
      startConsentedAnalytics(gaId, () => {
        if (!cancelled && navigator.onLine && retries++ < 2) {
          timer = window.setTimeout(start, 5000);
        }
      });
    };
    const onOnline = () => {
      window.clearTimeout(timer);
      retries = 0;
      start();
    };
    start();
    window.addEventListener("online", onOnline);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("online", onOnline);
    };
  }, [analyticsAllowed, gaId]);

  useEffect(() => {
    if (!expiresAt) return;
    let timer: number;
    const expire = () => {
      window.clearTimeout(timer);
      const remaining = checkConsentExpiry(gaId);
      if (remaining !== null) {
        // Browser timers cannot represent delays longer than about 24 days.
        timer = window.setTimeout(expire, Math.min(remaining, 2_147_483_647));
      }
    };
    // Recheck on wake-up as browsers can suspend timers in background tabs.
    expire();
    window.addEventListener("focus", expire);
    window.addEventListener("pageshow", expire);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", expire);
      window.removeEventListener("pageshow", expire);
    };
  }, [expiresAt, gaId]);

  const choose = (analytics: boolean) => {
    const persisted = chooseConsent(analytics, gaId);
    setStorageError(!persisted);
    setManuallyOpened(!persisted);
  };

  return (
    <CookieConsentContext.Provider
      value={{
        openCookieModal: () => setManuallyOpened(true),
      }}
    >
      {children}
      <Modal
        opened={modalOpened}
        onClose={() => setManuallyOpened(false)}
        title="Cookies"
        centered
        size="sm"
        padding="lg"
        radius="md"
        zIndex={1000}
        withCloseButton={false}
        closeOnClickOutside={false}
        closeOnEscape={false}
        overlayProps={{ backgroundOpacity: 0.45, blur: 2 }}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-700">
            Używamy plików cookies, aby zapewnić prawidłowe działanie serwisu
            oraz ulepszać jego działanie. Zgodę możesz zmienić lub wycofać w
            ustawieniach.
          </p>
          <a
            href={privacyPolicyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit text-sm font-semibold text-primary underline"
          >
            Polityka prywatności
          </a>
          {storageError && (
            <p role="alert" className="text-sm text-red-700">
              Nie udało się zapisać wyboru w cookie. Sprawdź ustawienia
              przeglądarki i spróbuj ponownie. Odmowa nadal blokuje analitykę w
              tej karcie.
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              data-autofocus
              className="rounded-md border border-primary bg-white px-4 py-3 text-sm font-semibold text-[#2458b3] hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={() => choose(false)}
            >
              Tylko niezbędne
            </button>
            <button
              type="button"
              className="rounded-md border border-primary bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={() => choose(true)}
            >
              Akceptuj wszystkie
            </button>
          </div>
        </div>
      </Modal>
    </CookieConsentContext.Provider>
  );
}
