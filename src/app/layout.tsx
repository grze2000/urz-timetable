"use client";
import { SelectMajor } from "@/components/form/SelectMajor";
import { SelectSpecialization } from "@/components/form/SelectSpetialization";
import { navigationConfig } from "@/config/navigationConfig";
import { useAppState } from "@/store/useAppState";
import { Button, createTheme, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dayjs from "dayjs";
import "dayjs/locale/pl";
import customParseFormat from "dayjs/plugin/customParseFormat";
import weekOfYear from "dayjs/plugin/weekOfYear";
import weekDay from "dayjs/plugin/weekday";
import { Inter, Roboto_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import urzLogo from "public/urz-logo.png";
import { useEffect, useState } from "react";
import "./globals.css";

dayjs.locale("pl");
dayjs.extend(weekOfYear);
dayjs.extend(weekDay);
dayjs.extend(customParseFormat);

const inter = Inter({ subsets: ["latin"] });
const corben = Roboto_Mono({ subsets: ["latin"] });

const queryClient = new QueryClient();

// export const metadata: Metadata = {
//   title: "Plan zajęć URz",
//   description: "Plan zajęć Uniwersytetu Rzeszowskiego",
// };

const theme = createTheme({
  /** Your theme override here */
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { majorId, specializationIds, setMaojrId, setSpecializationIds } =
    useAppState();
  const searchParams = useSearchParams();

  useEffect(() => {
    const queryMajorId = searchParams.get("majorId");
    const querySpecializationIds = searchParams.get("specializationIds");

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
  }, [searchParams]);

  const [initialSpecializationIds, setInitialSpecializationIds] =
    useState(specializationIds);

  return (
    <html lang="pl" className={`${inter.className} flex flex-col h-full`}>
      <body className={` bg-background flex flex-col flex-1 max-h-full`}>
        <QueryClientProvider client={queryClient}>
          <MantineProvider theme={theme}>
            {!majorId || !initialSpecializationIds?.length ? (
              <div className="bg-primary flex-1 flex flex-col gap-5 px-10">
                <Image
                  src={urzLogo}
                  alt="URz"
                  width={250}
                  className="self-center"
                />
                <h1
                  className={`text-white font-bold text-4xl text-center px-10 mb-10 ${corben.className}`}
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
                {children}
                <footer className="shadow-shadow flex justify-evenly py-2 bg-white rounded-t-xl text-[#bcc7de] z-20">
                  {navigationConfig.map(
                    ({ label, href, icon: Icon }, index) => (
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
                    )
                  )}
                </footer>
              </>
            )}
          </MantineProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
