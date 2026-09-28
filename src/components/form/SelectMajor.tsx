"use client";
import { useDictionaries } from "@/api/timetable/getDictionaries";
import { majorOptions } from "@/utils/getStudyOptions";
import { useAppState } from "@/store/useAppState";
import { useMemo } from "react";
import { InputSelectPure, TInputSelectPureProps } from "./common/InputSelect";

export const SelectMajor = (props: Partial<TInputSelectPureProps>) => {
  const { majorId, setMajorId } = useAppState();
  const { data, isLoading } = useDictionaries();

  const options = useMemo(() => {
    if (!data) return [];
    return majorOptions(data);
  }, [data]);

  const selectedOption = options.find((item) => item.value === majorId)?.value;

  return (
    <>
      <InputSelectPure
        {...props}
        value={selectedOption ?? null}
        onChange={(value) => setMajorId(value as string)}
        placeholder="Wybierz kierunek"
        label="Kierunek studiów"
        options={options}
        isLoading={isLoading}
      />
    </>
  );
};
