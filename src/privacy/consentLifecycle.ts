import { startAnalytics, stopAnalytics } from "./analytics.ts";
import { createConsent, parseConsent } from "./consent.ts";
import {
  canReloadConsent,
  getConsentSnapshot,
  saveConsentSnapshot,
} from "./consentStorage.ts";

export function stopConsentedAnalytics(gaId: string | null) {
  if (stopAnalytics(gaId) && canReloadConsent()) window.location.reload();
}

export function startConsentedAnalytics(
  gaId: string | null,
  onError?: () => void,
) {
  if (gaId && parseConsent(getConsentSnapshot(), gaId)?.analytics) {
    startAnalytics(gaId, onError);
  }
}

export function chooseConsent(
  analytics: boolean,
  gaId: string | null,
): boolean {
  const reload = !analytics && stopAnalytics(gaId);
  const persisted = saveConsentSnapshot(
    JSON.stringify(createConsent(analytics, gaId)),
  );
  if (reload && canReloadConsent()) window.location.reload();
  return persisted;
}

export function checkConsentExpiry(gaId: string | null): number | null {
  // A suspended tab can still have an old timer after another tab renews consent.
  const current = parseConsent(getConsentSnapshot(), gaId);
  if (current) return Date.parse(current.expiresAt) - Date.now();
  const reload = stopAnalytics(gaId);
  saveConsentSnapshot(null);
  if (reload && canReloadConsent()) window.location.reload();
  return null;
}
