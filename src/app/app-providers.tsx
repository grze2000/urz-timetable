"use client";
import { StudyOnboarding } from "@/components/onboarding/StudyOnboarding";
import { InstallBanner } from "@/components/InstallBanner";
import { CookieConsentProvider } from "@/components/privacy/CookieConsentProvider";
import { appConfig } from "@/config/appConfig";
import { navigationConfig } from "@/config/navigationConfig";
import { useAppState } from "@/store/useAppState";
import { useDictionaries } from "@/api/timetable/getDictionaries";
import { emptyPreferences, preferencesFromLink } from "@/store/preferences";
import { validSelection } from "@/utils/getStudyOptions";
import { useOnlineStatus } from "@/utils/useOnlineStatus";
import { SerwistProvider } from "@serwist/next/react";
import {
  ActionIcon,
  Button,
  createTheme,
  MantineProvider,
} from "@mantine/core";
import { modals, ModalsProvider } from "@mantine/modals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dayjs from "dayjs";
import "dayjs/locale/pl";
import customParseFormat from "dayjs/plugin/customParseFormat";
import sameOrAfter from "dayjs/plugin/isSameOrAfter";
import weekOfYear from "dayjs/plugin/weekOfYear";
import weekDay from "dayjs/plugin/weekday";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { IoMdClose } from "react-icons/io";

dayjs.locale("pl");
dayjs.extend(weekOfYear);
dayjs.extend(weekDay);
dayjs.extend(customParseFormat);
dayjs.extend(sameOrAfter);

const theme = createTheme({ defaultRadius: "sm" });

function AppShell({
  children,
  headingFontClassName,
}: {
  children: React.ReactNode;
  headingFontClassName: string;
}) {
  const pathname = usePathname();
  const online = useOnlineStatus();
  const isScheduleRoute = pathname === "/day" || pathname === "/timetable";
  const isAppRoute = isScheduleRoute || pathname === "/settings";
  const {
    studyMode,
    majorId,
    specializationIds,
    visitedAppVersion,
    setVisitedAppVersion,
  } = useAppState();
  const searchParams = useSearchParams();
  const linkParams = searchParams.toString();
  const dictionaries = useDictionaries(isScheduleRoute);
  const hasSavedSelection =
    !!dictionaries.data &&
    validSelection(
      { studyMode, majorId, specializationIds },
      dictionaries.data,
    );
  const linkedPreferences =
    dictionaries.data && !hasSavedSelection
      ? preferencesFromLink(new URLSearchParams(linkParams), dictionaries.data)
      : null;

  useEffect(() => {
    try {
      localStorage.removeItem("urz-timetable-state");
      localStorage.removeItem("urz-timetable-mentor-state");
    } catch {
      /* Storage can be disabled by the browser. */
    }
    if (!isScheduleRoute || !dictionaries.data) return;
    const current = useAppState.getState();
    if (!validSelection(current, dictionaries.data)) {
      const fromLink = preferencesFromLink(
        new URLSearchParams(linkParams),
        dictionaries.data,
      );
      if (fromLink) current.replacePreferences(fromLink);
    }
  }, [isScheduleRoute, linkParams, dictionaries.data]);

  if (isScheduleRoute) {
    if (!dictionaries.data && dictionaries.isError) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-primary px-6 text-center text-white">
          <p role="alert">
            {online
              ? "Nie udało się pobrać kierunków."
              : "Brak zapisanych danych dla tego widoku. Połącz się z internetem, aby pobrać plan."}
          </p>
          <Button variant="white" onClick={() => dictionaries.refetch()}>
            Spróbuj ponownie
          </Button>
          <Link href="/settings" className="text-sm underline">
            Prywatność i ustawienia
          </Link>
        </div>
      );
    }
    if (!dictionaries.data || linkedPreferences) return <AppLoading />;
    if (!hasSavedSelection) {
      return (
        <StudyOnboarding
          dictionaries={dictionaries.data}
          headingFontClassName={headingFontClassName}
          onComplete={(selection) => {
            const current = useAppState.getState();
            current.replacePreferences({
              ...emptyPreferences(),
              ...selection,
              visitedAppVersion: current.visitedAppVersion,
            });
          }}
        />
      );
    }
  }

  return (
    <>
      {isAppRoute && visitedAppVersion !== appConfig.version && (
        <div
          className="relative z-30 bg-green-500 text-white w-full shadow-sm py-1.5 px-2.5 flex items-center justify-between font-semibold"
          onClick={() =>
            modals.open({
              title: `Zmiany w wersji ${appConfig.version}`,
              children: (
                <div className="flex flex-col">
                  <ul className="list-disc ml-6">
                    {appConfig.changelogText.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                  <Button className="ml-auto mt-2" onClick={modals.closeAll}>
                    Zamknij
                  </Button>
                </div>
              ),
              onClose: () => setVisitedAppVersion(appConfig.version),
            })
          }
        >
          <span>Zobacz zmiany w wersji {appConfig.version}</span>
          <ActionIcon
            color="white"
            variant="subtle"
            size="sm"
            onClick={(e) => {
              setVisitedAppVersion(appConfig.version);
              e.stopPropagation();
            }}
          >
            <IoMdClose size={20} />
          </ActionIcon>
        </div>
      )}
      {children}
      <footer className="shadow-shadow flex justify-evenly py-2 bg-white rounded-t-xl text-[#bcc7de] z-20">
        {navigationConfig.map(({ label, href, icon: Icon }, index) => (
          <Link
            key={index}
            href={href}
            className={`flex flex-col items-center ${
              href === pathname ? "text-primary" : ""
            }`}
          >
            <Icon size={25} />
            <span className="font-bold text-sm">{label}</span>
          </Link>
        ))}
      </footer>
    </>
  );
}

// The persisted store is browser-only. Render the same loading state on the
// server and during hydration, then mount the shell with the saved preferences.
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function AppLoading() {
  return (
    <div role="status" className="m-auto text-gray-400">
      Ładowanie planu zajęć…
    </div>
  );
}

export default function AppProviders({
  children,
  headingFontClassName,
  gaId,
}: {
  children: React.ReactNode;
  headingFontClassName: string;
  gaId: string | null;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();
  const online = useOnlineStatus();
  const [cacheUsed, setCacheUsed] = useState(false);
  const hasMounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "SCHEDULE_CACHE_USED") setCacheUsed(true);
      if (event.data?.type === "SCHEDULE_NETWORK_USED") setCacheUsed(false);
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);
    return () =>
      navigator.serviceWorker?.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    const refreshSchedule = () => {
      void queryClient.invalidateQueries({ queryKey: ["mentor"] });
      void queryClient.invalidateQueries({ queryKey: ["mentor-ab"] });
    };
    window.addEventListener("online", refreshSchedule);
    navigator.serviceWorker?.addEventListener(
      "controllerchange",
      refreshSchedule,
    );
    return () => {
      window.removeEventListener("online", refreshSchedule);
      navigator.serviceWorker?.removeEventListener(
        "controllerchange",
        refreshSchedule,
      );
    };
  }, [queryClient]);

  return (
    <SerwistProvider
      swUrl="/sw.js"
      disable={process.env.NODE_ENV !== "production"}
      reloadOnOnline={false}
    >
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={theme}>
          <ModalsProvider>
            <InstallBanner visible={hasMounted} />
            {hasMounted &&
              ["/day", "/timetable", "/settings"].includes(pathname) &&
              (cacheUsed || !online) && (
                <div
                  role="status"
                  className="border-b border-red-200 bg-red-100 px-4 py-1 text-sm text-red-800"
                >
                  Tryb offline. Dane mogą być nieaktualne.
                </div>
              )}
            {hasMounted ? (
              <CookieConsentProvider gaId={gaId}>
                <Suspense fallback={<AppLoading />}>
                  <AppShell headingFontClassName={headingFontClassName}>
                    {children}
                  </AppShell>
                </Suspense>
              </CookieConsentProvider>
            ) : (
              <AppLoading />
            )}
          </ModalsProvider>
        </MantineProvider>
      </QueryClientProvider>
    </SerwistProvider>
  );
}
