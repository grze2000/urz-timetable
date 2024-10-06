import {
  __InputStylesNames,
  Combobox,
  CSSProperties,
  Input,
  Pill,
  PillsInput,
  useCombobox,
} from "@mantine/core";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

export type TInputMultiselectPureProps = {
  value: string[] | null;
  onChange: (value: string[] | null) => void;
  options: {
    value: string;
    label: string;
  }[];
  isLoading?: boolean;
  label?: string;
  placeholder?: string;
  inputStyles?: Partial<Record<__InputStylesNames, CSSProperties>>;
};

export const InputMultiselectPure = ({
  value,
  onChange,
  options,
  isLoading,
  label,
  placeholder,
  inputStyles = {},
}: TInputMultiselectPureProps) => {
  const [search, setSearch] = useState("");

  const optionsElements = options
    .filter(
      (item) => !value?.includes(item.value) && item.label.includes(search)
    )
    .map((item) => (
      <Combobox.Option value={item.value} key={item.value}>
        {item.label}
      </Combobox.Option>
    ));

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const selectedOptions = options.filter((item) => value?.includes(item.value));

  const handleValueRemove = (item: string) => {
    onChange(value?.filter((i) => i !== item) || null);
  };

  const values = selectedOptions?.map((item) => (
    <Pill
      key={item.value}
      withRemoveButton
      onRemove={() => handleValueRemove(item.value)}
    >
      {item.label}
    </Pill>
  ));

  return (
    <Combobox
      store={combobox}
      withinPortal={true}
      onOptionSubmit={(val) => {
        onChange([...(value || []), val]);
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <PillsInput
          pointer
          onClick={() => {
            if (!combobox.dropdownOpened) combobox.openDropdown();
          }}
          styles={inputStyles}
          rightSection={<Combobox.Chevron />}
          label={label}
        >
          <Pill.Group>
            {!!value?.length ? (
              values
            ) : (
              <Input.Placeholder>{placeholder}</Input.Placeholder>
            )}

            <Combobox.EventsTarget>
              <PillsInput.Field
                onFocus={() => combobox.openDropdown()}
                onBlur={() => combobox.closeDropdown()}
                value={search}
                onChange={(event) => {
                  combobox.updateSelectedOptionIndex();
                  setSearch(event.currentTarget.value);
                }}
              />
            </Combobox.EventsTarget>
          </Pill.Group>
        </PillsInput>
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          {isLoading ? (
            <Combobox.Empty>Ładowanie....</Combobox.Empty>
          ) : (
            optionsElements
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};

export type TInputMultiselectProps = Omit<
  TInputMultiselectPureProps,
  "value" | "onChange"
> & {
  name: string;
};

export const InputMultiselect = ({
  name,
  ...props
}: TInputMultiselectProps) => {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { ref, value, onChange, ...field }, fieldState }) => {
        const { error } = fieldState;
        return (
          <InputMultiselectPure {...props} value={value} onChange={onChange} />
        );
      }}
    />
  );
};
