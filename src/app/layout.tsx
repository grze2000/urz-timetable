import { Inter, Roboto_Mono } from "next/font/google";
import type { Metadata } from "next";
import "@mantine/core/styles.css";
import { siteUrl } from "@/config/siteUrl";
import AppProviders from "./app-providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const robotoMono = Roboto_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Plan zajęć URz",
    template: "%s | Plan zajęć URz",
  },
  description:
    "Sprawdź plan zajęć Uniwersytetu Rzeszowskiego na podstawie danych systemu Mentor.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className={`${inter.className} flex flex-col h-full`}>
      <body className="bg-background flex flex-col flex-1 max-h-full">
        <AppProviders headingFontClassName={robotoMono.className}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
