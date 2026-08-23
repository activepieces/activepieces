import { AIProviderName, isNil } from '@activepieces/core-utils';
import {
  ACTIVEPIECES_CHAT_TIERS,
  aiProviderUtils,
  CHAT_CREDITS_PER_TOOL_CALL,
} from '@activepieces/shared';
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
  Sparkles,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { aiProviderQueries } from '@/features/platform-admin';
import { cn } from '@/lib/utils';

const TIER_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }
> = {
  fast: {
    icon: Equal,
    description: 'Quick replies for simple tasks',
  },
  smart: {
    icon: Lightbulb,
    description: 'Best for everyday use',
  },
  premium: {
    icon: Rocket,
    description: 'Highest quality, a bit slower',
  },
};

function useModelOptions(): ModelOption[] {
  const { data: chatProvider } = aiProviderQueries.useChatProvider();
  const curatedModels = isNil(chatProvider)
    ? undefined
    : aiProviderUtils.getCuratedChatModels({ provider: chatProvider.provider });
  if (isNil(curatedModels)) {
    return ACTIVEPIECES_CHAT_TIERS.map((tier) => ({
      id: tier.id,
      ...TIER_CONFIG[tier.id],
      displayLabel: tier.label,
      creditWeight: tier.creditWeight,
    }));
  }
  return curatedModels.map((model) => ({
    id: model.id,
    icon: Sparkles,
    displayLabel: model.label,
    description: null,
    creditWeight: null,
  }));
}

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
  const { data: chatProvider } = aiProviderQueries.useChatProvider();
  const showCredits = chatProvider?.provider === AIProviderName.ACTIVEPIECES;

  const options = useModelOptions();
  const selectedOption =
    options.find((option) => option.id === selectedModel) ?? options[0];

  const focused =
    focusedIndex === -1 ? options.indexOf(selectedOption) : focusedIndex;

  useEffect(() => {
    if (!open) return;
    const rafId = requestAnimationFrame(() => listRef.current?.focus());
    return () => cancelAnimationFrame(rafId);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(focused < options.length - 1 ? focused + 1 : 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(focused > 0 ? focused - 1 : options.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onModelChange(options[focused].id);
      setOpen(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setFocusedIndex(-1);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className="h-7 gap-1 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <span>{t(selectedOption.displayLabel)}</span>
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
            {options.map((option, index) => {
              const Icon = option.icon;
              const isSelected = selectedOption.id === option.id;
              const isFocused = focused === index;
              return (
                <div
                  key={option.id}
                  onClick={() => {
                    onModelChange(option.id);
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {t(option.displayLabel)}
                      </span>
                      {showCredits && !isNil(option.creditWeight) && (
                        <span className="text-xs text-muted-foreground">
                          {t(
                            '{count, plural, =1 {1 credit} other {# credits}}',
                            { count: option.creditWeight },
                          )}
                        </span>
                      )}
                    </div>
                    {option.description && (
                      <span className="text-xs text-muted-foreground">
                        {t(option.description)}
                      </span>
                    )}
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
          {showCredits && (
            <div className="border-t px-3 py-2 text-xs text-muted-foreground">
              {t(
                'Per message, plus {count, plural, =1 {1 credit} other {# credits}} per tool call.',
                { count: CHAT_CREDITS_PER_TOOL_CALL },
              )}
            </div>
          )}
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

type ModelOption = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  displayLabel: string;
  description: string | null;
  creditWeight: number | null;
};
