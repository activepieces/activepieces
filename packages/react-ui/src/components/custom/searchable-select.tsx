import { Search } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

import { cn } from '@/lib/utils';

type SelectOption<T> = {
  value: T;
  label: string;
};

type SearchableSelectProps<T> = {
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  value: T | undefined;
  placeholder: string;
  disabled?: boolean;
};

export const SearchableSelect = React.memo(
  <T extends React.Key>({
    options,
    onChange,
    value,
    placeholder,
    disabled,
  }: SearchableSelectProps<T>) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOptionsIndices, setFilteredOptions] = useState<number[]>([]);

    const [selectedIndex, setSelectedIndex] = useState(
      options.findIndex((option) => option.value === value) ?? -1,
    );

    useEffect(() => {
      if (searchTerm.length === 0) {
        setFilteredOptions(options.map((_, index) => index));
      } else {
        const filteredOptions = options
          .map((option, index) => {
            return {
              label: option.label,
              value: option.value,
              index: index,
            };
          })
          .filter((option) => {
            return option.label
              .toLowerCase()
              .includes(searchTerm.toLowerCase());
          });
        setFilteredOptions(filteredOptions.map((op) => op.index));
      }
    }, [searchTerm, options]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      e.preventDefault();
    };

    const onSelect = (index: string) => {
      const optionIndex =
        Number.isInteger(parseInt(index)) && !Number.isNaN(parseInt(index))
          ? parseInt(index)
          : -1;
      setSelectedIndex(optionIndex);
      setSearchTerm('');

      if (optionIndex === -1) {
        return;
      }
      const option = options[optionIndex];
      onChange(option.value);
    };

    return (
      <Select
        disabled={disabled}
        autoComplete={undefined}
        value={selectedIndex === -1 ? undefined : String(selectedIndex)}
        onValueChange={onSelect}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="w-full">
          <div
            className="flex items-center border-b px-3 w-full"
            /* eslint-disable-next-line react/no-unknown-property */
            cmdk-input-wrapper=""
          >
            <Search className="mr-2 size-4 shrink-0 opacity-50" />
            <input
              placeholder={placeholder}
              value={searchTerm}
              onChange={handleSearch}
              className={cn(
                'flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground',
                { 'cursor-not-allowed opacity-50': disabled },
              )}
            />
          </div>
          {filterOptionsIndices.map((index) => {
            const option = options[index];
            return (
              <SelectItem key={index} value={String(index)} className="w-full">
                {option.label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  },
);

SearchableSelect.displayName = 'SearchableSelect';
