export const studyModes = ["FULL_TIME", "PART_TIME", "POSTGRADUATE"] as const;

export type StudyMode = (typeof studyModes)[number];
export type SupportedStudyMode = Extract<StudyMode, "FULL_TIME" | "PART_TIME">;
