import { appNow } from "./appNow.ts";

export const timeInMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export function dayClock(now = appNow()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Warsaw",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: string) =>
    Number(parts.find((item) => item.type === type)?.value);
  return part("hour") * 60 + part("minute") + part("second") / 60;
}

export const segmentProgress = (now: number, start: number, end: number) =>
  end <= start
    ? now >= end
      ? 1
      : 0
    : Math.min(1, Math.max(0, (now - start) / (end - start)));

export function remainingBreak(now: number, start: number, duration: number) {
  if (duration <= 0 || now < start - duration || now >= start) return null;
  const minutes = Math.ceil(start - now);
  return minutes < 60
    ? `Pozostało Ci ${minutes} min przerwy`
    : `Pozostało Ci ${Math.floor(minutes / 60)} h ${minutes % 60} min przerwy`;
}

export function remainingDay(now: number, endTimes: string[]) {
  if (!endTimes.length) return null;
  const end = Math.max(...endTimes.map(timeInMinutes));
  if (now >= end) return null;
  const minutes = Math.ceil(end - now);
  return minutes < 60
    ? `${minutes} min do końca`
    : `${Math.floor(minutes / 60)} h ${minutes % 60} min do końca`;
}

export type TimelineSegment = {
  start: number;
  end: number;
  top: number;
  height: number;
};

export function timelineScrollTop(
  segments: TimelineSegment[],
  now: number,
  maximum: number,
) {
  if (!segments.length || now < segments[0].start) return 0;
  if (now >= Math.max(...segments.map((segment) => segment.end)))
    return Math.max(0, maximum);
  const segment =
    segments.find((item) => item.start <= now && now < item.end) ??
    segments.find((item) => item.start > now);
  if (!segment) return Math.max(0, maximum);
  return Math.max(
    0,
    Math.min(
      maximum,
      segment.top +
        segment.height * segmentProgress(now, segment.start, segment.end),
    ),
  );
}
