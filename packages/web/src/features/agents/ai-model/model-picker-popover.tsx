import { isNil } from '@activepieces/core-utils';
import { AIProviderModel } from '@activepieces/shared';
import { t } from 'i18next';
import { Brain, Check, ChevronDown, ChevronRight, Wrench } from 'lucide-react';
import {
  ReactNode,
  useDeferredValue,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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
  detail,
  children,
}: ModelPickerPopoverProps<T>) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [highlighted, setHighlighted] = useState('');
  const [activeItem, setActiveItem] = useState<ModelPickerItem<T> | null>(null);
  const [rowTop, setRowTop] = useState(0);
  const [detailTop, setDetailTop] = useState(0);
  const movedByKeyboard = useRef(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (!isNil(closeTimer.current)) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
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
  const sections = useMemo(() => sectionsOf({ groups: visible }), [visible]);
  const itemByValue = useMemo(
    () =>
      new Map(
        visible.flatMap((group) =>
          group.items.map((item) => [itemValue({ group, item }), item]),
        ),
      ),
    [visible],
  );

  const isOpen = (group: ModelPickerGroup<T>) =>
    group.collapsible !== true ||
    needle !== '' ||
    (toggled[group.id] ?? group.defaultOpen === true);

  const showDetail = ({
    item,
    row,
  }: {
    item: ModelPickerItem<T>;
    row: Element | null | undefined;
  }) => {
    setActiveItem(item);
    const frame = frameRef.current;
    if (isNil(frame) || isNil(row)) {
      return;
    }
    setRowTop(
      row.getBoundingClientRect().top - frame.getBoundingClientRect().top,
    );
  };

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const card = cardRef.current;
    if (isNil(frame) || isNil(card)) {
      return;
    }
    const frameTop = frame.getBoundingClientRect().top;
    const highest = VIEWPORT_MARGIN - frameTop;
    const lowest =
      window.innerHeight - VIEWPORT_MARGIN - frameTop - card.offsetHeight;
    setDetailTop(Math.max(highest, Math.min(rowTop, lowest)));
  }, [rowTop, activeItem]);

  const pick = (item: ModelPickerItem<T>) => {
    onPick(item.value);
    onOpenChange(false);
  };

  const renderItems = (group: ModelPickerGroup<T>) => {
    const isExpanded = expanded.includes(group.id);
    const shown = isExpanded ? group.items : group.items.slice(0, GROUP_CAP);
    return (
      <>
        {shown.map((item) => (
          <CommandItem
            key={item.id}
            value={itemValue({ group, item })}
            disabled={item.disabled}
            aria-disabled={item.disabled}
            onSelect={() => pick(item)}
            className="group"
          >
            <PickerRow item={item} indented={group.collapsible === true} />
          </CommandItem>
        ))}
        {shown.length < group.items.length && (
          <CommandItem
            value={`${group.id}:show-all`}
            onSelect={() => setExpanded((current) => [...current, group.id])}
            className="justify-center text-xs text-accent-11"
          >
            {t('Show all {count}', { count: group.items.length })}
          </CommandItem>
        )}
      </>
    );
  };

  const list = (
    <Command
      shouldFilter={false}
      value={highlighted}
      onValueChange={(value) => {
        setHighlighted(value);
        const item = itemByValue.get(value);
        if (item !== undefined && movedByKeyboard.current) {
          showDetail({
            item,
            row: Array.from(
              frameRef.current?.querySelectorAll('[cmdk-item]') ?? [],
            ).find((row) => row.getAttribute('data-value') === value),
          });
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          movedByKeyboard.current = true;
        }
      }}
    >
      <CommandInput
        placeholder={t('Search models')}
        value={search}
        onValueChange={(value) => {
          setSearch(value);
          setExpanded([]);
        }}
      />
      {notices}
      <CommandList
        className={cn(
          'overflow-y-auto',
          detail === undefined ? 'max-h-80' : 'max-h-96',
        )}
        onPointerMove={(event) => {
          const row =
            event.target instanceof Element
              ? event.target.closest('[cmdk-item]')
              : null;
          const item = itemByValue.get(row?.getAttribute('data-value') ?? '');
          if (item !== undefined && item !== activeItem) {
            movedByKeyboard.current = false;
            showDetail({ item, row });
          }
        }}
      >
        <CommandEmpty>{emptyText}</CommandEmpty>
        {sections.map((section) => (
          <CommandGroup
            key={section.id}
            heading={section.heading}
            className={cn(
              '[&_[cmdk-group-heading]]:sticky [&_[cmdk-group-heading]]:top-0 [&_[cmdk-group-heading]]:z-10 [&_[cmdk-group-heading]]:bg-panel',
              detail !== undefined && '[&_[cmdk-group-heading]]:pt-2.5',
            )}
          >
            {section.groups.map((group) =>
              group.collapsible === true ? (
                <div key={group.id}>
                  <CommandItem
                    value={`${group.id}:toggle`}
                    aria-expanded={isOpen(group)}
                    onSelect={() =>
                      setToggled((current) => ({
                        ...current,
                        [group.id]: !isOpen(group),
                      }))
                    }
                  >
                    {isOpen(group) ? (
                      <ChevronDown className="size-3.5 text-gray-10" />
                    ) : (
                      <ChevronRight className="size-3.5 text-gray-10" />
                    )}
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      {group.heading}
                    </span>
                    <span className="w-10 shrink-0 text-right text-xs tabular-nums text-gray-10">
                      {group.items.length}
                    </span>
                    <span className="size-4 shrink-0" />
                  </CommandItem>
                  {isOpen(group) && renderItems(group)}
                </div>
              ) : (
                <div key={group.id}>{renderItems(group)}</div>
              ),
            )}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );

  return (
    <Popover
      modal
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setSearch('');
          setExpanded([]);
          setToggled({});
          setHighlighted('');
          setActiveItem(null);
        }
        onOpenChange(next);
      }}
    >
      {anchorOnly ? (
        <PopoverAnchor asChild>{children}</PopoverAnchor>
      ) : (
        <PopoverTrigger asChild>{children}</PopoverTrigger>
      )}
      <PopoverContent
        align={align}
        className={cn(
          'relative p-0',
          detail === undefined
            ? 'w-[420px]'
            : 'w-[var(--radix-popover-trigger-width)] min-w-80',
        )}
      >
        <div
          ref={frameRef}
          className="relative"
          onPointerEnter={cancelClose}
          onPointerLeave={() => {
            if (movedByKeyboard.current) {
              return;
            }
            cancelClose();
            closeTimer.current = setTimeout(
              () => setActiveItem(null),
              DETAIL_CLOSE_DELAY_MS,
            );
          }}
        >
          {list}
          {detail !== undefined && activeItem !== null && (
            <div
              ref={cardRef}
              className="absolute right-full hidden pr-2 transition-[top] duration-150 sm:block"
              style={{ top: detailTop }}
            >
              <div
                data-testid="model-picker-detail"
                className="w-[300px] rounded-lg border bg-panel p-5 text-gray-12 shadow-lg"
              >
                {detail(activeItem)}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PickerRow<T>({
  item,
  indented,
}: {
  item: ModelPickerItem<T>;
  indented: boolean;
}) {
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
    <span
      className={cn('flex w-full min-w-0 flex-col gap-0.5', indented && 'pl-7')}
    >
      <span className="flex w-full min-w-0 items-center gap-2">
        {item.leading}
        <span
          className={cn(
            'truncate text-sm',
            indented
              ? 'text-gray-11 group-data-[selected=true]:text-gray-12'
              : item.description !== undefined && 'font-medium',
          )}
          title={item.name}
        >
          {item.name}
        </span>
        {item.badges}
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
          {item.trailing !== undefined && (
            <span className="w-10 text-right text-xs tabular-nums text-gray-11">
              {item.trailing}
            </span>
          )}
          <Check
            className={cn(
              'size-4 text-gray-11',
              item.selected ? 'opacity-100' : 'opacity-0',
            )}
          />
        </span>
      </span>
      {item.description !== undefined && (
        <span className="truncate pl-8 text-xs text-gray-11">
          {item.description}
        </span>
      )}
      {item.note !== undefined && (
        <span className="pl-6 text-xs text-warning-11">{item.note}</span>
      )}
    </span>
  );
}

function sectionsOf<T>({
  groups,
}: {
  groups: ModelPickerGroup<T>[];
}): PickerSection<T>[] {
  return groups.reduce<PickerSection<T>[]>((sections, group) => {
    const last = sections[sections.length - 1];
    if (
      group.section !== undefined &&
      last !== undefined &&
      last.id === group.section
    ) {
      return [
        ...sections.slice(0, -1),
        { ...last, groups: [...last.groups, group] },
      ];
    }
    return [
      ...sections,
      {
        id: group.section ?? group.id,
        heading: group.sectionHeading ?? (
          <span className="flex items-center gap-2">
            {group.heading}
            <span className="ml-auto tabular-nums text-gray-10">
              {group.items.length}
            </span>
          </span>
        ),
        groups: [group],
      },
    ];
  }, []);
}

function itemValue<T>({
  group,
  item,
}: {
  group: ModelPickerGroup<T>;
  item: ModelPickerItem<T>;
}): string {
  return `${group.id}:${item.id}`;
}

const GROUP_CAP = 30;
const DETAIL_CLOSE_DELAY_MS = 150;
const VIEWPORT_MARGIN = 12;

export type ModelPickerItem<T> = {
  id: string;
  value: T;
  name: string;
  searchText: string;
  subtitle?: string;
  description?: string;
  trailing?: string;
  badges?: ReactNode;
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
  section?: string;
  sectionHeading?: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

type PickerSection<T> = {
  id: string;
  heading: ReactNode;
  groups: ModelPickerGroup<T>[];
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
  detail?: (item: ModelPickerItem<T>) => ReactNode;
  children: ReactNode;
};
