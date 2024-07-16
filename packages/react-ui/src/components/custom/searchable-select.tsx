import { Search } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { cn } from '@/lib/utils';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

type SelectOption<T> = {
  value: T;
  label: string;
};

type SearchableSelectProps<T> = {
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  value: T;
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
    const [selectedIndex, setSelectedIndex] = useState(-1);

    useEffect(() => {
      setSelectedIndex(options.findIndex((option) => option.value === value));
    }, [value, options]);

    useEffect(() => {
      if (searchTerm.length === 0) {
        setFilteredOptions(options.map((_, index) => index));
      } else {
        const filteredOptions = options.filter((option) => {
          return option.label.toLowerCase().includes(searchTerm.toLowerCase());
        });
        setFilteredOptions(filteredOptions.map((_, index) => index));
      }
    }, [searchTerm, options]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    };

    const onSelect = (index: string) => {
      const optionIndex = parseInt(index);
      const option = options[optionIndex];
      onChange(option.value);
      setSelectedIndex(optionIndex);
    };

    return (
      <Select
        disabled={disabled}
        value={selectedIndex == -1 ? undefined : String(selectedIndex)}
        onValueChange={onSelect}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="w-full">
          <div
            className="flex items-center border-b px-3 w-full"
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
              <SelectItem
                key={option.value}
                value={String(index)}
                className="w-full"
              >
                {option.label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  },
);
