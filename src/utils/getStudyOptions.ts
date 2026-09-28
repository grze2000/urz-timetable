import type { Dictionaries } from "../modules/timetable/types/Dictionaries.ts";

export const majorOptions = (dictionaries: Dictionaries) =>
  dictionaries.groups
    .filter(
      (group) =>
        group.active &&
        group.level === "COURSE" &&
        group.studyMode === "FULL_TIME",
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
  selection: { majorId: string | null; specializationIds: string[] | null },
  dictionaries: Dictionaries,
) {
  const available = specializationOptions(dictionaries, selection.majorId).map(
    (group) => group.value,
  );
  return (
    majorOptions(dictionaries).some(
      (major) => major.value === selection.majorId,
    ) &&
    !!selection.specializationIds?.length &&
    selection.specializationIds.every((id) => available.includes(id))
  );
}
