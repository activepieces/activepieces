import deepEqual from 'deep-equal';
import { t } from 'i18next';
import { Check, ChevronsUpDown, RefreshCcw, X } from 'lucide-react';
import React, { useState, useRef } from 'react';

import { SelectUtilButton } from '@/components/custom/select-util-button';
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
  onRefresh?: () => void;
  showRefresh?: boolean;
  onClose?: () => void;
  triggerClassName?: string;
  valuesRendering?: (value: unknown) => React.ReactNode;
  openState?: {
    open: boolean;
    setOpen: (open: boolean) => void;
  };
  refreshOnSearch?: (searchValue: string) => void;
  /**Use to show the selected option when search doesn't return the selected option */
  cachedOptions?: {
    value: T;
    label: string;
  }[];
};

const useOpenState = (openStateInitializer?: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  if (openStateInitializer) {
    return openStateInitializer;
  }
  return {
    open: isOpen,
    setOpen: setIsOpen,
  };
};
export const SearchableSelect = <T,>({
  options,
  onChange,
  value,
  placeholder,
  disabled,
  loading,
  showDeselect,
  onRefresh,
  showRefresh,
  onClose,
  triggerClassName,
  valuesRendering,
  openState: openStateInitializer,
  refreshOnSearch,
  cachedOptions = [],
}: SearchableSelectProps<T>) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { open, setOpen } = useOpenState(openStateInitializer);
  const triggerWidth = `${triggerRef.current?.clientWidth ?? 0}px`;
  const selectedOption =
    [...cachedOptions, ...options].find((option) =>
      deepEqual(option.value, value),
    ) ?? undefined;
  const filterOptionsIndices = options
    .map((option, index) => {
      return {
        label: option.label,
        value: option.value,
        index: index,
        description: option.description ?? '',
      };
    })
    .filter((option) => {
      if (refreshOnSearch || searchTerm.length === 0) {
        return true;
      }
      return (
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .map((option) => option.index);

  const onSelect = (index: string) => {
    const optionIndex =
      Number.isInteger(parseInt(index)) && !Number.isNaN(parseInt(index))
        ? parseInt(index)
        : -1;
    setSearchTerm('');

    if (optionIndex === -1) {
      return;
    }
    const option = options[optionIndex];
    onChange(option.value);
  };
  return (
    <Popover
      modal={true}
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          onClose?.();
        }
        if (refreshOnSearch && searchTerm.length > 0) {
          refreshOnSearch('');
          setSearchTerm('');
        }
        setOpen(open);
      }}
    >
      <PopoverTrigger
        asChild
        className={cn({
          'cursor-not-allowed opacity-80 ': disabled,
        })}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
          }
          e.stopPropagation();
        }}
      >
        <div className="relative">
          <Button
            ref={triggerRef}
            variant="outline"
            disabled={disabled}
            role="combobox"
            loading={loading}
            aria-expanded={open}
            className={cn('w-full justify-between', triggerClassName)}
            onClick={(e) => {
              setOpen(!open);
              e.preventDefault();
            }}
          >
            <span className="flex w-full truncate select-none">
              {selectedOption
                ? valuesRendering
                  ? valuesRendering(selectedOption.value)
                  : selectedOption.label
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
          <div className="right-10 top-2 absolute flex gap-2  z-50 items-center">
            {showDeselect && !disabled && selectedOption && !loading && (
              <SelectUtilButton
                tooltipText={t('Unset')}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onChange(null);
                }}
                Icon={X}
              ></SelectUtilButton>
            )}
            {showRefresh && !loading && (
              <SelectUtilButton
                tooltipText={t('Refresh')}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (onRefresh) {
                    onRefresh();
                  }
                }}
                Icon={RefreshCcw}
              ></SelectUtilButton>
            )}
          </div>
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
              if (refreshOnSearch) {
                refreshOnSearch(e);
              }
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
                  !loading &&
                  filterOptionsIndices.map((filterIndex) => {
                    const option = options[filterIndex];
                    if (!option) {
                      return null;
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
                        <div className="flex gap-2 items-center justify-between w-full">
                          {option.label === '' ? (
                            <span className="">&nbsp;</span>
                          ) : valuesRendering ? (
                            valuesRendering(option.value)
                          ) : (
                            option.label
                          )}
                          <Check
                            className={cn('flex-shrink-0 w-4 h-4', {
                              hidden: selectedOption?.value !== option.value,
                            })}
                          />
                        </div>
                        {option.description && (
                          <div className="text-sm text-muted-foreground">
                            {option.description}
                          </div>
                        )}
                      </CommandItem>
                    );
                  })}
                {loading && (
                  <CommandItem disabled>{t('Loading...')}</CommandItem>
                )}
              </ScrollArea>
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

SearchableSelect.displayName = 'SearchableSelect';
