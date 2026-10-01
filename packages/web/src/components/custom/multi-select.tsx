'use client';

// Used form here https://github.com/shadcn-ui/ui/pull/2773/files
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { t } from 'i18next'; // Use t function from react-i18next
import { Check, ChevronsUpDown, RefreshCcw, X } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import React, { ComponentPropsWithoutRef } from 'react';
import { createPortal } from 'react-dom';

import { SelectUtilButton } from '@/components/custom/select-util-button';
import { cn } from '@/lib/utils';

import { Badge } from '../ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '../ui/command';
import { ScrollArea } from '../ui/scroll-area';
import { Spinner } from '../ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

export interface MultiSelectOptionItem {
  value: unknown;
  label?: React.ReactNode;
}

interface MultiSelectContextValue {
  value: string[];

  open: boolean;

  onSelect(value: string, item: MultiSelectOptionItem): void;

  onDeselect(value: string, item: MultiSelectOptionItem): void;

  onSearch?(keyword: string | undefined): void;

  filter?: boolean | ((keyword: string, current: string) => boolean);

  disabled?: boolean;

  maxCount?: number;

  items: MultiSelectOptionItem[];
}

const MultiSelectContext = React.createContext<
  MultiSelectContextValue | undefined
>(undefined);

const useMultiSelect = () => {
  const context = React.useContext(MultiSelectContext);

  if (!context) {
    throw new Error(
      t('useMultiSelect must be used within MultiSelectProvider'),
    );
  }

  return context;
};

type MultiSelectProps = React.ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Root
> & {
  value?: string[];
  onValueChange?(value: string[], items: MultiSelectOptionItem[]): void;
  onSelect?(value: string, item: MultiSelectOptionItem): void;
  onDeselect?(value: string, item: MultiSelectOptionItem): void;
  defaultValue?: string[];
  onSearch?(keyword: string | undefined): void;
  filter?: boolean | ((keyword: string, current: string) => boolean);
  disabled?: boolean;
  maxCount?: number;
  items?: MultiSelectOptionItem[];
};

const MultiSelect: React.FC<MultiSelectProps> = ({
  value: valueProp,
  onValueChange: onValueChangeProp,
  onDeselect: onDeselectProp,
  onSelect: onSelectProp,
  defaultValue,
  open: openProp,
  onOpenChange,
  defaultOpen,
  onSearch,
  filter,
  disabled,
  maxCount,
  items = [],
  ...popoverProps
}) => {
  const handleValueChange = React.useCallback(
    (state: string[]) => {
      if (onValueChangeProp) {
        const resolved = state.map(
          (v) => items.find((item) => String(item.value) === v) ?? { value: v },
        );

        onValueChangeProp(state, resolved);
      }
    },
    [onValueChangeProp, items],
  );

  const [value, setValue] = useControllableState({
    prop: valueProp,
    defaultProp: defaultValue ?? [],
    onChange: handleValueChange,
  });

  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen ?? false,
    onChange: onOpenChange,
  });

  const handleSelect = React.useCallback(
    (value: string, item: MultiSelectOptionItem) => {
      setValue((prev: string[]) => {
        if (prev?.includes(value)) {
          return prev;
        }

        onSelectProp?.(value, item);

        return prev ? [...prev, value] : [value];
      });
    },
    [onSelectProp, setValue],
  );

  const handleDeselect = React.useCallback(
    (value: string, item: MultiSelectOptionItem) => {
      setValue((prev: string[]) => {
        if (!prev || !prev.includes(value)) {
          return prev;
        }

        onDeselectProp?.(value, item);

        return prev.filter((v) => v !== value);
      });
    },
    [onDeselectProp, setValue],
  );

  const contextValue = React.useMemo(() => {
    return {
      value: value || [],
      open: open || false,
      onSearch,
      filter,
      disabled,
      maxCount,
      onSelect: handleSelect,
      onDeselect: handleDeselect,
      items,
    };
  }, [
    value,
    open,
    onSearch,
    filter,
    disabled,
    maxCount,
    handleSelect,
    handleDeselect,
    items,
  ]);

  return (
    <MultiSelectContext.Provider value={contextValue}>
      <PopoverPrimitive.Root
        {...popoverProps}
        open={open}
        onOpenChange={setOpen}
      />
    </MultiSelectContext.Provider>
  );
};

MultiSelect.displayName = 'MultiSelect';

type MultiSelectTriggerElement = HTMLButtonElement;

type MultiSelectTriggerProps = ComponentPropsWithoutRef<'button'> & {
  showDeselect?: boolean;
  onDeselect?: () => void;
  showRefresh?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
};

const PreventClick = (e: React.MouseEvent | React.TouchEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

const MultiSelectTrigger = React.forwardRef<
  MultiSelectTriggerElement,
  MultiSelectTriggerProps
>(
  (
    {
      className,
      children,
      showDeselect,
      onDeselect,
      showRefresh,
      onRefresh,
      loading,
      ...props
    },
    forwardedRef,
  ) => {
    const { disabled } = useMultiSelect();

    return (
      <PopoverPrimitive.Trigger ref={forwardedRef as any} asChild>
        <button
          aria-disabled={disabled}
          disabled={disabled || loading}
          aria-busy={loading || undefined}
          role="combobox"
          type="button"
          className={cn(
            'flex min-h-9 w-full items-center justify-between gap-2 rounded-lg border border-gray-7 bg-transparent py-1.5 pr-2.5 pl-3 text-left text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-accent-8 focus-visible:ring-3 focus-visible:ring-accent-8/50 aria-invalid:border-danger-9 [&>span]:line-clamp-1 [&_svg]:shrink-0',
            {
              'cursor-not-allowed opacity-50': disabled,
              'cursor-pointer': !disabled,
            },
            className,
          )}
          onClick={disabled ? PreventClick : props.onClick}
          onTouchStart={disabled ? PreventClick : props.onTouchStart}
        >
          {loading ? <Spinner className="text-gray-11" /> : children}
          <div className="flex items-center gap-2">
            {showDeselect && (
              <SelectUtilButton
                tooltipText={t('Unset')}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeselect?.();
                }}
                Icon={X}
              ></SelectUtilButton>
            )}
            {showRefresh && (
              <SelectUtilButton
                tooltipText={t('Refresh')}
                onClick={onRefresh}
                Icon={RefreshCcw}
              ></SelectUtilButton>
            )}
            <ChevronsUpDown aria-hidden className="size-4 text-gray-11" />
          </div>
        </button>
      </PopoverPrimitive.Trigger>
    );
  },
);

MultiSelectTrigger.displayName = 'MultiSelectTrigger';

interface MultiSelectValueProps extends ComponentPropsWithoutRef<'div'> {
  placeholder?: string;
  maxDisplay?: number;
  maxItemLength?: number;
}

const MultiSelectValue = React.forwardRef<
  HTMLDivElement,
  MultiSelectValueProps
>(
  (
    { className, placeholder, maxDisplay, maxItemLength, ...props },
    forwardRef,
  ) => {
    const { value, items, onDeselect, disabled } = useMultiSelect();

    const remainingPiecesCount =
      maxDisplay && value.length > maxDisplay ? value.length - maxDisplay : 0;
    const renderItems = remainingPiecesCount
      ? value.slice(0, maxDisplay)
      : value;

    if (!value.length) {
      return (
        <span className="pointer-events-none text-gray-11 opacity-80">
          {placeholder}
        </span>
      );
    }

    return (
      <TooltipProvider delayDuration={300}>
        <div
          className={cn(
            'flex flex-1 overflow-x-hidden flex-wrap items-center gap-1.5',
            className,
          )}
          {...props}
          ref={forwardRef}
        >
          {renderItems.map((value) => {
            const item = items.find((i) => String(i.value) === value);
            const content = item?.label || value;
            const child =
              maxItemLength &&
              typeof content === 'string' &&
              content.length > maxItemLength
                ? `${content.slice(0, maxItemLength)}...`
                : content;

            const el = (
              <Badge
                variant="outline"
                key={value}
                className={cn('group/multi-select-badge', {
                  'cursor-pointer': !disabled,
                  'cursor-not-allowed opacity-80': disabled,
                })}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeselect(value, item!);
                }}
              >
                <span>{child}</span>
                {!disabled && (
                  <X className="text-gray-11 group-hover/multi-select-badge:text-gray-12" />
                )}
              </Badge>
            );

            if (child !== content) {
              return (
                <Tooltip key={value}>
                  <TooltipTrigger className="inline-flex">{el}</TooltipTrigger>
                  <TooltipContent side="bottom" align="start" className="z-51">
                    {content}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return el;
          })}
          {remainingPiecesCount ? (
            <span className="text-xs text-gray-11">
              {t('+{remainingPiecesCount} more', {
                remainingPiecesCount: remainingPiecesCount,
              })}
            </span>
          ) : null}
        </div>
      </TooltipProvider>
    );
  },
);
MultiSelectValue.displayName = 'MultiSelectValue';

const MultiSelectSearch = React.forwardRef<
  React.ElementRef<typeof CommandInput>,
  ComponentPropsWithoutRef<typeof CommandInput>
>((props, ref) => {
  const { onSearch } = useMultiSelect();

  return <CommandInput ref={ref} {...props} onValueChange={onSearch} />;
});

MultiSelectSearch.displayName = 'MultiSelectSearch';

const MultiSelectList = React.forwardRef<
  React.ElementRef<typeof CommandList>,
  ComponentPropsWithoutRef<typeof CommandList>
>(({ className, ...props }, ref) => {
  return (
    <CommandList ref={ref} className={cn('p-0', className)} {...props}>
      <ScrollArea viewPortClassName="max-h-[200px]">
        {props.children}
      </ScrollArea>
    </CommandList>
  );
});

MultiSelectList.displayName = 'MultiSelectList';

type MultiSelectContentProps = ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Content
>;

const MultiSelectContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  MultiSelectContentProps
>(({ className, children, ...props }, ref) => {
  const context = useMultiSelect();

  const fragmentRef = React.useRef<DocumentFragment>(null);

  if (!fragmentRef.current && typeof window !== 'undefined') {
    fragmentRef.current = document.createDocumentFragment();
  }

  if (!context.open) {
    return fragmentRef.current
      ? createPortal(<Command>{children}</Command>, fragmentRef.current)
      : null;
  }

  return (
    <PopoverPrimitive.Portal forceMount>
      <PopoverPrimitive.Content
        ref={ref}
        align="start"
        sideOffset={4}
        collisionPadding={10}
        className={cn(
          'z-50 overflow-hidden rounded-2xl bg-panel p-0 text-gray-12 shadow-over outline-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        )}
        style={
          {
            '--radix-select-content-transform-origin':
              'var(--radix-popper-transform-origin)',
            '--radix-select-content-available-width':
              'var(--radix-popper-available-width)',
            '--radix-select-content-available-height':
              'var(--radix-popper-available-height)',
            '--radix-select-trigger-width': 'var(--radix-popper-anchor-width)',
            '--radix-select-trigger-height':
              'var(--radix-popper-anchor-height)',
            width: 'var(--radix-popper-anchor-width)',
          } as any
        }
        {...props}
      >
        <Command
          className={cn('max-h-96 w-full', className)}
          shouldFilter={!context.onSearch}
        >
          {children}
        </Command>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
});
MultiSelectContent.displayName = 'MultiSelectContent';

type MultiSelectItemProps = ComponentPropsWithoutRef<typeof CommandItem> &
  Partial<MultiSelectOptionItem> & {
    onSelect?: (value: string, item: MultiSelectOptionItem) => void;
    onDeselect?: (value: string, item: MultiSelectOptionItem) => void;
  };

const MultiSelectItem = React.forwardRef<
  React.ElementRef<typeof CommandItem>,
  MultiSelectItemProps
>(
  (
    {
      value,
      onSelect: onSelectProp,
      onDeselect: onDeselectProp,
      children,
      label,
      disabled: disabledProp,
      className,
      ...props
    },
    forwardedRef,
  ) => {
    const {
      value: contextValue,
      maxCount,
      onSelect,
      onDeselect,
    } = useMultiSelect();

    const item = React.useMemo(() => {
      return value
        ? {
            value,
            label:
              label || (typeof children === 'string' ? children : undefined),
          }
        : undefined;
    }, [value, label, children]);

    const selected = Boolean(value && contextValue.includes(value));

    const disabled = Boolean(
      disabledProp ||
        (!selected && maxCount && contextValue.length >= maxCount),
    );

    const handleClick = () => {
      if (selected) {
        onDeselectProp?.(value!, item!);
        onDeselect(value!, item!);
      } else {
        onSelectProp?.(value!, item!);
        onSelect(value!, item!);
      }
    };

    return (
      <CommandItem
        {...props}
        value={value}
        className={cn(
          'cursor-pointer',
          disabled && 'text-gray-11 cursor-not-allowed',
          className,
        )}
        disabled={disabled}
        onSelect={!disabled && value ? handleClick : undefined}
        ref={forwardedRef}
      >
        <div className="flex items-center justify-between w-full min-w-0">
          <span className="truncate min-w-0 grow">
            {children || label || value}
          </span>
          {selected ? <Check /> : null}
        </div>
      </CommandItem>
    );
  },
);
MultiSelectItem.displayName = 'MultiSelectItem';

const MultiSelectGroup = React.forwardRef<
  React.ElementRef<typeof CommandGroup>,
  ComponentPropsWithoutRef<typeof CommandGroup>
>((props, forwardRef) => {
  return <CommandGroup {...props} ref={forwardRef} />;
});

MultiSelectGroup.displayName = 'MultiSelectGroup';

const MultiSelectSeparator = React.forwardRef<
  React.ElementRef<typeof CommandSeparator>,
  ComponentPropsWithoutRef<typeof CommandSeparator>
>((props, forwardRef) => {
  return <CommandSeparator {...props} ref={forwardRef} />;
});

MultiSelectSeparator.displayName = 'MultiSelectSeparator';

const MultiSelectEmpty = React.forwardRef<
  React.ElementRef<typeof CommandEmpty>,
  ComponentPropsWithoutRef<typeof CommandEmpty>
>(({ children = 'No Content', ...props }, forwardRef) => {
  return (
    <CommandEmpty {...props} ref={forwardRef}>
      {children}
    </CommandEmpty>
  );
});

MultiSelectEmpty.displayName = 'MultiSelectEmpty';

export {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectValue,
  MultiSelectSearch,
  MultiSelectContent,
  MultiSelectList,
  MultiSelectItem,
  MultiSelectGroup,
  MultiSelectSeparator,
  MultiSelectEmpty,
};
