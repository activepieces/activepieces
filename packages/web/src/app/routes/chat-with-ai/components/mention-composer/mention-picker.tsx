import { ChatMentionType } from '@activepieces/shared';
import { t } from 'i18next';
import { Blocks, Table2, Workflow } from 'lucide-react';
import { motion } from 'motion/react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { cn } from '@/lib/utils';

import { MentionPreviewPanel } from './mention-preview-panel';
import { MentionItem, mentionSearch, RankedItem } from './use-mention-search';

const GROUP_ORDER: ChatMentionType[] = [
  ChatMentionType.FLOW,
  ChatMentionType.TABLE,
  ChatMentionType.APP,
];

const GROUP_LABEL: Record<ChatMentionType, string> = {
  [ChatMentionType.FLOW]: 'Flows',
  [ChatMentionType.TABLE]: 'Tables',
  [ChatMentionType.APP]: 'Apps',
};

function groupIcon(type: ChatMentionType) {
  if (type === ChatMentionType.FLOW) return Workflow;
  if (type === ChatMentionType.TABLE) return Table2;
  return Blocks;
}

function HighlightedLabel({
  label,
  indices,
}: {
  label: string;
  indices: number[][];
}) {
  if (indices.length === 0) {
    return <>{label}</>;
  }
  const segments: React.ReactNode[] = [];
  let cursor = 0;
  indices.forEach(([start, end], i) => {
    if (start > cursor) {
      segments.push(<span key={`t${i}`}>{label.slice(cursor, start)}</span>);
    }
    segments.push(
      <span key={`m${i}`} className="font-semibold text-primary">
        {label.slice(start, end + 1)}
      </span>,
    );
    cursor = end + 1;
  });
  if (cursor < label.length) {
    segments.push(<span key="rest">{label.slice(cursor)}</span>);
  }
  return <>{segments}</>;
}

export const MentionPicker = forwardRef<
  MentionPickerHandle,
  MentionPickerProps
>(({ query, onCommand }, ref) => {
  const { groups, isLoading } = mentionSearch.useMentionSearch(query);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<ChatMentionType>(GROUP_ORDER[0]);
  const listRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<
    Partial<Record<ChatMentionType, HTMLDivElement | null>>
  >({});
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const visibleGroups = useMemo(
    () =>
      GROUP_ORDER.map((type) => groups.find((g) => g.type === type)).filter(
        (g): g is NonNullable<typeof g> => !!g && g.items.length > 0,
      ),
    [groups],
  );

  const flatItems = useMemo<RankedItem[]>(
    () => visibleGroups.flatMap((g) => g.items),
    [visibleGroups],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query, flatItems.length]);

  useEffect(() => {
    if (visibleGroups[0]) {
      setActiveTab(visibleGroups[0].type);
    }
  }, [visibleGroups]);

  useEffect(() => {
    const el = itemRefs.current.get(activeIndex);
    const container = listRef.current;
    if (!el || !container) return;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top < container.scrollTop) {
      container.scrollTop = top - 8;
    } else if (bottom > container.scrollTop + container.clientHeight) {
      container.scrollTop = bottom - container.clientHeight + 8;
    }
  }, [activeIndex]);

  const selectItem = useCallback(
    (item: MentionItem) => {
      onCommand({
        mentionType: item.type,
        entityId: item.id,
        label: item.label,
        logoUrl: item.logoUrl ?? null,
      });
    },
    [onCommand],
  );

  useImperativeHandle(
    ref,
    () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (flatItems.length === 0) return false;
        if (event.key === 'ArrowDown') {
          setActiveIndex((i) => (i + 1) % flatItems.length);
          return true;
        }
        if (event.key === 'ArrowUp') {
          setActiveIndex((i) => (i - 1 + flatItems.length) % flatItems.length);
          return true;
        }
        if (event.key === 'Enter') {
          const active = flatItems[activeIndex];
          if (active) {
            selectItem(active.item);
            return true;
          }
        }
        return false;
      },
    }),
    [flatItems, activeIndex, selectItem],
  );

  const onListScroll = useCallback(() => {
    const container = listRef.current;
    if (!container) return;
    const threshold = container.scrollTop + 24;
    let current = visibleGroups[0]?.type;
    for (const g of visibleGroups) {
      const el = sectionRefs.current[g.type];
      if (el && el.offsetTop <= threshold) {
        current = g.type;
      }
    }
    if (current) setActiveTab(current);
  }, [visibleGroups]);

  const scrollToSection = useCallback((type: ChatMentionType) => {
    setActiveTab(type);
    const el = sectionRefs.current[type];
    const container = listRef.current;
    if (el && container) {
      container.scrollTo({ top: el.offsetTop - 4, behavior: 'smooth' });
    }
  }, []);

  const activeItem = flatItems[activeIndex]?.item;
  const empty = !isLoading && flatItems.length === 0;

  return (
    <div className="flex h-[400px] w-[680px] max-w-[94vw] overflow-hidden rounded-2xl border bg-popover shadow-2xl">
      <div className="flex w-[300px] shrink-0 flex-col">
        <div className="relative flex items-center gap-1 px-3 pt-3">
          {GROUP_ORDER.map((type) => {
            const g = groups.find((gr) => gr.type === type);
            const count = g?.items.length ?? 0;
            const isActive = activeTab === type;
            return (
              <button
                key={type}
                type="button"
                disabled={count === 0}
                onMouseDown={(e) => {
                  e.preventDefault();
                  scrollToSection(type);
                }}
                className={cn(
                  'relative rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                  count === 0
                    ? 'cursor-default text-muted-foreground/40'
                    : isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(GROUP_LABEL[type])}
                {count > 0 && (
                  <span className="ml-1 text-[11px] text-muted-foreground">
                    {count}
                  </span>
                )}
                {isActive && count > 0 && (
                  <motion.div
                    layoutId="mention-tab-underline"
                    className="absolute inset-x-1.5 -bottom-px h-0.5 rounded-full bg-primary"
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="border-b" />

        <div
          ref={listRef}
          onScroll={onListScroll}
          className="relative flex-1 overflow-y-auto px-2 py-2"
        >
          {isLoading && flatItems.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-muted-foreground">
              {t('Searching...')}
            </div>
          ) : empty ? (
            <div className="px-3 py-10 text-center text-sm text-muted-foreground">
              {t('No flows, tables, or apps match')}
            </div>
          ) : (
            visibleGroups.map((group) => (
              <div
                key={group.type}
                ref={(el) => {
                  sectionRefs.current[group.type] = el;
                }}
                className="mb-1 scroll-mt-2"
              >
                <div className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                  {t(GROUP_LABEL[group.type])}
                  {group.failed && (
                    <span className="ml-1 text-destructive">
                      {t('(failed)')}
                    </span>
                  )}
                </div>
                {group.items.map((ranked) => {
                  const flatIndex = flatItems.indexOf(ranked);
                  const isActive = flatIndex === activeIndex;
                  return (
                    <button
                      key={`${ranked.item.type}:${ranked.item.id}`}
                      ref={(el) => {
                        if (el) itemRefs.current.set(flatIndex, el);
                      }}
                      type="button"
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-[14px] transition-colors',
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent/50',
                      )}
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectItem(ranked.item);
                      }}
                    >
                      <ItemIcon item={ranked.item} active={isActive} />
                      <span className="min-w-0 flex-1 truncate">
                        <HighlightedLabel
                          label={ranked.item.label}
                          indices={ranked.matchIndices}
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
      <MentionPreviewPanel item={activeItem} />
    </div>
  );
});
MentionPicker.displayName = 'MentionPicker';

function ItemIcon({ item, active }: { item: MentionItem; active: boolean }) {
  if (item.type === ChatMentionType.APP && item.logoUrl) {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border bg-background">
        <img
          src={item.logoUrl}
          alt=""
          className="size-4 object-contain"
          loading="lazy"
        />
      </span>
    );
  }
  const Icon = groupIcon(item.type);
  return (
    <span
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-lg border',
        active
          ? 'bg-primary/10 text-primary'
          : 'bg-muted/40 text-muted-foreground',
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

export type MentionCommandAttrs = {
  mentionType: ChatMentionType;
  entityId: string;
  label: string;
  logoUrl: string | null;
};

export type MentionPickerHandle = {
  onKeyDown: (event: KeyboardEvent) => boolean;
};

export type MentionPickerProps = {
  query: string;
  onCommand: (attrs: MentionCommandAttrs) => void;
};
