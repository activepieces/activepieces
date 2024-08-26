import deepEqual from 'deep-equal';
import { t } from 'i18next';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

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
  description?: string;
};

type SearchableSelectProps<T> = {
  options: SelectOption<T>[];
  onChange: (value: T | null) => void;
  value: T | undefined;
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  showDeselect?: boolean;
};

export const SearchableSelect = <T extends React.Key>({
  options,
  onChange,
  value,
  placeholder,
  disabled,
  loading,
  showDeselect,
}: SearchableSelectProps<T>) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [filterOptionsIndices, setFilteredOptions] = useState<number[]>([]);
  const triggerWidth = `${triggerRef.current?.clientWidth ?? 0}px`;
  const [selectedIndex, setSelectedIndex] = useState(
    options.findIndex((option) => deepEqual(option.value, value)) ?? -1,
  );

  useEffect(() => {
    setSelectedIndex(
      options.findIndex((option) => deepEqual(option.value, value)) ?? -1,
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
            description: option.description ?? '',
          };
        })
        .filter((option) => {
          return (
            option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.description.toLowerCase().includes(searchTerm.toLowerCase())
          );
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
    <Popover modal={true} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Button
            ref={triggerRef}
            variant="outline"
            disabled={disabled}
            role="combobox"
            loading={loading}
            aria-expanded={open}
            className="w-full justify-between w-full"
          >
            <span className="flex text-ellipsis w-full overflow-hidden whitespace-nowrap">
              {!isNil(value)
                ? options.find((option) => option.value === value)?.label
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
          {showDeselect && !disabled && value && (
            <Button
              variant="outline"
              role="deselect"
              size="icon"
              className="absolute z-50 h-6 w-6 rounded-xs opacity-50 right-10 top-2"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        style={{
          maxWidth: triggerWidth,
          minWidth: triggerWidth,
        }}
        className="min-w-full w-full p-0"
      >
        <Command className="w-full" shouldFilter={false}>
          <CommandInput
            placeholder={t(placeholder)}
            value={searchTerm}
            onValueChange={(e) => {
              setSearchTerm(e);
            }}
          />
          {filterOptionsIndices.length === 0 && (
            <CommandEmpty>{t('No results found.')}</CommandEmpty>
          )}

          <CommandGroup>
            <CommandList>
              <ScrollArea
                className="h-full"
                viewPortClassName={'max-h-[200px]'}
              >
                {filterOptionsIndices &&
                  filterOptionsIndices.map((filterIndex) => {
                    const option = options[filterIndex];
                    if (!option) {
                      return <></>;
                    }
                    return (
                      <CommandItem
                        key={filterIndex}
                        value={String(filterIndex)}
                        onSelect={(currentValue) => {
                          setOpen(false);
                          onSelect(currentValue);
                        }}
                        className="flex gap-2 flex-col items-start"
                      >
                        <div className="flex gap-2 items-center">
                          <Check
                            className={cn('flex-shrink-0 w-4 h-4', {
                              hidden: selectedIndex !== filterIndex,
                            })}
                          />
                          {option.label}
                        </div>
                        {option.description && (
                          <div className="text-sm text-muted-foreground">
                            {option.description}
                          </div>
                        )}
                      </CommandItem>
                    );
                  })}
              </ScrollArea>
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

SearchableSelect.displayName = 'SearchableSelect';
