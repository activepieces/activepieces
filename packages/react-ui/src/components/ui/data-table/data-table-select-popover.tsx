import { CheckIcon, ListFilterIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Badge } from '../badge';
import { Button } from '../button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '../command';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { ScrollArea } from '../scroll-area';
import { Separator } from '../separator';

type DataTableSelectPopoverProps = {
  title?: string;
  selectedValues: Set<string>;
  options: readonly {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  facets?: Map<any, number>;
  handleFilterChange: (filterValue: string[]) => void;
};

const DataTableSelectPopover = ({
  title,
  selectedValues,
  options,
  handleFilterChange,
  facets,
}: DataTableSelectPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <ListFilterIcon className="mr-2 size-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup>
              <ScrollArea viewPortClassName="max-h-[200px]">
                {options.map((option, index) => {
                  const isSelected = selectedValues.has(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => {
                        if (isSelected) {
                          selectedValues.delete(option.value);
                        } else {
                          selectedValues.add(option.value);
                        }
                        const filterValues = Array.from(selectedValues);
                        handleFilterChange(filterValues);
                      }}
                    >
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded border border-primary',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible',
                        )}
                      >
                        <CheckIcon className={cn('h-4 w-4')} />
                      </div>
                      {option.icon && (
                        <option.icon className="mr-2 size-4 text-muted-foreground" />
                      )}
                      <div>
                        <span>{option.label}</span>
                        <span className="hidden">{index}</span>
                      </div>
                      {facets?.get(option.value) && (
                        <span className="ml-auto flex size-4 items-center justify-center font-mono text-xs">
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
                    onSelect={() => handleFilterChange([])}
                    className="justify-center text-center"
                  >
                    Clear filters
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
