import type { Dictionaries } from "../modules/timetable/types/Dictionaries.ts";
import type { SupportedStudyMode } from "../modules/timetable/types/StudyMode.ts";

export const studyModeOptions = (dictionaries: Dictionaries) =>
  (["FULL_TIME", "PART_TIME"] as const)
    .filter(
      (mode) =>
        dictionaries.studyModes.includes(mode) &&
        dictionaries.groups.some(
          (group) =>
            group.active &&
            group.level === "COURSE" &&
            group.studyMode === mode,
        ),
    )
    .map((mode) => ({
      value: mode,
      label: mode === "FULL_TIME" ? "Stacjonarne" : "Niestacjonarne",
    }));

export const majorOptions = (
  dictionaries: Dictionaries,
  studyMode: SupportedStudyMode,
) =>
  dictionaries.groups
    .filter(
      (group) =>
        group.active &&
        group.level === "COURSE" &&
        group.studyMode === studyMode,
    )
    .sort((a, b) => a.name.localeCompare(b.name, "pl"))
    .map((group) => ({ value: group.id, label: group.name }));

export const specializationOptions = (
  dictionaries: Dictionaries,
  majorId?: string | null,
) =>
  dictionaries.groups
    .filter(
      (group) =>
        group.active &&
        group.level === "SPECIALIZATION" &&
        group.parentId === majorId,
    )
    .sort((a, b) => a.name.localeCompare(b.name, "pl"))
    .map((group) => ({ value: group.id, label: group.name }));

export function validSelection(
  selection: {
    studyMode: SupportedStudyMode;
    majorId: string | null;
    specializationIds: string[] | null;
  },
  dictionaries: Dictionaries,
) {
  const available = specializationOptions(dictionaries, selection.majorId).map(
    (group) => group.value,
  );
  return (
    studyModeOptions(dictionaries).some(
      (mode) => mode.value === selection.studyMode,
    ) &&
    majorOptions(dictionaries, selection.studyMode).some(
      (major) => major.value === selection.majorId,
    ) &&
    !!selection.specializationIds?.length &&
    selection.specializationIds.every((id) => available.includes(id))
  );
}
