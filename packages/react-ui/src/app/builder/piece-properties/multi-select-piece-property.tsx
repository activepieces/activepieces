import { CheckedState } from '@radix-ui/react-checkbox';
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
  const selectClearEnabled =
    enableSelectOrClear && options.length > SELECT_OR_CLEAR_MIN_OPTIONS;

  const onSelectOrClearChanged = (changeType: SelectOrClearChangeType) => {
    if (changeType === 'selectAll') {
      onChange(options.map((o) => String(o.value)));
    } else {
      onChange([]);
    }
  };

  return (
    <MultiSelect
      value={initialValues as string[]}
      onValueChange={onChange}
      disabled={disabled}
      filter={true}
    >
      <MultiSelectTrigger className="w-full">
        <MultiSelectValue placeholder={placeholder} />
      </MultiSelectTrigger>
      <MultiSelectContent>
        <MultiSelectSearch />
        {selectClearEnabled && (
          <SelectOrClear
            selectedCount={initialValues.length}
            totalCount={options.length}
            sendChanges={onSelectOrClearChanged}
          />
        )}
        <MultiSelectList>
          {options.map((option) => (
            <MultiSelectItem
              key={String(option.value)}
              value={String(option.value)}
            >
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
  selectedCount: number;
  totalCount: number;
  sendChanges: (changeType: SelectOrClearChangeType) => void;
};

const SelectOrClear = ({
  selectedCount,
  totalCount,
  sendChanges,
}: SelectOrClearProps) => {
  const allSelected = selectedCount === totalCount;
  const indeterminate = selectedCount > 0 && selectedCount < totalCount;

  const dataState = allSelected
    ? true
    : indeterminate
    ? 'indeterminate'
    : false;

  const [checkedState, setCheckedState] = useState<CheckedState>(dataState);

  useEffect(() => {
    setCheckedState(dataState);
  }, [dataState]);

  const onCheckedChange = () => {
    const nextState = checkedState === 'indeterminate' ? false : !checkedState;
    sendChanges(nextState ? 'selectAll' : 'clear');
    setCheckedState(nextState);
  };

  return (
    <div className="flex justify-start items-center py-2 px-1">
      <Checkbox
        id="select-all"
        checked={checkedState}
        onCheckedChange={onCheckedChange}
      />
      <Label className="text-sm ml-2" onClick={onCheckedChange}>
        {allSelected || dataState === 'indeterminate'
          ? 'Clear all'
          : 'Select All'}
      </Label>
    </div>
  );
};

MultiSelectPieceProperty.displayName = 'MultiSelectPieceProperty';
export { MultiSelectPieceProperty };
