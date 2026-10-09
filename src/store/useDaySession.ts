import { create } from "zustand";

type DaySession = {
  selectedDate: string | null;
  selectDate: (date: string | null) => void;
};

// Deliberately kept in memory: survives route changes, but not a new page load.
export const useDaySession = create<DaySession>((set) => ({
  selectedDate: null,
  selectDate: (selectedDate) => set({ selectedDate }),
}));
