import { useEffect, useState } from 'react';

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

const SELECT_OR_CLEAR_MIN_OPTIONS = 3;

const MultiSelectPieceProperty = ({
  placeholder,
  options,
  onChange,
  disabled,
  initialValues,
  enableSelectOrClear,
}: MultiSelectPiecePropertyProps) => {
  const [filteredOptions, setFilteredOptions] =
    useState<MultiSelectOption[]>(options);
  const selectClearEnabled =
    enableSelectOrClear && options.length > SELECT_OR_CLEAR_MIN_OPTIONS;

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

  const onSearchChanged = (searchTerm: string | undefined) => {
    if (!searchTerm) {
      setFilteredOptions(options);
      return;
    }

    if (Array.isArray(options)) {
      const filtered = options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.trim().toLowerCase()),
      );
      setFilteredOptions(filtered);
    }
  };

  const onSelectOrClearChanged = (changeType: SelectOrClearChangeType) => {
    if (changeType === 'selectAll') {
      sendChanges(options.map((_, index) => String(index)));
    } else {
      sendChanges([]);
    }
  };

  return (
    <MultiSelect
      value={selectedIndicies}
      onValueChange={sendChanges}
      onSearch={onSearchChanged}
      disabled={disabled}
    >
      <MultiSelectTrigger className="w-full">
        <MultiSelectValue placeholder={placeholder} />
      </MultiSelectTrigger>
      <MultiSelectContent>
        <MultiSelectSearch />
        {selectClearEnabled && (
          <SelectOrClear
            allSelected={selectedIndicies.length === options.length}
            sendChanges={onSelectOrClearChanged}
          />
        )}
        <MultiSelectList>
          {filteredOptions.map((option, index) => (
            <MultiSelectItem key={index} value={String(index)}>
              {option.label}
            </MultiSelectItem>
          ))}
        </MultiSelectList>
      </MultiSelectContent>
    </MultiSelect>
  );
};

type SelectOrClearChangeType = 'selectAll' | 'clear';
type SelectOrClearProps = {
  allSelected: boolean;
  sendChanges: (changeType: SelectOrClearChangeType) => void;
};

const SelectOrClear = ({ allSelected, sendChanges }: SelectOrClearProps) => {
  const [checked, setChecked] = useState(allSelected);

  useEffect(() => {
    setChecked(allSelected);
  }, [allSelected]);

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
