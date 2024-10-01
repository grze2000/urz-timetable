"use client";
import { useGetSpetializations } from "@/api/timetable/getSpecializations";
import { useAppState } from "@/store/useAppState";
import { useMemo } from "react";
import { InputSelectPure, TInputSelectPureProps } from "./common/InputSelect";

export const SelectSpecialization = (props: Partial<TInputSelectPureProps>) => {
  const { majorId, setSpecializationId, specializationId } = useAppState();
  const { data, isLoading } = useGetSpetializations(majorId);

  const options = useMemo(() => {
    if (!data) return [];
    return data.map((item) => ({
      value: item.id_k,
      label: item.k_nazwa,
    }));
  }, [data]);

  const selectedOption = options.find(
    (item) => item.value === specializationId
  )?.value;

  return (
    <>
      <InputSelectPure
        {...props}
        value={selectedOption ?? null}
        onChange={(value) => setSpecializationId(value as string)}
        placeholder="Wybierz specjalność"
        label="Specjalność"
        options={options}
        isLoading={isLoading}
      />
    </>
  );
};
