"use client";
import { useGetSpetializations } from "@/api/timetable/getSpecializations";
import { useAppState } from "@/store/useAppState";
import { useMemo } from "react";
import {
  InputMultiselectPure,
  TInputMultiselectPureProps,
} from "./common/InputMultiselect";

export const SelectSpecialization = (
  props: Partial<TInputMultiselectPureProps>
) => {
  const { majorId, setSpecializationIds, specializationIds } = useAppState();
  const { data, isLoading } = useGetSpetializations(majorId);

  const options = useMemo(() => {
    if (!data) return [];
    return data.map((item) => ({
      value: item.id_k,
      label: item.k_nazwa,
    }));
  }, [data]);

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
