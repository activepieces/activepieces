import { ACTIVEPIECES_CHAT_TIERS } from '@activepieces/shared';
import { t } from 'i18next';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  CornerDownLeft,
  Equal,
  Lightbulb,
  Rocket,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const TIER_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    displayLabel: string;
    description: string;
  }
> = {
  fast: {
    icon: Equal,
    displayLabel: 'Fast',
    description: 'Quick replies for simple tasks',
  },
  smart: {
    icon: Lightbulb,
    displayLabel: 'Expert',
    description: 'Best for everyday use',
  },
  premium: {
    icon: Rocket,
    displayLabel: 'Heavy',
    description: 'Highest quality, a bit slower',
  },
};

export function ChatModelSelector({
  selectedModel,
  onModelChange,
}: {
  selectedModel: string | null;
  onModelChange: (modelId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedTierId = selectedModel ?? 'smart';
  const selectedConfig = TIER_CONFIG[selectedTierId] ?? TIER_CONFIG.smart;

  useEffect(() => {
    if (!open) return;
    const idx = ACTIVEPIECES_CHAT_TIERS.findIndex(
      (tier) => tier.id === selectedTierId,
    );
    setFocusedIndex(idx >= 0 ? idx : 0);
    const rafId = requestAnimationFrame(() => listRef.current?.focus());
    return () => cancelAnimationFrame(rafId);
  }, [open, selectedTierId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < ACTIVEPIECES_CHAT_TIERS.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : ACTIVEPIECES_CHAT_TIERS.length - 1,
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const tier = ACTIVEPIECES_CHAT_TIERS[focusedIndex];
        if (tier) {
          onModelChange(tier.id);
          setOpen(false);
        }
      }
    },
    [focusedIndex, onModelChange],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className="h-7 gap-1 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <span>{t(selectedConfig.displayLabel)}</span>
          <ChevronDown className="size-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[330px] p-0"
        align="end"
        side="top"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div
          ref={listRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="outline-none"
        >
          <div className="py-1">
            {ACTIVEPIECES_CHAT_TIERS.map((tier, index) => {
              const config = TIER_CONFIG[tier.id];
              if (!config) return null;
              const Icon = config.icon;
              const isSelected = selectedTierId === tier.id;
              const isFocused = focusedIndex === index;
              return (
                <div
                  key={tier.id}
                  onClick={() => {
                    onModelChange(tier.id);
                    setOpen(false);
                  }}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3.5 cursor-pointer transition-colors',
                    isFocused && 'bg-accent',
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-background">
                    <Icon className="size-4 text-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {t(config.displayLabel)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t(config.description)}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      'size-4 shrink-0',
                      isSelected ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 border-t px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <kbd className="flex h-5 w-5 items-center justify-center rounded border bg-muted">
                <ArrowUp className="size-3" />
              </kbd>
              <kbd className="flex h-5 w-5 items-center justify-center rounded border bg-muted">
                <ArrowDown className="size-3" />
              </kbd>
              <span>{t('to navigate')}</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="flex h-5 w-5 items-center justify-center rounded border bg-muted">
                <CornerDownLeft className="size-3" />
              </kbd>
              <span>{t('to select')}</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
