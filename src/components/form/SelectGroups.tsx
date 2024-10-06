"use client";
import { useGetTimetable } from "@/api/timetable/getTimatable";
import { useAppState } from "@/store/useAppState";
import { useMemo } from "react";
import {
  InputMultiselectPure,
  TInputMultiselectPureProps,
} from "./common/InputMultiselect";

export const SelectGroups = (props: Partial<TInputMultiselectPureProps>) => {
  const { majorId, specializationIds, excludedGroups, setExcludedGroups } =
    useAppState();

  const { data: weekA, isLoading: isLoadingWeekA } = useGetTimetable({
    week: 1,
    specializationIds,
    majorId,
  });

  const { data: weekB, isLoading: isLoadingWeekB } = useGetTimetable({
    week: 2,
    specializationIds,
    majorId,
  });

  const groups = useMemo(() => {
    const groups = [...(weekA ?? []), ...(weekB ?? [])].map((lesson) => {
      return lesson.spec;
    });
    return Array.from(new Set(groups)).map((item) => ({
      label: item,
      value: item,
    }));
  }, [weekA, weekB]);

  const selectedOptions = groups
    .filter((item) => !excludedGroups?.includes(item.value))
    .map((item) => item.value);

  return (
    <>
      <InputMultiselectPure
        {...props}
        value={selectedOptions ?? null}
        onChange={(value) =>
          setExcludedGroups(
            groups
              .filter((item) => !value?.includes(item.value))
              .map((item) => item.value)
          )
        }
        placeholder="Wybierz grupy"
        label="Grupy"
        options={groups}
        isLoading={isLoadingWeekA || isLoadingWeekB}
      />
    </>
  );
};
