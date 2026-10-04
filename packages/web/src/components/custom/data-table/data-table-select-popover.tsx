import { t } from 'i18next';
import { Check, ListFilterIcon } from 'lucide-react';
import { useState } from 'react';

import { LogoPlate } from '@/components/custom/logo-plate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type DataTableSelectPopoverProps = {
  title?: string;
  selectedValues: Set<string>;
  options: readonly {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }> | string;
  }[];
  facets?: Map<any, number>;
  handleFilterChange: (filterValue: string[]) => void;
  single?: boolean;
};

const DataTableSelectPopover = ({
  title,
  selectedValues,
  options,
  handleFilterChange,
  facets,
  single = false,
}: DataTableSelectPopoverProps) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="border-dashed">
          <ListFilterIcon />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Badge variant="secondary" className="lg:hidden">
                {selectedValues.size}
              </Badge>
              <div className="hidden gap-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge variant="secondary">
                    {t('{count} selected', { count: selectedValues.size })}
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge variant="secondary" key={option.value}>
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="min-w-[200px] max-w-[250px] break-all p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>{t('No results found.')}</CommandEmpty>

            <CommandGroup>
              <ScrollArea viewPortClassName="max-h-[200px]">
                {options.map((option, index) => {
                  const isSelected = selectedValues.has(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => {
                        if (single) {
                          handleFilterChange(isSelected ? [] : [option.value]);
                          setOpen(false);
                          return;
                        }
                        if (isSelected) {
                          selectedValues.delete(option.value);
                        } else {
                          selectedValues.add(option.value);
                        }
                        const filterValues = Array.from(selectedValues);
                        handleFilterChange(filterValues);
                      }}
                    >
                      {single ? (
                        <Check
                          className={cn('size-4', !isSelected && 'invisible')}
                        />
                      ) : (
                        <Checkbox
                          checked={isSelected}
                          tabIndex={-1}
                          className="pointer-events-none"
                        />
                      )}
                      {typeof option.icon === 'string' ? (
                        <LogoPlate
                          src={option.icon}
                          alt={option.label}
                          size="xxs"
                        />
                      ) : (
                        option.icon && (
                          <option.icon className="size-4 text-gray-11" />
                        )
                      )}
                      <div>
                        <span>{option.label}</span>
                        <span className="hidden">{index}</span>
                      </div>
                      {facets?.get(option.value) && (
                        <span className="ml-auto text-xs text-gray-11 tabular-nums">
                          {facets.get(option.value)}
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </ScrollArea>
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      handleFilterChange([]);
                      setOpen(false);
                    }}
                    className="justify-center text-center"
                  >
                    {single ? t('Clear filter') : t('Clear filters')}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export { DataTableSelectPopover };
