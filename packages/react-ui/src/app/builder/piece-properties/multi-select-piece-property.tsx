import deepEqual from 'deep-equal';

import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectList,
  MultiSelectSearch,
  MultiSelectTrigger,
  MultiSelectValue,
} from '@/components/custom/multi-select';

type MultiSelectOption = {
  label: string;
  value: unknown;
};

type MultiSelectPiecePropertyProps = {
  placeholder: string;
  options: MultiSelectOption[];
  onChange: (value: unknown[]) => void;
  initialValues?: unknown[];
  disabled?: boolean;
};

const MultiSelectPieceProperty = ({
  placeholder,
  options,
  onChange,
  disabled,
  initialValues,
}: MultiSelectPiecePropertyProps) => {
  const selectedIndicies = initialValues
    ? initialValues
        .map((value) =>
          options.findIndex((option) => deepEqual(option.value, value)),
        )
        .filter((index) => index > -1)
        .map((index) => String(index))
    : [];
  const sendChanges = (indicides: string[]) => {
    const newSelectedIndicies = indicides.filter(
      (index) => index !== undefined,
    );
    onChange(newSelectedIndicies.map((index) => options[Number(index)].value));
  };

  return (
    <MultiSelect
      modal={true}
      value={selectedIndicies}
      onValueChange={sendChanges}
      disabled={disabled}
    >
      <MultiSelectTrigger className="w-full">
        <MultiSelectValue placeholder={placeholder} />
      </MultiSelectTrigger>
      <MultiSelectContent>
        <MultiSelectSearch />
        <MultiSelectList>
          {options.map((option, index) => (
            <MultiSelectItem key={index} value={String(index)}>
              {option.label}
            </MultiSelectItem>
          ))}
        </MultiSelectList>
      </MultiSelectContent>
    </MultiSelect>
  );
};

MultiSelectPieceProperty.displayName = 'MultiSelectPieceProperty';
export { MultiSelectPieceProperty };
