import type { DisplayLesson } from "./DisplayLesson.ts";

export type ScheduledLesson = DisplayLesson & { breakBefore: number };
