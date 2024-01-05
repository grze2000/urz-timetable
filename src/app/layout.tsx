"use client";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { navigationConfig } from "@/config/navigationConfig";
import dayjs from "dayjs";
import "dayjs/locale/pl";
import { QueryClient, QueryClientProvider } from "react-query";
import { usePathname, useRouter } from "next/navigation";
import weekOfYear from "dayjs/plugin/weekOfYear";
import weekDay from "dayjs/plugin/weekday";

dayjs.locale("pl");
dayjs.extend(weekOfYear);
dayjs.extend(weekDay);

const inter = Inter({ subsets: ["latin"] });

const queryClient = new QueryClient();

// export const metadata: Metadata = {
//   title: "Plan zajęć URz",
//   description: "Plan zajęć Uniwersytetu Rzeszowskiego",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <html lang="pl" className={`${inter.className} flex flex-col h-full`}>
      <body className={` bg-background flex flex-col flex-1 max-h-full`}>
        <QueryClientProvider client={queryClient}>
          <header className="bg-primary p-4 pt-12 font-bold text-2xl text-white z-20">
            <h1 className="grow overflow-auto">Mój dzień</h1>
          </header>
          <main className="grow p-4 min-w-0 min-h-0">{children}</main>
          <footer className="shadow-shadow flex justify-evenly py-2 bg-white rounded-t-xl text-[#bcc7de] z-20">
            {navigationConfig.map(({ label, href, icon: Icon }) => (
              <Link href={href} className={`flex flex-col items-center ${href === pathname ? 'text-primary' : ''}`}>
                <Icon size={25} />
                <span className="font-bold text-sm">{label}</span>
              </Link>
            ))}
          </footer>
        </QueryClientProvider>
      </body>
    </html>
  );
}
