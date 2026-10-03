export const consentStorageKey = "urz-timetable-cookie-consent";
export const consentVersion = 2;
export const consentLifetimeMs = 180 * 24 * 60 * 60 * 1000;
export const privacyPolicyUrl = "https://quiix.tech/polityka-prywatnosci";

export type CookieConsent = {
  version: number;
  analytics: boolean;
  gaId: string | null;
  decidedAt: string;
  expiresAt: string;
};

export function readConsentCookie(cookieHeader: string): string | null {
  const prefix = `${consentStorageKey}=`;
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!cookie) return null;
  try {
    return decodeURIComponent(cookie.slice(prefix.length)) || null;
  } catch {
    return null;
  }
}

export function serializeConsentCookie(
  record: CookieConsent | null,
  secure: boolean,
  now = Date.now(),
): string {
  const expiresAt = record ? Date.parse(record.expiresAt) : 0;
  const maxAge = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const value = record ? encodeURIComponent(JSON.stringify(record)) : "";
  return `${consentStorageKey}=${value}; Path=/; SameSite=Lax; Max-Age=${maxAge}; Expires=${new Date(expiresAt).toUTCString()}${secure ? "; Secure" : ""}`;
}

export function createConsent(
  analytics: boolean,
  gaId: string | null,
  now = Date.now(),
): CookieConsent {
  return {
    version: consentVersion,
    analytics,
    gaId,
    decidedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + consentLifetimeMs).toISOString(),
  };
}

export function parseConsent(
  raw: string | null,
  gaId: string | null,
  now = Date.now(),
): CookieConsent | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const record = value as Partial<CookieConsent>;
    if (
      record.version !== consentVersion ||
      typeof record.analytics !== "boolean" ||
      record.gaId !== gaId ||
      typeof record.decidedAt !== "string" ||
      typeof record.expiresAt !== "string"
    ) {
      return null;
    }
    const decidedAt = Date.parse(record.decidedAt);
    const expiresAt = Date.parse(record.expiresAt);
    if (
      !Number.isFinite(decidedAt) ||
      !Number.isFinite(expiresAt) ||
      decidedAt > now ||
      expiresAt <= now ||
      expiresAt <= decidedAt ||
      expiresAt - decidedAt > consentLifetimeMs
    ) {
      return null;
    }
    return record as CookieConsent;
  } catch {
    return null;
  }
}

export function analyticsCookieNames(cookieHeader: string): string[] {
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim().split("=")[0])
    .filter((name) => name === "_ga" || name.startsWith("_ga_"));
}

export function cookieDomains(hostname: string): string[] {
  const parts = hostname.split(".");
  return parts.map((_, index) => parts.slice(index).join("."));
}

export function cookiePaths(pathname: string): string[] {
  const parts = pathname.split("/").filter(Boolean);
  return [
    "/",
    ...parts.map((_, index) => `/${parts.slice(0, index + 1).join("/")}`),
  ];
}
