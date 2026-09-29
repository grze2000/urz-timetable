import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Plan zajęć URz" },
  alternates: { canonical: "/timetable" },
};

export default function TimetableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
