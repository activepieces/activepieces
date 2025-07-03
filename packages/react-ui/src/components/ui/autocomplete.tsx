import { t } from 'i18next';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { ScrollArea } from './scroll-area';

type Props<T extends string> = {
  selectedValue: T;
  onSelectedValueChange: (value: T) => void;
  items: { value: T; label: string }[];
  children: React.ReactNode;
  className?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  listRef?: React.RefObject<HTMLDivElement>;
};

export function AutoComplete<T extends string>({
  selectedValue,
  onSelectedValueChange,
  items,
  children,
  className,
  open,
  setOpen,
  listRef,
}: Props<T>) {
  const onSelectItem = (inputValue: string) => {
    onSelectedValueChange(inputValue as T);
    setOpen(false);
  };

  return (
    <div className="flex items-center">
      <Popover
        open={open}
        onOpenChange={(open) => {
          setOpen(open);
        }}
      >
        <PopoverTrigger asChild>{children}</PopoverTrigger>

        <PopoverContent
          asChild
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (
              e.target instanceof Element &&
              e.target.hasAttribute('cmdk-input')
            ) {
              e.preventDefault();
            }
          }}
          className="w-[--radix-popover-trigger-width] p-0"
        >
          <Command className={className} ref={listRef}>
            <CommandList className="bg-background">
              <ScrollArea
                className={cn('', {
                  'h-[12.5rem]': items.length >= 5,
                  'h-[2.5rem]': items.length === 1,
                  'h-[5rem]': items.length === 2,
                  'h-[7.5rem]': items.length === 3,
                  'h-[10rem]': items.length === 4,
                })}
              >
                {items.length > 0 ? (
                  <CommandGroup>
                    {items.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onMouseDown={(e) => e.preventDefault()}
                        onSelect={onSelectItem}
                      >
                        <Check
                          className={cn(
                            'h-4 w-4',
                            selectedValue === option.value
                              ? 'opacity-100'
                              : 'opacity-0',
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : (
                  <CommandEmpty>{t('No items')}</CommandEmpty>
                )}
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
