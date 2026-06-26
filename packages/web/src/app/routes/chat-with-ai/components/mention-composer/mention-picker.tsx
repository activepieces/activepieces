import { ChatMentionType } from '@activepieces/shared';
import { t } from 'i18next';
import { Blocks, Table2, Workflow } from 'lucide-react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
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
      <span key={`m${i}`} className="font-semibold text-foreground">
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
  const { groups, isLoading, totalCount } =
    mentionSearch.useMentionSearch(query);
  const [activeIndex, setActiveIndex] = useState(0);

  const flatItems = useMemo<RankedItem[]>(() => {
    return GROUP_ORDER.flatMap(
      (type) => groups.find((g) => g.type === type)?.items ?? [],
    );
  }, [groups]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, totalCount]);

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
        if (flatItems.length === 0) {
          return false;
        }
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

  const activeItem = flatItems[activeIndex]?.item;

  return (
    <div className="flex w-[560px] max-w-[85vw] overflow-hidden rounded-xl border bg-popover shadow-xl">
      <div className="flex max-h-[320px] w-[280px] shrink-0 flex-col overflow-y-auto p-1">
        {isLoading && flatItems.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            {t('Searching...')}
          </div>
        ) : flatItems.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            {t('No flows, tables, or apps match')}
          </div>
        ) : (
          GROUP_ORDER.map((type) => {
            const group = groups.find((g) => g.type === type);
            if (!group || group.items.length === 0) {
              return null;
            }
            const GroupIcon = groupIcon(type);
            return (
              <div key={type} className="mb-1">
                <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground">
                  <GroupIcon className="size-3" />
                  {t(GROUP_LABEL[type])}
                  {group.failed && (
                    <span className="text-destructive">{t('(failed)')}</span>
                  )}
                </div>
                {group.items.map((ranked) => {
                  const flatIndex = flatItems.indexOf(ranked);
                  const isActive = flatIndex === activeIndex;
                  return (
                    <button
                      key={`${ranked.item.type}:${ranked.item.id}`}
                      type="button"
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
                        isActive ? 'bg-accent' : 'hover:bg-accent/50',
                      )}
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectItem(ranked.item);
                      }}
                    >
                      <ItemIcon item={ranked.item} />
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
            );
          })
        )}
      </div>
      <MentionPreviewPanel item={activeItem} />
    </div>
  );
});
MentionPicker.displayName = 'MentionPicker';

function ItemIcon({ item }: { item: MentionItem }) {
  if (item.type === ChatMentionType.APP && item.logoUrl) {
    return (
      <img
        src={item.logoUrl}
        alt=""
        className="size-4 shrink-0 rounded-sm object-contain"
      />
    );
  }
  const Icon = groupIcon(item.type);
  return <Icon className="size-4 shrink-0 text-muted-foreground" />;
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
