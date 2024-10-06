import { appConfig } from "@/config/appConfig";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Set<T> = (fn: (state: T) => Partial<T>) => void;

export type TAppState = {
  majorId: string | null;
  specializationIds: string[] | null;
  visitedAppVersion: string | null;
};

export type TAppStateActions = {
  setMaojrId: (majorId: string) => void;
  setSpecializationIds: (specializationIds: string[]) => void;
  setVisitedAppVersion: (visitedAppVersion: string) => void;
};

export type TAppStateStore = TAppState & TAppStateActions;

const initialState: TAppState = {
  majorId: null,
  specializationIds: null,
  visitedAppVersion: appConfig.version,
};

const appState = (set: Set<TAppStateStore>): TAppStateStore => ({
  ...initialState,
  setMaojrId: (majorId: string) => set((state) => ({ majorId })),
  setSpecializationIds: (specializationIds: string[]) =>
    set((state) => ({ specializationIds })),
  setVisitedAppVersion: (visitedAppVersion: string) =>
    set((state) => ({ visitedAppVersion })),
});

export const useAppState = create(
  persist(appState, { name: "urz-timetable-state" })
);
