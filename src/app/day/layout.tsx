import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mój dzień",
  alternates: { canonical: "/day" },
};

export default function DayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
