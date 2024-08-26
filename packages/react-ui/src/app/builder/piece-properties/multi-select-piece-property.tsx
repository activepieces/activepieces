import deepEqual from 'deep-equal';
import { t } from 'i18next';
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
import { CommandEmpty } from '@/components/ui/command';
import { cn } from '@/lib/utils';

type MultiSelectPiecePropertyProps = {
  placeholder: string;
  options: {
    value: unknown;
    label: string;
  }[];
  onChange: (value: unknown[]) => void;
  initialValues?: unknown[];
  disabled?: boolean;
  showDeselect?: boolean;
};

const MultiSelectPieceProperty = ({
  placeholder,
  options,
  onChange,
  disabled,
  initialValues,
  showDeselect,
}: MultiSelectPiecePropertyProps) => {
  const [originalOptionsWithIndexes] = useState(
    options.map((option, index) => ({
      ...option,
      originalIndex: index,
    })),
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(
    originalOptionsWithIndexes,
  );
  useEffect(() => {
    setFilteredOptions(
      originalOptionsWithIndexes.filter((option) => {
        return option.label.toLowerCase().includes(searchTerm.toLowerCase());
      }),
    );
  }, [searchTerm, originalOptionsWithIndexes]);
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
      onSearch={(searchTerm) => setSearchTerm(searchTerm ?? '')}
    >
      <MultiSelectTrigger
        className={cn('w-full', { 'cursor-pointer': !disabled })}
        showDeselect={showDeselect && !disabled}
        onDeselect={() => onChange([])}
      >
        <MultiSelectValue placeholder={placeholder} />
      </MultiSelectTrigger>
      <MultiSelectContent>
        <MultiSelectSearch placeholder={placeholder} />
        <MultiSelectList>
          {filteredOptions.map((opt) => (
            <MultiSelectItem
              key={opt.originalIndex}
              value={String(opt.originalIndex)}
            >
              {opt.label}
            </MultiSelectItem>
          ))}
          {filteredOptions.length === 0 && (
            <CommandEmpty>{t('No results found.')}</CommandEmpty>
          )}
        </MultiSelectList>
      </MultiSelectContent>
    </MultiSelect>
  );
};

MultiSelectPieceProperty.displayName = 'MultiSelectPieceProperty';
export { MultiSelectPieceProperty };
