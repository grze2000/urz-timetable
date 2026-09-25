import { Inter, Roboto_Mono } from "next/font/google";
import "@mantine/core/styles.css";
import AppProviders from "./app-providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const robotoMono = Roboto_Mono({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
