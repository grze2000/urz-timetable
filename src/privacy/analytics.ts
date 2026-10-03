import { analyticsCookieNames, cookieDomains, cookiePaths } from "./consent.ts";

type AnalyticsWindow = Window & {
  dataLayer?: IArguments[];
  gtag?: (...args: unknown[]) => void;
};

const scriptId = "consented-google-analytics";
let initializedId: string | null = null;
let configuredId: string | null = null;
let pendingScript: HTMLScriptElement | null = null;

const deniedConsent = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
};

export function startAnalytics(gaId: string, onError?: () => void) {
  if (initializedId === gaId || pendingScript) return;
  const browser = window as AnalyticsWindow;
  Object.assign(browser, { [`ga-disable-${gaId}`]: false });
  browser.dataLayer ??= [];
  browser.gtag ??= function () {
    browser.dataLayer?.push(arguments);
  };

  if (configuredId !== gaId) {
    configuredId = gaId;
    // Queue once before downloading the tag, including across failed retries.
    browser.gtag("consent", "default", deniedConsent);
    browser.gtag("consent", "update", {
      ...deniedConsent,
      analytics_storage: "granted",
    });
    browser.gtag("js", new Date());
    browser.gtag("config", gaId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: 180 * 24 * 60 * 60,
      cookie_update: false,
    });
  }

  const script = document.createElement("script");
  script.id = scriptId;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
  pendingScript = script;
  script.onload = () => {
    if (pendingScript !== script) return;
    pendingScript = null;
    initializedId = gaId;
  };
  script.onerror = () => {
    if (pendingScript !== script) return;
    pendingScript = null;
    script.remove();
    onError?.();
  };
  document.head.appendChild(script);
}

export function stopAnalytics(gaId: string | null): boolean {
  // A pending script may have executed before its load event was delivered.
  const wasInitialized = initializedId !== null || pendingScript !== null;
  for (const id of new Set([gaId, initializedId, configuredId])) {
    if (id) Object.assign(window, { [`ga-disable-${id}`]: true });
  }
  initializedId = null;
  pendingScript = null;
  configuredId = null;
  const browser = window as AnalyticsWindow;
  if (browser.dataLayer) browser.dataLayer.length = 0;
  document.getElementById(scriptId)?.remove();

  const domains = cookieDomains(window.location.hostname);
  const paths = cookiePaths(window.location.pathname);
  for (const name of analyticsCookieNames(document.cookie)) {
    for (const path of paths) {
      const expired = `${name}=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
      document.cookie = expired;
      for (const domain of domains) {
        document.cookie = `${expired}; domain=${domain}`;
        document.cookie = `${expired}; domain=.${domain}`;
      }
    }
  }
  // Reloading after revocation also removes the tag's timers and SPA listeners.
  // Merely removing a script element does not stop already executed JavaScript.
  return wasInitialized;
}
