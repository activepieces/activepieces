import { t } from 'i18next';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { cn } from '@/lib/utils';

import { emojiData } from './emoji-data';

const MAX_RESULTS = 35;
const COLS = 7;

export const EmojiSuggestionList = forwardRef<
  EmojiSuggestionListHandle,
  EmojiSuggestionListProps
>(({ query, onCommand }, ref) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const hasQuery = query.trim().length > 0;
  const results = useMemo(
    () =>
      hasQuery
        ? emojiData.search(query).slice(0, MAX_RESULTS)
        : emojiData.popular,
    [query, hasQuery],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    itemRefs.current.get(activeIndex)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  useImperativeHandle(
    ref,
    () => ({
      onKeyDown: (event: KeyboardEvent) => {
        const count = results.length;
        if (count === 0) {
          return false;
        }
        if (event.key === 'ArrowRight') {
          setActiveIndex((i) => (i + 1) % count);
          return true;
        }
        if (event.key === 'ArrowLeft') {
          setActiveIndex((i) => (i - 1 + count) % count);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setActiveIndex((i) => Math.min(i + COLS, count - 1));
          return true;
        }
        if (event.key === 'ArrowUp') {
          setActiveIndex((i) => Math.max(i - COLS, 0));
          return true;
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          const active = results[activeIndex];
          if (active) {
            onCommand(active.char);
            return true;
          }
        }
        return false;
      },
    }),
    [results, activeIndex, onCommand],
  );

  if (results.length === 0) {
    return (
      <div className="w-[252px] rounded-xl border bg-popover px-3 py-3 text-center text-xs text-muted-foreground shadow-xl">
        {t('No emoji found')}
      </div>
    );
  }

  return (
    <div className="w-[252px] rounded-xl border bg-popover p-1.5 shadow-xl">
      <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
        {hasQuery ? t('Emoji') : t('Popular')}
      </div>
      <div className="grid max-h-[176px] grid-cols-7 gap-0.5 overflow-y-auto">
        {results.map((emoji, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={emoji.char}
              ref={(el) => {
                if (el) itemRefs.current.set(index, el);
              }}
              type="button"
              className={cn(
                'flex aspect-square items-center justify-center rounded-md text-xl leading-none transition-colors',
                isActive ? 'bg-foreground/10' : 'hover:bg-foreground/5',
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                onCommand(emoji.char);
              }}
            >
              {emoji.char}
            </button>
          );
        })}
      </div>
    </div>
  );
});
EmojiSuggestionList.displayName = 'EmojiSuggestionList';

export type EmojiSuggestionListHandle = {
  onKeyDown: (event: KeyboardEvent) => boolean;
};

export type EmojiSuggestionListProps = {
  query: string;
  onCommand: (emoji: string) => void;
};
