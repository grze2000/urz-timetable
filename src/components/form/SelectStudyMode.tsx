"use client";
import { useDictionaries } from "@/api/timetable/getDictionaries";
import { useAppState } from "@/store/useAppState";
import { studyModeOptions } from "@/utils/getStudyOptions";
import { useMemo } from "react";
import { InputSelectPure, TInputSelectPureProps } from "./common/InputSelect";

export const SelectStudyMode = (props: Partial<TInputSelectPureProps>) => {
  const { studyMode, setStudyMode } = useAppState();
  const { data, isLoading } = useDictionaries();

  const options = useMemo(() => (data ? studyModeOptions(data) : []), [data]);

  return (
    <InputSelectPure
      {...props}
      value={
        options.some((option) => option.value === studyMode) ? studyMode : null
      }
      onChange={(value) => {
        if (value === "FULL_TIME" || value === "PART_TIME") {
          setStudyMode(value);
        }
      }}
      placeholder="Wybierz tryb studiów"
      label="Tryb studiów"
      options={options}
      isLoading={isLoading}
    />
  );
};
