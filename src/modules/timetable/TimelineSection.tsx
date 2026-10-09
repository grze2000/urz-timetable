import { segmentProgress } from "@/utils/dayProgress";
import type { ReactNode } from "react";

export const TimelineSection = ({
  start,
  end,
  now,
  children,
}: {
  start: number;
  end: number;
  now: number | null;
  children: ReactNode;
}) => (
  <div
    className="relative flow-root"
    data-time-start={start}
    data-time-end={end}
  >
    <div
      className="absolute w-1 -left-5 inset-y-0 bg-gray-200"
      aria-hidden="true"
    >
      {now !== null && (
        <div
          className="w-full bg-primary"
          style={{ height: `${segmentProgress(now, start, end) * 100}%` }}
        />
      )}
    </div>
    {children}
  </div>
);
