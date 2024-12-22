import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { t } from "i18next";
import { ScrollArea } from "./scroll-area";


type Props<T extends string> = {
  selectedValue: T;
  onSelectedValueChange: (value: T) => void;
  items: { value: T; label: string }[];
  children: React.ReactNode;
  className?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
};

export function AutoComplete<T extends string>({
  selectedValue,
  onSelectedValueChange,
  items,
  children,
  className,
  open,
  setOpen
}: Props<T>) {

  const onSelectItem = (inputValue: string) => {
    onSelectedValueChange(inputValue as T);
    setOpen(false);
  };


  return (
    <div className="flex items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <Command shouldFilter={false} className={className}>
        <PopoverTrigger asChild >
        {children}

        </PopoverTrigger>
      
          {!open && <CommandList aria-hidden="true" className="hidden" />}
          <PopoverContent
            asChild
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              if (
                e.target instanceof Element &&
                e.target.hasAttribute("cmdk-input")
              ) {
                e.preventDefault();
              }
            }}
            className="w-[--radix-popover-trigger-width] p-0"
          >
            <CommandList>
             <ScrollArea className="h-[200px] overflow-y-auto">
             {items.length > 0 ? (
                <CommandGroup>
                  {items.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onMouseDown={(e) => e.preventDefault()}
                      onSelect={onSelectItem} 
                      tabIndex={0}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          selectedValue === option.value
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : 
              <CommandEmpty>{t('No items')}</CommandEmpty>}
             
             </ScrollArea>
            
            </CommandList>
          </PopoverContent>
        </Command>
      </Popover>
    </div>
  );
}