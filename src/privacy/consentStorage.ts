import {
  consentStorageKey,
  readConsentCookie,
  serializeConsentCookie,
  type CookieConsent,
} from "./consent.ts";

let sessionValue: string | null | undefined;
const revocationKey = `${consentStorageKey}-revoked`;
const listeners = new Set<() => void>();
const channels = new Set<BroadcastChannel>();

function hasPendingRevocation(): boolean {
  try {
    return window.sessionStorage.getItem(revocationKey) === "1";
  } catch {
    return false;
  }
}

export function canReloadConsent(): boolean {
  return sessionValue === undefined || hasPendingRevocation();
}

export function getConsentSnapshot(): string | null {
  if (sessionValue !== undefined) return sessionValue;
  // A failed revocation must keep blocking an old cookie after a reload.
  if (hasPendingRevocation()) return null;
  try {
    return readConsentCookie(document.cookie);
  } catch {
    return null;
  }
}

export function getServerConsentSnapshot(): null {
  return null;
}

export function saveConsentSnapshot(value: string | null) {
  let persisted = false;
  try {
    const record = value === null ? null : (JSON.parse(value) as CookieConsent);
    document.cookie = serializeConsentCookie(
      record,
      window.location.protocol === "https:",
    );
    persisted = readConsentCookie(document.cookie) === value;
  } catch {
    // Cookie access can be disabled by the browser.
  }
  // Cookie writes can also fail silently. Keep the choice for this tab then.
  sessionValue = persisted ? undefined : value;
  try {
    if (persisted) window.sessionStorage.removeItem(revocationKey);
    else if (value === null || !JSON.parse(value).analytics) {
      // Only an emergency revocation flag, not a second consent store.
      window.sessionStorage.setItem(revocationKey, "1");
    }
  } catch {
    // When all storage is blocked, avoid reloading away the in-memory refusal.
  }
  for (const listener of listeners) listener();
  if (persisted) {
    for (const channel of channels) channel.postMessage("changed");
  }
  return persisted;
}

export function subscribeConsent(listener: () => void) {
  let previous = getConsentSnapshot();
  const notify = () => {
    previous = getConsentSnapshot();
    listener();
  };
  listeners.add(notify);
  const checkCookie = () => {
    const current = getConsentSnapshot();
    if (current !== previous) {
      notify();
    }
  };
  const onFocus = () => {
    notify();
  };
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(consentStorageKey);
    channels.add(channel);
    channel.onmessage = () => {
      sessionValue = undefined;
      checkCookie();
    };
  } catch {
    // Polling also covers browsers without BroadcastChannel and cookie deletion.
  }
  const timer = window.setInterval(checkCookie, 1000);
  window.addEventListener("pageshow", onFocus);
  window.addEventListener("focus", onFocus);
  return () => {
    listeners.delete(notify);
    window.clearInterval(timer);
    window.removeEventListener("pageshow", onFocus);
    window.removeEventListener("focus", onFocus);
    if (channel) {
      channels.delete(channel);
      channel.close();
    }
  };
}
