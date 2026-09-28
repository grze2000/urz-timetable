import {
  Combobox,
  Input,
  Pill,
  PillsInput,
  type PillsInputProps,
  useCombobox,
} from "@mantine/core";
import { useState } from "react";

export type TInputMultiselectPureProps = {
  value: string[] | null;
  onChange: (value: string[] | null) => void;
  options: {
    value: string;
    label: string;
  }[];
  isLoading?: boolean;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  inputStyles?: PillsInputProps["styles"];
};

export const InputMultiselectPure = ({
  value,
  onChange,
  options,
  isLoading,
  disabled = false,
  label,
  placeholder,
  inputStyles = {},
}: TInputMultiselectPureProps) => {
  const [search, setSearch] = useState("");

  const optionsElements = options
    .filter(
      (item) => !value?.includes(item.value) && item.label.includes(search),
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
    if (disabled) return;
    onChange(value?.filter((i) => i !== item) || null);
  };

  const values = selectedOptions?.map((item) => (
    <Pill
      key={item.value}
      withRemoveButton={!disabled}
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
        if (disabled) return;
        onChange([...(value || []), val]);
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <PillsInput
          pointer
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
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
                disabled={disabled}
                onFocus={() => {
                  if (!disabled) combobox.openDropdown();
                }}
                onBlur={() => combobox.closeDropdown()}
                value={search}
                onChange={(event) => {
                  if (disabled) return;
                  combobox.openDropdown();
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
          ) : optionsElements.length ? (
            optionsElements
          ) : (
            <Combobox.Empty>Brak wyników</Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};
