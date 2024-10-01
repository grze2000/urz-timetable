"use client";
import { useGetMajors } from "@/api/timetable/getMajors";
import { useAppState } from "@/store/useAppState";
import { useMemo } from "react";
import { InputSelectPure, TInputSelectPureProps } from "./common/InputSelect";

export const SelectMajor = (props: Partial<TInputSelectPureProps>) => {
  const { majorId, setMaojrId } = useAppState();
  const { data, isLoading } = useGetMajors();

  const options = useMemo(() => {
    if (!data) return [];
    return data.map((item) => ({
      value: item.id_k,
      label: item.k_nazwa,
    }));
  }, [data]);

  const selectedOption = options.find((item) => item.value === majorId)?.value;

  return (
    <>
      <InputSelectPure
        {...props}
        value={selectedOption ?? null}
        onChange={(value) => setMaojrId(value as string)}
        placeholder="Wybierz kierunek"
        label="Kierunek studiów"
        options={options}
        isLoading={isLoading}
      />
    </>
  );
};
