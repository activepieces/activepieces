import { Check, ChevronsUpDown } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { isNil } from '@activepieces/shared';

import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';

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
  loading?: boolean;
};

export const SearchableSelect = <T extends React.Key>({
  options,
  onChange,
  value,
  placeholder,
  disabled,
  loading,
}: SearchableSelectProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [filterOptionsIndices, setFilteredOptions] = useState<number[]>([]);

  const [selectedIndex, setSelectedIndex] = useState(
    options.findIndex((option) => option.value === value) ?? -1,
  );

  useEffect(() => {
    setSelectedIndex(
      options.findIndex((option) => option.value === value) ?? -1,
    );
  }, [value, options]);

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
          return option.label.toLowerCase().includes(searchTerm.toLowerCase());
        });
      setFilteredOptions(filteredOptions.map((op) => op.index));
    }
  }, [searchTerm, options]);

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          role="combobox"
          loading={loading}
          aria-expanded={open}
          className="w-full justify-between w-full"
        >
          <span className="flex text-ellipsis w-full overflow-hidden whitespace-nowrap">
            {!isNil(value)
              ? options.find((framework) => framework.value === value)?.label
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-full w-full p-0">
        <Command className="w-full" shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={searchTerm}
            onValueChange={(e) => {
              setSearchTerm(e);
            }}
          />
          {filterOptionsIndices.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          <ScrollArea className="h-full" viewPortClassName={'max-h-[200px]'}>
            <CommandGroup>
              <CommandList className={'min-h-[12000px]'}>
                {filterOptionsIndices &&
                  filterOptionsIndices.map((filterIndex) => {
                    const option = options[filterIndex];
                    if (!option) {
                      return <></>;
                    }
                    return (
                      <CommandItem
                        key={option.label}
                        value={String(filterIndex)}
                        onSelect={(currentValue) => {
                          setOpen(false);
                          onSelect(currentValue);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedIndex === filterIndex
                              ? 'opacity-100'
                              : 'opacity-0',
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    );
                  })}
              </CommandList>
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

SearchableSelect.displayName = 'SearchableSelect';
