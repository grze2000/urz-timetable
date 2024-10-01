import {
  __InputStylesNames,
  Combobox,
  CSSProperties,
  InputBase,
  useCombobox,
} from "@mantine/core";
import { Controller, useFormContext } from "react-hook-form";

export type TInputSelectPureProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  options: {
    value: string;
    label: string;
  }[];
  isLoading?: boolean;
  label?: string;
  placeholder?: string;
  inputStyles?: Partial<Record<__InputStylesNames, CSSProperties>>;
};

export const InputSelectPure = ({
  value,
  onChange,
  options,
  isLoading,
  label,
  placeholder,
  inputStyles = {},
}: TInputSelectPureProps) => {
  const optionsElements = options.map((item) => (
    <Combobox.Option value={item.value} key={item.value}>
      {item.label}
    </Combobox.Option>
  ));

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const selectedItem = options.find((item) => item.value === value);

  return (
    <Combobox
      store={combobox}
      withinPortal={true}
      onOptionSubmit={(val) => {
        onChange(val);
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          rightSection={<Combobox.Chevron />}
          value={selectedItem?.label}
          onClick={() => combobox.toggleDropdown()}
          label={label}
          placeholder={placeholder}
          rightSectionPointerEvents="none"
          styles={inputStyles}
        />
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

export type TInputSelectProps = Omit<
  TInputSelectPureProps,
  "value" | "onChange"
> & {
  name: string;
};

export const InputSelect = ({ name, ...props }: TInputSelectProps) => {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { ref, value, onChange, ...field }, fieldState }) => {
        const { error } = fieldState;
        return <InputSelectPure {...props} value={value} onChange={onChange} />;
      }}
    />
  );
};
