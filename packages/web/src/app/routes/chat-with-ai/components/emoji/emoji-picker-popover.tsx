import { t } from 'i18next';
import { Smile } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { PromptInputAction } from '@/components/prompt-kit/prompt-input';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { emojiData } from './emoji-data';

const COLS = 7;

export function EmojiButtonPopover({
  onSelect,
}: {
  onSelect: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const results = useMemo(() => emojiData.search(query), [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    itemRefs.current.get(activeIndex)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
    setQuery('');
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery('');
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const count = results.length;
    if (count === 0) {
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % count);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + count) % count);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + COLS, count - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - COLS, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const active = results[activeIndex];
      if (active) {
        handleSelect(active.char);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PromptInputAction tooltip={t('Insert emoji')}>
        <PopoverAnchor asChild>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:h-7 sm:w-7"
          >
            <Smile className="size-4" />
          </button>
        </PopoverAnchor>
      </PromptInputAction>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-[268px] rounded-xl p-2"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
        onFocusOutside={(e) => e.preventDefault()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder={t('Search emoji')}
          className="mb-1.5 w-full rounded-md bg-muted/60 px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        {results.length === 0 ? (
          <div className="px-2 py-6 text-center text-xs text-muted-foreground">
            {t('No emoji found')}
          </div>
        ) : (
          <div className="grid max-h-[196px] grid-cols-7 gap-0.5 overflow-y-auto">
            {results.map((emoji, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={emoji.char}
                  ref={(el) => {
                    if (el) itemRefs.current.set(index, el);
                  }}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => handleSelect(emoji.char)}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-md text-xl leading-none transition-colors',
                    isActive ? 'bg-foreground/10' : 'hover:bg-foreground/5',
                  )}
                >
                  {emoji.char}
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
