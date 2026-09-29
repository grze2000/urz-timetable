import { isUuid } from "../utils/isUuid.ts";
import type { Dictionaries } from "../modules/timetable/types/Dictionaries.ts";
import { getGroupPath } from "../utils/getGroupPath.ts";
import { validSelection } from "../utils/getStudyOptions.ts";
import type { SupportedStudyMode } from "../modules/timetable/types/StudyMode.ts";

export type Preferences = {
  studyMode: SupportedStudyMode;
  majorId: string | null;
  specializationIds: string[] | null;
  excludedGroups: string[] | null;
  excludedLessons: string[];
  visitedAppVersion: string | null;
};
export const emptyPreferences = (): Preferences => ({
  studyMode: "FULL_TIME",
  majorId: null,
  specializationIds: null,
  excludedGroups: null,
  excludedLessons: [],
  visitedAppVersion: null,
});
const ids = (value: unknown): string[] | null =>
  Array.isArray(value) && value.every(isUuid) ? [...new Set(value)] : null;
export function readPreferences(value: unknown): Preferences {
  if (!value || typeof value !== "object") return emptyPreferences();
  const record = value as Record<string, unknown>;
  return {
    studyMode: record.studyMode === "PART_TIME" ? "PART_TIME" : "FULL_TIME",
    majorId: isUuid(record.majorId) ? record.majorId : null,
    specializationIds: ids(record.specializationIds),
    excludedGroups: ids(record.excludedGroups),
    excludedLessons: ids(record.excludedLessons) ?? [],
    visitedAppVersion:
      typeof record.visitedAppVersion === "string"
        ? record.visitedAppVersion
        : null,
  };
}
export function preferencesFromLink(
  params: URLSearchParams,
  dictionaries: Dictionaries,
): Preferences | null {
  if (params.get("api") !== "mentor-ab") return null;
  const studyMode = params.get("studyMode");
  if (
    studyMode !== null &&
    studyMode !== "FULL_TIME" &&
    studyMode !== "PART_TIME"
  ) {
    return null;
  }
  const preferences = readPreferences({
    studyMode,
    majorId: params.get("majorId"),
    specializationIds: params.get("specializationIds")?.split(","),
    excludedGroups: params.get("excludedGroups")?.split(",") ?? [],
  });
  if (
    !validSelection(preferences, dictionaries) ||
    preferences.specializationIds?.join(",") !== params.get("specializationIds")
  )
    return null;
  if (
    (preferences.excludedGroups ?? []).join(",") !==
    (params.get("excludedGroups") ?? "")
  )
    return null;
  if (
    preferences.excludedGroups?.some(
      (id) =>
        !getGroupPath(id, dictionaries.groups).some((g) =>
          preferences.specializationIds!.includes(g.id),
        ),
    )
  )
    return null;
  return preferences;
}

export function createShareUrl(
  baseUrl: string,
  preferences: Pick<
    Preferences,
    "studyMode" | "majorId" | "specializationIds" | "excludedGroups"
  >,
): string {
  const url = new URL(baseUrl);
  url.search = "";
  url.hash = "";
  url.searchParams.set("api", "mentor-ab");
  url.searchParams.set("studyMode", preferences.studyMode);
  if (preferences.majorId) url.searchParams.set("majorId", preferences.majorId);
  if (preferences.specializationIds) {
    url.searchParams.set(
      "specializationIds",
      preferences.specializationIds.join(","),
    );
  }
  if (preferences.excludedGroups) {
    url.searchParams.set(
      "excludedGroups",
      preferences.excludedGroups.join(","),
    );
  }
  return url.toString();
}
