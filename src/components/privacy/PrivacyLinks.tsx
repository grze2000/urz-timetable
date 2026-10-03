"use client";

import { privacyPolicyUrl } from "@/privacy/consent";
import { useCookieConsent } from "./CookieConsentProvider";

export function PrivacyLinks() {
  const { openCookieModal } = useCookieConsent();
  return (
    <div className="flex flex-col items-start gap-3 text-sm font-semibold text-primary">
      <button type="button" onClick={openCookieModal} className="underline">
        Ustawienia cookies
      </button>
      <a
        href={privacyPolicyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        Polityka prywatności
      </a>
    </div>
  );
}
