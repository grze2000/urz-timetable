export const studyModes = ["FULL_TIME", "PART_TIME", "POSTGRADUATE"] as const;

export type StudyMode = (typeof studyModes)[number];
