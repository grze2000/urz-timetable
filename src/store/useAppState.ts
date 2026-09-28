import { create } from "zustand";
import { persist } from "zustand/middleware";
import { emptyPreferences, readPreferences } from "./preferences";
import type { Preferences } from "./preferences";

export type TAppState = Preferences;
export type TAppStateStore = TAppState & {
  setMajorId: (majorId: string) => void;
  setSpecializationIds: (specializationIds: string[]) => void;
  setExcludedGroups: (excludedGroups: string[]) => void;
  setVisitedAppVersion: (version: string) => void;
  excludeLesson: (id: string) => void;
  restoreLesson: (id: string) => void;
  replacePreferences: (preferences: Preferences) => void;
};
export const useAppState = create<TAppStateStore>()(
  persist(
    (set) => ({
      ...emptyPreferences(),
      setMajorId: (majorId) =>
        set({
          majorId,
          specializationIds: null,
          excludedGroups: null,
          excludedLessons: [],
        }),
      setSpecializationIds: (specializationIds) =>
        set({ specializationIds, excludedGroups: null, excludedLessons: [] }),
      setExcludedGroups: (excludedGroups) => set({ excludedGroups }),
      setVisitedAppVersion: (visitedAppVersion) => set({ visitedAppVersion }),
      excludeLesson: (id) =>
        set((state) => ({
          excludedLessons: [...new Set([...state.excludedLessons, id])],
        })),
      restoreLesson: (id) =>
        set((state) => ({
          excludedLessons: state.excludedLessons.filter(
            (value) => value !== id,
          ),
        })),
      replacePreferences: (preferences) => set(preferences),
    }),
    {
      name: "urz-timetable-mentor-ab-state",
      partialize: (state) => readPreferences(state),
      merge: (persisted, current) => ({
        ...current,
        ...readPreferences(persisted),
      }),
    },
  ),
);
