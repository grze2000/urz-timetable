"use client";
import { useGetTimetable } from "@/api/timetable/getTimetable";
import { useAppState } from "@/store/useAppState";
import { useMemo } from "react";
import {
  InputMultiselectPure,
  TInputMultiselectPureProps,
} from "./common/InputMultiselect";

export const SelectGroups = (props: Partial<TInputMultiselectPureProps>) => {
  const { majorId, specializationIds, excludedGroups, setExcludedGroups } =
    useAppState();

  const {
    data: weekA,
    isLoading: isLoadingWeekA,
    isError: isErrorWeekA,
  } = useGetTimetable({
    week: 1,
    specializationIds,
    majorId,
  });

  const {
    data: weekB,
    isLoading: isLoadingWeekB,
    isError: isErrorWeekB,
  } = useGetTimetable({
    week: 2,
    specializationIds,
    majorId,
  });

  const isLoading = isLoadingWeekA || isLoadingWeekB;
  const isError = isErrorWeekA || isErrorWeekB;
  const hasCompleteTimetable = !isLoading && !isError && !!weekA && !!weekB;

  const groups = useMemo(() => {
    if (!hasCompleteTimetable) return [];
    const groups = [...weekA, ...weekB];
    return Array.from(
      new Map(
        groups.map((lesson) => [
          lesson.groupId,
          { label: lesson.groupName, value: lesson.groupId },
        ]),
      ).values(),
    );
  }, [hasCompleteTimetable, weekA, weekB]);

  const selectedOptions = groups
    .filter((item) => !excludedGroups?.includes(item.value))
    .map((item) => item.value);

  return (
    <>
      <InputMultiselectPure
        {...props}
        value={selectedOptions ?? null}
        onChange={(value) => {
          if (!hasCompleteTimetable) return;
          setExcludedGroups(
            groups
              .filter((item) => !value?.includes(item.value))
              .map((item) => item.value),
          );
        }}
        placeholder="Wybierz grupy"
        label="Grupy"
        options={groups}
        isLoading={isLoading}
        disabled={!hasCompleteTimetable}
      />
      {isError && (
        <p className="text-sm text-red-600">
          Nie udało się pobrać grup z obu tygodni. Odśwież stronę i spróbuj
          ponownie.
        </p>
      )}
    </>
  );
};
