import { useState } from 'react';

import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectList,
  MultiSelectSearch,
  MultiSelectTrigger,
  MultiSelectValue,
} from '@/components/custom/multi-select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type MultiSelectOption = {
  label: string;
  value: unknown;
};

type MultiSelectPiecePropertyProps = {
  placeholder: string;
  options: MultiSelectOption[];
  onChange: (value: unknown[]) => void;
  initialValues: unknown[];
  disabled?: boolean;
  enableSelectOrClear?: boolean;
};

const MultiSelectPieceProperty = ({
  placeholder,
  options,
  onChange,
  disabled,
  initialValues,
  enableSelectOrClear,
}: MultiSelectPiecePropertyProps) => {
  const selectedIndicies = Array.isArray(initialValues)
    ? initialValues
        .map((value) =>
          String(options.findIndex((option) => option.value === value)),
        )
        .filter((index) => index !== undefined && index !== '-1') || []
    : [];

  const sendChanges = (indicides: string[]) => {
    const newSelectedIndicies = indicides.filter(
      (index) => index !== undefined,
    );
    onChange(newSelectedIndicies.map((index) => options[Number(index)].value));
  };

  return (
    <MultiSelect
      value={selectedIndicies}
      onValueChange={sendChanges}
      disabled={disabled}
    >
      <MultiSelectTrigger className="w-full">
        <MultiSelectValue placeholder={placeholder} />
      </MultiSelectTrigger>
      <MultiSelectContent>
        <MultiSelectSearch />
        {enableSelectOrClear && (
          <SelectOrClear
            allSelected={selectedIndicies.length === options.length}
            sendChanges={(changeType) => {
              switch (changeType) {
                case 'selectAll':
                  sendChanges(options.map((_, i) => i.toString()));
                  break;
                case 'clear':
                  sendChanges([]);
                  break;
              }
            }}
          />
        )}

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

const SelectOrClear = ({
  allSelected,
  sendChanges,
}: {
  allSelected: boolean;
  sendChanges: (changeType: 'selectAll' | 'clear') => void;
}) => {
  const [checked, setChecked] = useState(allSelected);

  const onCheckedChange = (checked: boolean) => {
    sendChanges(checked ? 'selectAll' : 'clear');
    setChecked(checked);
  };

  return (
    <div className="flex justify-start items-center py-2 px-1">
      <Checkbox
        id="select-all"
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <Label className="text-sm ml-2" onClick={() => onCheckedChange(!checked)}>
        {allSelected ? 'Clear all' : 'Select All'}
      </Label>
    </div>
  );
};

MultiSelectPieceProperty.displayName = 'MultiSelectPieceProperty';
export { MultiSelectPieceProperty };
