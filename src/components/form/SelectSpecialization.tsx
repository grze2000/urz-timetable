"use client";
import { useDictionaries } from "@/api/timetable/getDictionaries";
import { specializationOptions } from "@/utils/getStudyOptions";
import { useAppState } from "@/store/useAppState";
import { useMemo } from "react";
import {
  InputMultiselectPure,
  TInputMultiselectPureProps,
} from "./common/InputMultiselect";

export const SelectSpecialization = (
  props: Partial<TInputMultiselectPureProps>,
) => {
  const { majorId, setSpecializationIds, specializationIds } = useAppState();
  const { data, isLoading } = useDictionaries();

  const options = useMemo(() => {
    if (!data) return [];
    return specializationOptions(data, majorId);
  }, [data, majorId]);

  const selectedOptions = options
    .filter((item) => specializationIds?.includes(item.value))
    .map((item) => item.value);

  return (
    <>
      <InputMultiselectPure
        {...props}
        value={selectedOptions ?? null}
        onChange={(value) => setSpecializationIds(value ?? [])}
        placeholder="Wybierz specjalność"
        label="Specjalność"
        options={options}
        isLoading={isLoading}
      />
    </>
  );
};
