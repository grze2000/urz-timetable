import { appConfig } from "@/config/appConfig";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Set<T> = (fn: (state: T) => Partial<T>) => void;

export type TAppState = {
  majorId: string | null;
  specializationId: string | null;
  visitedAppVersion: string | null;
};

export type TAppStateActions = {
  setMaojrId: (majorId: string) => void;
  setSpecializationId: (specializationId: string) => void;
};

export type TAppStateStore = TAppState & TAppStateActions;

const initialState: TAppState = {
  majorId: null,
  specializationId: null,
  visitedAppVersion: appConfig.version,
};

const appState = (set: Set<TAppStateStore>): TAppStateStore => ({
  ...initialState,
  setMaojrId: (majorId: string) => set((state) => ({ majorId })),
  setSpecializationId: (specializationId: string) =>
    set((state) => ({ specializationId })),
});

export const useAppState = create(
  persist(appState, { name: "urz-timetable-state" })
);
