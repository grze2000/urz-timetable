import {
  Combobox,
  InputBase,
  type InputBaseProps,
  useCombobox,
} from "@mantine/core";

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
  inputStyles?: InputBaseProps["styles"];
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
          value={selectedItem?.label ?? ""}
          readOnly
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
