import { t } from 'i18next';
import { Check, Pencil } from 'lucide-react';
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
  shortcut,
  selected = false,
  disabled,
  tabIndex,
  onPick,
  onKeyDown,
  onFocus,
  optionRef,
}: ChatOptionProps) {
  return (
    <button
      ref={optionRef}
      type="button"
      role={ROLE_BY_MODE[mode]}
      aria-checked={mode === 'action' ? undefined : selected}
      aria-keyshortcuts={shortcut === undefined ? undefined : String(shortcut)}
      disabled={disabled}
      tabIndex={tabIndex}
      onClick={onPick}
      onKeyDown={onKeyDown}
      onKeyUp={preventSpaceClick}
      onFocus={onFocus}
      className={cn(
        'flex w-full min-w-0 items-center gap-3 rounded-lg px-2 text-left text-sm text-gray-12 outline-none transition-colors disabled:opacity-50',
        description ? 'min-h-12 py-2' : 'min-h-11 py-1.5',
        selected
          ? 'bg-accent-3 ring-1 ring-inset ring-accent-7 hover:bg-accent-4 focus-visible:bg-accent-4'
          : 'hover:bg-gray-4 focus-visible:bg-gray-4',
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
  autoFocus = true,
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
    roving.focus(SEARCH_ID);
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {showSearch && (
        <SearchInput
          ref={roving.register(SEARCH_ID)}
          value={query}
          onChange={setQuery}
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
          role={mode === 'radio' ? 'radiogroup' : 'group'}
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
                    grid: false,
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
  autoFocus = true,
}: ChatOptionGridProps) {
  const roving = useOptionRoving({
    items,
    selected,
    withWriteYourOwn: writeYourOwn !== undefined,
    autoFocusId: autoFocus ? 'first' : null,
  });

  return (
    <div
      role={mode === 'radio' ? 'radiogroup' : 'group'}
      aria-label={ariaLabel}
      className="grid grid-cols-3 gap-2 @max-chat-narrow/chat:grid-cols-2"
    >
      {items.map((item) => {
        const isSelected = selected.includes(item.id);
        return (
          <button
            key={item.id}
            ref={roving.register(item.id)}
            type="button"
            role={ROLE_BY_MODE[mode]}
            aria-checked={isSelected}
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
                grid: true,
              })
            }
            className={cn(
              'flex h-18 min-w-0 flex-col justify-center gap-2 rounded-lg px-3.5 text-left outline-none transition-colors disabled:opacity-50',
              isSelected
                ? 'bg-accent-3 ring-1 ring-inset ring-accent-7 hover:bg-accent-4 focus-visible:bg-accent-4'
                : 'ring-1 ring-inset ring-gray-6 hover:bg-gray-4 focus-visible:bg-gray-4',
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
      {writeYourOwn && (
        <ChatWriteYourOwn
          {...writeYourOwn}
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
  restingLabel,
  shape = 'row',
  inputRef,
}: ChatWriteYourOwnProps) {
  const fieldId = useId();
  const active = value.trim().length > 0;
  return (
    <label
      htmlFor={fieldId}
      className={cn(
        'flex min-w-0 cursor-text rounded-lg transition-colors',
        shape === 'row'
          ? 'min-h-11 items-center gap-3 px-2 hover:bg-gray-4 focus-within:bg-gray-4'
          : 'h-18 flex-col justify-center gap-2 border border-dashed border-gray-7 px-3.5 focus-within:border-gray-8',
        active && shape === 'row' && 'bg-gray-4',
      )}
    >
      <Pencil aria-hidden className="size-4 shrink-0 text-gray-9" />
      <span className="relative flex min-w-0 flex-1">
        <Input
          ref={inputRef}
          id={fieldId}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
            if (!active) return;
            event.preventDefault();
            onSubmit();
          }}
          className={cn(
            'peer h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent',
            restingLabel &&
              'placeholder:text-transparent focus:placeholder:text-gray-9',
          )}
        />
        {restingLabel && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden items-center truncate text-sm text-gray-9 peer-placeholder-shown:flex peer-focus:hidden"
          >
            {restingLabel}
          </span>
        )}
      </span>
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
  const autoFocused = useRef(false);
  const [activeId, setActive] = useState<string | null>(null);
  const optionIds = items
    .filter((item) => !item.disabled)
    .map((item) => item.id);
  const stopIds = withWriteYourOwn
    ? [...optionIds, WRITE_YOUR_OWN_ID]
    : optionIds;
  const fallbackId =
    optionIds.find((id) => selected.includes(id)) ?? optionIds[0] ?? null;
  const currentId =
    activeId !== null && optionIds.includes(activeId) ? activeId : fallbackId;
  const mountFocusId = autoFocusId === 'first' ? fallbackId : autoFocusId;

  useEffect(() => {
    if (autoFocused.current || mountFocusId === null) return;
    const node = nodes.current.get(mountFocusId);
    if (!node) return;
    autoFocused.current = true;
    node.focus({ preventScroll: true });
  }, [mountFocusId]);

  function register(id: string) {
    return (node: HTMLElement | null) => {
      if (node) nodes.current.set(id, node);
      else nodes.current.delete(id);
    };
  }

  function focus(id: string) {
    if (optionIds.includes(id)) setActive(id);
    nodes.current.get(id)?.focus({ preventScroll: true });
  }

  function move({ from, delta }: { from: string; delta: number }) {
    const index = stopIds.indexOf(from);
    const next = stopIds[(index + delta + stopIds.length) % stopIds.length];
    if (next !== undefined) focus(next);
  }

  function handleKeyDown({
    event,
    id,
    onPick,
    numbered,
    grid,
  }: {
    event: KeyboardEvent<HTMLElement>;
    id: string;
    onPick: (id: string) => void;
    numbered: boolean;
    grid: boolean;
  }) {
    const delta = keyDelta({ key: event.key, grid });
    if (delta !== null) {
      event.preventDefault();
      move({ from: id, delta });
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const target =
        event.key === 'Home' ? optionIds[0] : optionIds[optionIds.length - 1];
      if (target !== undefined) focus(target);
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
    focus(target.id);
    onPick(target.id);
  }

  return {
    register,
    focus,
    setActive,
    handleKeyDown,
    tabIndexFor: (id: string) => (id === currentId ? 0 : -1),
  };
}

function keyDelta({
  key,
  grid,
}: {
  key: string;
  grid: boolean;
}): number | null {
  if (key === 'ArrowDown' || (grid && key === 'ArrowRight')) return 1;
  if (key === 'ArrowUp' || (grid && key === 'ArrowLeft')) return -1;
  return null;
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
const SEARCH_ID = 'chat-option-search';
const WRITE_YOUR_OWN_ID = 'chat-option-write-your-own';
const ROLE_BY_MODE: Record<ChatOptionMode, 'radio' | 'checkbox' | undefined> = {
  radio: 'radio',
  check: 'checkbox',
  action: undefined,
};

type ChatOptionMode = 'radio' | 'check' | 'action';

type ChatOptionProps = {
  mode: ChatOptionMode;
  label: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
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
  disabled?: boolean;
};

type ChatWriteYourOwnProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  restingLabel?: string;
  shape?: 'row' | 'tile';
  inputRef?: Ref<HTMLInputElement>;
};

type ChatOptionListProps = {
  items: ChatOptionItem[];
  mode: 'radio' | 'check';
  selected: string[];
  onPick: (id: string) => void;
  ariaLabel: string;
  numbered?: boolean;
  searchPlaceholder?: string;
  noMatchText?: (query: string) => string;
  writeYourOwn?: Omit<ChatWriteYourOwnProps, 'shape' | 'inputRef'>;
  autoFocus?: boolean;
};

type ChatOptionGridProps = Omit<
  ChatOptionListProps,
  'numbered' | 'searchPlaceholder' | 'noMatchText'
>;

export type { ChatOptionItem };
