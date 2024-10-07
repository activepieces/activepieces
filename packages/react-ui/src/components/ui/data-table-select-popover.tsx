import { PlusCircledIcon } from '@radix-ui/react-icons';
import { CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Badge } from './badge';
import { Button } from './button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { ScrollArea } from './scroll-area';
import { Separator } from './seperator';
import React from 'react';
import { t } from 'i18next';



type DataTableSelectPopoverProps = {
  title?: string;
  options: readonly {
    label: string;
    value: string;
    icon?: React.ComponentType<{
      className?: string;
    }>;
  }[];
  handleFilterChange: (filterValue: string[]) => void;
  initialValues: string[];
};

const DataTableSelectPopover = ({
  title,
  options,
  handleFilterChange,
  initialValues
}: DataTableSelectPopoverProps) => {
  const selectedValues = React.useRef<Set<string>>(new Set(initialValues));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircledIcon className="mr-2 size-4" />
          {title}
          {selectedValues.current?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.current.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.current.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.current.size} {t('selected')}
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.current.has(option.value))
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
            <CommandEmpty>{t('No results found.')}</CommandEmpty>

            <CommandGroup>
              <ScrollArea viewPortClassName="max-h-[200px]">
                {options.map((option, index) => {
                  const isSelected = selectedValues.current.has(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => {
                        if (isSelected) {
                          selectedValues.current.delete(option.value);
                        } else {
                          selectedValues.current.add(option.value);
                        }
                        const filterValues = Array.from(selectedValues.current);
                        
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
                    </CommandItem>
                  );
                })}
              </ScrollArea>
            </CommandGroup>
            {selectedValues.current.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {handleFilterChange([]); selectedValues.current= new Set([])}}
                    className="justify-center text-center"
                  >
                   {
                    t('Clear filters')
                   }
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
