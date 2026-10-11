import { AIProviderModel } from '@activepieces/shared';
import { t } from 'i18next';
import { Brain, Check, Wrench } from 'lucide-react';
import { ReactNode, useDeferredValue, useMemo, useState } from 'react';

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
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { modelMeta } from './model-meta';

export function ModelPickerPopover<T>({
  groups,
  notices,
  emptyText,
  onPick,
  open,
  onOpenChange,
  align = 'end',
  anchorOnly = false,
  children,
}: ModelPickerPopoverProps<T>) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const needle = useDeferredValue(search.trim().toLowerCase());
  const visible = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          items:
            needle === ''
              ? group.items
              : group.items.filter((item) =>
                  item.searchText.toLowerCase().includes(needle),
                ),
        }))
        .filter((group) => group.items.length > 0),
    [groups, needle],
  );

  const pick = (item: ModelPickerItem<T>) => {
    onPick(item.value);
    onOpenChange(false);
  };

  return (
    <Popover
      modal
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setSearch('');
          setExpanded([]);
        }
        onOpenChange(next);
      }}
    >
      {anchorOnly ? (
        <PopoverAnchor asChild>{children}</PopoverAnchor>
      ) : (
        <PopoverTrigger asChild>{children}</PopoverTrigger>
      )}
      <PopoverContent align={align} className="w-[420px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t('Search models')}
            value={search}
            onValueChange={(value) => {
              setSearch(value);
              setExpanded([]);
            }}
          />
          {notices}
          <CommandList className="max-h-80 overflow-y-auto">
            <CommandEmpty>{emptyText}</CommandEmpty>
            {visible.map((group) => {
              const isExpanded = expanded.includes(group.id);
              const shown = isExpanded
                ? group.items
                : group.items.slice(0, GROUP_CAP);
              return (
                <CommandGroup
                  key={group.id}
                  heading={
                    <span className="flex items-center gap-2">
                      {group.heading}
                      <span className="ml-auto tabular-nums text-gray-10">
                        {group.items.length}
                      </span>
                    </span>
                  }
                  className="[&_[cmdk-group-heading]]:sticky [&_[cmdk-group-heading]]:top-0 [&_[cmdk-group-heading]]:z-10 [&_[cmdk-group-heading]]:bg-panel"
                >
                  {shown.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={`${group.id}:${item.id}`}
                      disabled={item.disabled}
                      aria-disabled={item.disabled}
                      onSelect={() => pick(item)}
                    >
                      <PickerRow item={item} />
                    </CommandItem>
                  ))}
                  {shown.length < group.items.length && (
                    <CommandItem
                      value={`${group.id}:show-all`}
                      onSelect={() =>
                        setExpanded((current) => [...current, group.id])
                      }
                      className="justify-center text-xs text-accent-11"
                    >
                      {t('Show all {count}', { count: group.items.length })}
                    </CommandItem>
                  )}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function PickerRow<T>({ item }: { item: ModelPickerItem<T> }) {
  const metadata = item.model?.metadata;
  const meta = [
    ...(metadata?.contextTokens === undefined
      ? []
      : [modelMeta.formatContext({ tokens: metadata.contextTokens })]),
    ...(metadata?.inputCostPerMillionTokens === undefined ||
    metadata.outputCostPerMillionTokens === undefined
      ? []
      : [
          `${modelMeta.formatPrice({
            perMillion: metadata.inputCostPerMillionTokens,
          })} / ${modelMeta.formatPrice({
            perMillion: metadata.outputCostPerMillionTokens,
          })}`,
        ]),
  ];
  return (
    <span className="flex w-full min-w-0 flex-col gap-0.5">
      <span className="flex w-full min-w-0 items-center gap-2">
        {item.leading}
        <span className="truncate text-sm" title={item.name}>
          {item.name}
        </span>
        {item.subtitle !== undefined && (
          <span className="truncate text-xs text-gray-11">{item.subtitle}</span>
        )}
        <span className="ml-auto flex shrink-0 items-center gap-2">
          {meta.length > 0 && (
            <span className="text-xs tabular-nums text-gray-11">
              {meta.join(' · ')}
            </span>
          )}
          {metadata?.supportsToolCalling === true && (
            <Wrench
              className="size-3.5 text-gray-10"
              aria-label={t('Supports tool calling')}
            >
              <title>{t('Supports tool calling')}</title>
            </Wrench>
          )}
          {metadata?.supportsReasoning === true && (
            <Brain
              className="size-3.5 text-gray-10"
              aria-label={t('Supports reasoning')}
            >
              <title>{t('Supports reasoning')}</title>
            </Brain>
          )}
          <Check
            className={cn(
              'size-4 text-gray-11',
              item.selected ? 'opacity-100' : 'opacity-0',
            )}
          />
        </span>
      </span>
      {item.note !== undefined && (
        <span className="pl-6 text-xs text-warning-11">{item.note}</span>
      )}
    </span>
  );
}

const GROUP_CAP = 30;

export type ModelPickerItem<T> = {
  id: string;
  value: T;
  name: string;
  searchText: string;
  subtitle?: string;
  leading?: ReactNode;
  model?: AIProviderModel;
  note?: string;
  disabled?: boolean;
  selected?: boolean;
};

export type ModelPickerGroup<T> = {
  id: string;
  heading: ReactNode;
  items: ModelPickerItem<T>[];
};

type ModelPickerPopoverProps<T> = {
  groups: ModelPickerGroup<T>[];
  notices?: ReactNode;
  emptyText: string;
  onPick: (value: T) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: 'start' | 'end';
  anchorOnly?: boolean;
  children: ReactNode;
};
