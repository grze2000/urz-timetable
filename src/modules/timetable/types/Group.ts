import type { StudyMode } from "./StudyMode.ts";

export type Group = {
  id: string;
  name: string;
  level: "COURSE" | "SPECIALIZATION" | "GROUP" | "WORKSHOP";
  studyMode: StudyMode | "UNASSIGNED";
  parentId: string | null;
  active: boolean;
};
