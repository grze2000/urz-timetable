"use client";
import { SelectMajor } from "@/components/form/SelectMajor";
import { SelectSpecialization } from "@/components/form/SelectSpetialization";
import { appConfig } from "@/config/appConfig";
import { navigationConfig } from "@/config/navigationConfig";
import { useAppState } from "@/store/useAppState";
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
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import urzLogo from "public/urz-logo.png";
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
  const {
    majorId,
    specializationIds,
    visitedAppVersion,
    setVisitedAppVersion,
  } = useAppState();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Read current preferences only when the URL changes. Changes made in
    // settings must not reapply the original sharing link.
    const {
      majorId,
      specializationIds,
      excludedGroups,
      setMaojrId,
      setSpecializationIds,
      setExcludedGroups,
    } = useAppState.getState();
    const queryMajorId = searchParams.get("majorId");
    const querySpecializationIds = searchParams.get("specializationIds");
    const queryExcludedGroups = searchParams.get("excludedGroups");

    if (queryMajorId && !majorId) {
      setMaojrId(queryMajorId);
    }

    if (
      querySpecializationIds &&
      (!specializationIds || !specializationIds.length)
    ) {
      const idsArray = querySpecializationIds.split(",");
      setSpecializationIds(idsArray);
    }

    if (queryExcludedGroups && (!excludedGroups || !excludedGroups.length)) {
      const excludedGroups = queryExcludedGroups.split(",");
      setExcludedGroups(excludedGroups);
    }
  }, [searchParams]);

  const [initialSpecializationIds, setInitialSpecializationIds] =
    useState(specializationIds);

  return (
    <>
      {!majorId || !initialSpecializationIds?.length ? (
        <div className="bg-primary flex-1 flex flex-col gap-5 px-10">
          <Image
            src={urzLogo}
            alt="URz"
            width={250}
            className="self-center"
          />
          <h1
            className={`text-white font-bold text-4xl text-center px-10 mb-10 ${headingFontClassName}`}
          >
            Plan zajęć
          </h1>
          <SelectMajor
            inputStyles={{
              label: {
                color: "white",
              },
            }}
          />
          <SelectSpecialization
            inputStyles={{
              label: {
                color: "white",
              },
            }}
          />
          <Button
            variant="white"
            className="self-center"
            disabled={!majorId || !specializationIds?.length}
            onClick={() => setInitialSpecializationIds(specializationIds)}
          >
            Pokaż plan zajęć
          </Button>
        </div>
      ) : (
        <>
          {visitedAppVersion !== appConfig.version && (
            <div
              className="fixed top-0 left-0 z-30 bg-green-500 text-white w-full shadow-sm py-1.5 px-2.5 flex items-center justify-between font-semibold"
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
                      <Button
                        className="ml-auto mt-2"
                        onClick={modals.closeAll}
                      >
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
      )}
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
}: {
  children: React.ReactNode;
  headingFontClassName: string;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const hasMounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <ModalsProvider>
          <Suspense fallback={<AppLoading />}>
            {hasMounted ? (
              <AppShell headingFontClassName={headingFontClassName}>
                {children}
              </AppShell>
            ) : (
              <AppLoading />
            )}
          </Suspense>
        </ModalsProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}
