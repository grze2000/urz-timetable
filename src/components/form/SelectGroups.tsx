"use client";
import { useGetTimetable } from "@/api/timetable/getTimetable";
import { useAppState } from "@/store/useAppState";
import { useMemo } from "react";
import {
  InputMultiselectPure,
  TInputMultiselectPureProps,
} from "./common/InputMultiselect";

export const SelectGroups = (props: Partial<TInputMultiselectPureProps>) => {
  const {
    studyMode,
    majorId,
    specializationIds,
    excludedGroups,
    setExcludedGroups,
  } = useAppState();

  const firstQuery = useGetTimetable({
    studyMode,
    week: 1,
    specializationIds,
    majorId,
  });

  const secondQuery = useGetTimetable({
    studyMode,
    week: 2,
    specializationIds,
    majorId,
    enabled: studyMode === "FULL_TIME",
  });

  const isFullTime = studyMode === "FULL_TIME";
  const isLoading =
    firstQuery.isLoading || (isFullTime && secondQuery.isLoading);
  const isError = firstQuery.isError || (isFullTime && secondQuery.isError);
  const hasCompleteTimetable =
    !isLoading &&
    !isError &&
    !!firstQuery.data &&
    (!isFullTime || !!secondQuery.data);

  const groups = useMemo(() => {
    if (!hasCompleteTimetable) return [];
    const groups = [
      ...firstQuery.data,
      ...(isFullTime ? (secondQuery.data ?? []) : []),
    ];
    return Array.from(
      new Map(
        groups.map((lesson) => [
          lesson.groupId,
          { label: lesson.groupName, value: lesson.groupId },
        ]),
      ).values(),
    );
  }, [hasCompleteTimetable, isFullTime, firstQuery.data, secondQuery.data]);

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
          Nie udało się pobrać grup z planu. Odśwież stronę i spróbuj ponownie.
        </p>
      )}
    </>
  );
};
