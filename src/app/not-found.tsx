import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nie znaleziono strony",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center bg-primary px-6 py-10 text-center text-white">
      <svg
        aria-hidden="true"
        viewBox="0 0 240 180"
        className="mb-4 h-40 w-52 sm:h-48 sm:w-64"
        fill="none"
      >
        <circle cx="120" cy="90" r="80" fill="white" fillOpacity="0.14" />
        <rect x="57" y="42" width="126" height="109" rx="16" fill="white" />
        <path d="M57 72h126" stroke="#4D88FC" strokeWidth="5" />
        <path
          d="M88 32v20m64-20v20"
          stroke="#FDB01C"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M105 105a16 16 0 1 1 29 9c-5 5-14 7-14 17"
          stroke="#4D88FC"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="120" cy="140" r="4" fill="#4D88FC" />
      </svg>
      <p className="text-sm font-semibold tracking-widest text-white/80">
        BŁĄD 404
      </p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
        Nie ma tu tej strony
      </h1>
      <p className="mt-3 w-full max-w-sm text-white/90">
        Sprawdź adres albo wróć do swojego planu zajęć.
      </p>
      <Link
        href="/day"
        className="mt-8 rounded-lg bg-white px-6 py-3 font-semibold text-primary shadow-sm transition-colors hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Wróć do planu
      </Link>
    </main>
  );
}
