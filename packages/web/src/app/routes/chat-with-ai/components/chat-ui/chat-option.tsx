import { t } from 'i18next';
import { Check } from 'lucide-react';
import {
  KeyboardEvent,
  ReactNode,
  Ref,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function ChatOption({
  mode,
  label,
  description,
  leading,
  trailing,
  action,
  shortcut,
  selected = false,
  disabled,
  tabIndex,
  onPick,
  onKeyDown,
  onFocus,
  optionRef,
}: ChatOptionProps) {
  const rowClass = cn(
    'flex w-full min-w-0 items-center rounded-lg border transition-colors',
    description ? 'min-h-12' : 'min-h-11',
    selected
      ? 'border-accent-7 bg-accent-3 hover:bg-accent-4'
      : 'border-transparent hover:bg-gray-4',
  );
  const focusBg = selected
    ? 'focus-visible:bg-accent-4'
    : 'focus-visible:bg-gray-4';
  const button = (
    <button
      ref={optionRef}
      type="button"
      role={ROLE_BY_MODE[mode]}
      aria-checked={mode === 'check' ? selected : undefined}
      aria-selected={mode === 'radio' ? selected : undefined}
      aria-keyshortcuts={shortcut === undefined ? undefined : String(shortcut)}
      disabled={disabled}
      tabIndex={tabIndex}
      onClick={onPick}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyDown ? preventSpaceClick : undefined}
      onFocus={onFocus}
      className={cn(
        'flex min-w-0 flex-1 items-center gap-2.5 self-stretch rounded-lg px-2.5 text-left text-sm text-gray-12 outline-none focus-visible:ring-[3px] focus-visible:ring-gray-8/50 disabled:opacity-50',
        description ? 'py-2' : 'py-1.5',
        action ? 'focus-visible:bg-transparent' : cn(rowClass, focusBg),
      )}
    >
      <OptionMark mode={mode} selected={selected} />
      {leading && <span className="flex shrink-0 items-center">{leading}</span>}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{label}</span>
        {description && (
          <span className="truncate text-xs text-gray-11">{description}</span>
        )}
      </span>
      {trailing && (
        <span className="flex shrink-0 items-center text-xs text-gray-11">
          {trailing}
        </span>
      )}
      {shortcut !== undefined && (
        <span aria-hidden className="w-3 shrink-0 text-xs text-gray-9">
          {shortcut}
        </span>
      )}
    </button>
  );
  if (!action) return button;
  return (
    <div
      className={cn(
        rowClass,
        selected
          ? 'has-[>button:focus-visible]:bg-accent-4'
          : 'has-[>button:focus-visible]:bg-gray-4',
      )}
    >
      {button}
      <span className="flex shrink-0 items-center gap-2 pr-2.5">{action}</span>
    </div>
  );
}

export function ChatOptionList({
  items,
  mode,
  selected,
  onPick,
  ariaLabel,
  numbered = false,
  searchPlaceholder,
  noMatchText,
  writeYourOwn,
  autoFocus = false,
}: ChatOptionListProps) {
  const [query, setQuery] = useState('');
  const showSearch = items.length > SEARCH_THRESHOLD;
  const visible = showSearch ? filterItems({ items, query }) : items;
  const roving = useOptionRoving({
    items: visible,
    selected,
    withWriteYourOwn: writeYourOwn !== undefined,
    autoFocusId: autoFocus ? (showSearch ? SEARCH_ID : 'first') : null,
  });

  function clearSearch() {
    setQuery('');
    roving.focus({ id: SEARCH_ID });
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && roving.currentId !== null) {
      event.preventDefault();
      roving.focus({ id: roving.currentId, scroll: true });
      return;
    }
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
    const pickable = visible.filter((item) => !item.disabled);
    if (pickable.length !== 1 || pickable[0] === undefined) return;
    event.preventDefault();
    onPick(pickable[0].id);
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {showSearch && (
        <SearchInput
          ref={roving.register(SEARCH_ID)}
          value={query}
          onChange={setQuery}
          onKeyDown={handleSearchKeyDown}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder ?? t('Search')}
        />
      )}
      {visible.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-7 px-4 py-3.5">
          <p className="min-w-0 flex-1 text-sm text-gray-11">
            {noMatchText
              ? noMatchText(query)
              : t('Nothing matches "{query}"', { query })}
          </p>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 font-medium"
            onClick={clearSearch}
          >
            {t('Clear search')}
          </Button>
        </div>
      ) : (
        <div
          role={CONTAINER_ROLE_BY_MODE[mode]}
          aria-label={ariaLabel}
          className={cn(
            'flex flex-col gap-0.5',
            showSearch && 'max-h-68.5 overflow-y-auto',
          )}
        >
          {visible.map((item, index) => {
            const shortcut =
              numbered && index < MAX_SHORTCUT ? index + 1 : undefined;
            return (
              <ChatOption
                key={item.id}
                mode={mode}
                label={highlightMatch({ label: item.label, query })}
                description={item.description}
                leading={item.leading}
                trailing={item.trailing}
                action={item.action}
                shortcut={shortcut}
                selected={selected.includes(item.id)}
                disabled={item.disabled}
                tabIndex={roving.tabIndexFor(item.id)}
                optionRef={roving.register(item.id)}
                onFocus={() => roving.setActive(item.id)}
                onPick={() => onPick(item.id)}
                onKeyDown={(event) =>
                  roving.handleKeyDown({
                    event,
                    id: item.id,
                    onPick,
                    numbered,
                    columns: 1,
                  })
                }
              />
            );
          })}
        </div>
      )}
      {writeYourOwn && (
        <ChatWriteYourOwn
          {...writeYourOwn}
          mode={mode === 'check' ? 'check' : 'radio'}
          inputRef={roving.register(WRITE_YOUR_OWN_ID)}
        />
      )}
    </div>
  );
}

export function ChatOptionGrid({
  items,
  mode,
  selected,
  onPick,
  ariaLabel,
  writeYourOwn,
  autoFocus = false,
}: ChatOptionGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const roving = useOptionRoving({
    items,
    selected,
    withWriteYourOwn: writeYourOwn !== undefined,
    autoFocusId: autoFocus ? 'first' : null,
  });

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-3 gap-2 @max-chat-narrow/chat:grid-cols-2"
    >
      <div
        role={CONTAINER_ROLE_BY_MODE[mode]}
        aria-label={ariaLabel}
        className="contents"
      >
        {items.map((item) => {
          const isSelected = selected.includes(item.id);
          return (
            <button
              key={item.id}
              ref={roving.register(item.id)}
              type="button"
              role={ROLE_BY_MODE[mode]}
              aria-checked={mode === 'check' ? isSelected : undefined}
              aria-selected={mode === 'radio' ? isSelected : undefined}
              disabled={item.disabled}
              tabIndex={roving.tabIndexFor(item.id)}
              onFocus={() => roving.setActive(item.id)}
              onClick={() => onPick(item.id)}
              onKeyUp={preventSpaceClick}
              onKeyDown={(event) =>
                roving.handleKeyDown({
                  event,
                  id: item.id,
                  onPick,
                  numbered: false,
                  columns: columnCount(gridRef.current),
                })
              }
              className={cn(
                'flex h-18 min-w-0 flex-col justify-center gap-2 rounded-lg border px-3.5 text-left outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-gray-8/50 disabled:opacity-50',
                isSelected
                  ? 'border-accent-7 bg-accent-3 hover:bg-accent-4 focus-visible:bg-accent-4'
                  : 'border-gray-6 hover:bg-gray-4 focus-visible:bg-gray-4',
              )}
            >
              <span className="flex size-5 items-center justify-center">
                {item.leading}
              </span>
              <span className="truncate text-sm font-medium text-gray-12">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      {writeYourOwn && (
        <ChatWriteYourOwn
          {...writeYourOwn}
          mode={mode === 'check' ? 'check' : 'radio'}
          shape="tile"
          inputRef={roving.register(WRITE_YOUR_OWN_ID)}
        />
      )}
    </div>
  );
}

export function ChatWriteYourOwn({
  value,
  onChange,
  onSubmit,
  placeholder,
  mode = 'radio',
  shape = 'row',
  inputRef,
}: ChatWriteYourOwnProps) {
  const fieldId = useId();
  const active = value.trim().length > 0;
  return (
    <label
      htmlFor={fieldId}
      className={cn(
        'flex min-w-0 cursor-text rounded-lg border transition-colors',
        shape === 'row'
          ? 'min-h-11 items-center gap-2.5 border-transparent px-2.5 hover:bg-gray-4 focus-within:bg-gray-4'
          : 'h-18 flex-col justify-center gap-2 border-dashed border-gray-7 px-3.5 focus-within:border-gray-8',
        active && shape === 'row' && 'bg-gray-4',
      )}
    >
      <DashedMark mode={mode} />
      <Input
        ref={inputRef}
        id={fieldId}
        aria-label={placeholder}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
          if (!active) return;
          event.preventDefault();
          onSubmit();
        }}
        className="h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-sm shadow-none placeholder:text-gray-9 focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
      />
    </label>
  );
}

function OptionMark({
  mode,
  selected,
}: {
  mode: ChatOptionMode;
  selected: boolean;
}) {
  if (mode === 'action') return null;
  if (mode === 'radio') {
    return (
      <span
        aria-hidden
        className={cn(
          'size-4 shrink-0 rounded-full',
          selected
            ? 'border-[5px] border-accent-9'
            : 'border-[1.5px] border-gray-7',
        )}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded',
        selected
          ? 'bg-accent-9 text-on-accent'
          : 'border-[1.5px] border-gray-7',
      )}
    >
      {selected && <Check className="size-3" strokeWidth={3} />}
    </span>
  );
}

function DashedMark({ mode }: { mode: 'radio' | 'check' }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="size-4 shrink-0 fill-none stroke-gray-8"
    >
      {mode === 'radio' ? (
        <circle
          cx="8"
          cy="8"
          r="7.25"
          strokeWidth="1.5"
          strokeDasharray="2.85 2.85"
        />
      ) : (
        <rect
          x="0.75"
          y="0.75"
          width="14.5"
          height="14.5"
          rx="3.25"
          strokeWidth="1.5"
          strokeDasharray="2.6 2.6"
        />
      )}
    </svg>
  );
}

function useOptionRoving({
  items,
  selected,
  withWriteYourOwn,
  autoFocusId,
}: {
  items: ChatOptionItem[];
  selected: string[];
  withWriteYourOwn: boolean;
  autoFocusId: string | null;
}) {
  const nodes = useRef(new Map<string, HTMLElement>());
  const refCallbacks = useRef(
    new Map<string, (node: HTMLElement | null) => void>(),
  );
  const autoFocusDone = useRef(false);
  const [activeId, setActive] = useState<string | null>(null);
  const optionIds = items
    .filter((item) => !item.disabled)
    .map((item) => item.id);
  const stopIds = withWriteYourOwn
    ? [...optionIds, WRITE_YOUR_OWN_ID]
    : optionIds;
  const layoutIds = withWriteYourOwn
    ? [...items.map((item) => item.id), WRITE_YOUR_OWN_ID]
    : items.map((item) => item.id);
  const fallbackId =
    optionIds.find((id) => selected.includes(id)) ?? optionIds[0] ?? null;
  const currentId =
    activeId !== null && optionIds.includes(activeId) ? activeId : fallbackId;
  const mountFocusId = autoFocusId === 'first' ? fallbackId : autoFocusId;
  const hasItems = items.length > 0;

  useEffect(() => {
    if (autoFocusDone.current || mountFocusId === null || !hasItems) return;
    autoFocusDone.current = true;
    if (isEditable(document.activeElement)) return;
    nodes.current.get(mountFocusId)?.focus({ preventScroll: true });
  }, [mountFocusId, hasItems]);

  function register(id: string) {
    const cached = refCallbacks.current.get(id);
    if (cached) return cached;
    const callback = (node: HTMLElement | null) => {
      if (node) nodes.current.set(id, node);
      else nodes.current.delete(id);
    };
    refCallbacks.current.set(id, callback);
    return callback;
  }

  function focus({ id, scroll = false }: { id: string; scroll?: boolean }) {
    if (optionIds.includes(id)) setActive(id);
    const node = nodes.current.get(id);
    if (!node) return;
    node.focus({ preventScroll: true });
    if (scroll && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'nearest' });
    }
  }

  function moveAlong({ from, delta }: { from: string; delta: number }) {
    const index = stopIds.indexOf(from);
    const next = stopIds[(index + delta + stopIds.length) % stopIds.length];
    if (next !== undefined) focus({ id: next, scroll: true });
  }

  function moveRow({ from, delta }: { from: string; delta: number }) {
    const next = layoutIds[layoutIds.indexOf(from) + delta];
    if (next !== undefined && stopIds.includes(next)) {
      focus({ id: next, scroll: true });
    }
  }

  function handleKeyDown({
    event,
    id,
    onPick,
    numbered,
    columns,
  }: {
    event: KeyboardEvent<HTMLElement>;
    id: string;
    onPick: (id: string) => void;
    numbered: boolean;
    columns: number;
  }) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const step = arrowStep({ key: event.key, columns });
    if (step !== null) {
      event.preventDefault();
      if (step.row) moveRow({ from: id, delta: step.delta });
      else moveAlong({ from: id, delta: step.delta });
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const target =
        event.key === 'Home' ? optionIds[0] : optionIds[optionIds.length - 1];
      if (target !== undefined) focus({ id: target, scroll: true });
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onPick(id);
      return;
    }
    const digit = Number(event.key);
    if (!numbered || !Number.isInteger(digit) || digit < 1) return;
    const target = items[digit - 1];
    if (target === undefined || target.disabled) return;
    event.preventDefault();
    focus({ id: target.id, scroll: true });
    onPick(target.id);
  }

  return {
    currentId,
    register,
    focus,
    setActive,
    handleKeyDown,
    tabIndexFor: (id: string) => (id === currentId ? 0 : -1),
  };
}

function arrowStep({
  key,
  columns,
}: {
  key: string;
  columns: number;
}): { delta: number; row: boolean } | null {
  if (columns <= 1) {
    if (key === 'ArrowDown') return { delta: 1, row: false };
    if (key === 'ArrowUp') return { delta: -1, row: false };
    return null;
  }
  if (key === 'ArrowRight') return { delta: 1, row: false };
  if (key === 'ArrowLeft') return { delta: -1, row: false };
  if (key === 'ArrowDown') return { delta: columns, row: true };
  if (key === 'ArrowUp') return { delta: -columns, row: true };
  return null;
}

function columnCount(grid: HTMLElement | null): number {
  if (!grid) return DEFAULT_GRID_COLUMNS;
  const template = getComputedStyle(grid).gridTemplateColumns.trim();
  if (template.length === 0 || template === 'none') return DEFAULT_GRID_COLUMNS;
  return template.split(/\s+/).length;
}

function isEditable(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false;
  if (element.isContentEditable) return true;
  return element.matches(
    'input, textarea, select, [contenteditable]:not([contenteditable="false"])',
  );
}

function preventSpaceClick(event: KeyboardEvent<HTMLElement>) {
  if (event.key === ' ') event.preventDefault();
}

function filterItems({
  items,
  query,
}: {
  items: ChatOptionItem[];
  query: string;
}): ChatOptionItem[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return items;
  return items.filter((item) => item.label.toLowerCase().includes(needle));
}

function highlightMatch({
  label,
  query,
}: {
  label: string;
  query: string;
}): ReactNode {
  const needle = query.trim().toLowerCase();
  const start = needle.length > 0 ? label.toLowerCase().indexOf(needle) : -1;
  if (start === -1) return label;
  const end = start + needle.length;
  return (
    <>
      {label.slice(0, start)}
      <span className="font-semibold">{label.slice(start, end)}</span>
      {label.slice(end)}
    </>
  );
}

const SEARCH_THRESHOLD = 6;
const MAX_SHORTCUT = 9;
const DEFAULT_GRID_COLUMNS = 3;
const SEARCH_ID = 'chat-option-search';
const WRITE_YOUR_OWN_ID = 'chat-option-write-your-own';
const ROLE_BY_MODE: Record<ChatOptionMode, 'option' | 'checkbox' | undefined> =
  {
    radio: 'option',
    check: 'checkbox',
    action: undefined,
  };
const CONTAINER_ROLE_BY_MODE: Record<ChatOptionMode, 'listbox' | 'group'> = {
  radio: 'listbox',
  check: 'group',
  action: 'group',
};

type ChatOptionMode = 'radio' | 'check' | 'action';

type ChatOptionProps = {
  mode: ChatOptionMode;
  label: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  action?: ReactNode;
  shortcut?: number;
  selected?: boolean;
  disabled?: boolean;
  tabIndex?: number;
  onPick: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onFocus?: () => void;
  optionRef?: Ref<HTMLButtonElement>;
};

type ChatOptionItem = {
  id: string;
  label: string;
  description?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  action?: ReactNode;
  disabled?: boolean;
};

type ChatWriteYourOwnProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  mode?: 'radio' | 'check';
  shape?: 'row' | 'tile';
  inputRef?: Ref<HTMLInputElement>;
};

type ChatOptionListProps = {
  items: ChatOptionItem[];
  mode: ChatOptionMode;
  selected: string[];
  onPick: (id: string) => void;
  ariaLabel: string;
  numbered?: boolean;
  searchPlaceholder?: string;
  noMatchText?: (query: string) => string;
  writeYourOwn?: Omit<ChatWriteYourOwnProps, 'shape' | 'inputRef' | 'mode'>;
  autoFocus?: boolean;
};

type ChatOptionGridProps = Omit<
  ChatOptionListProps,
  'numbered' | 'searchPlaceholder' | 'noMatchText'
>;

export type { ChatOptionItem, ChatOptionMode };
