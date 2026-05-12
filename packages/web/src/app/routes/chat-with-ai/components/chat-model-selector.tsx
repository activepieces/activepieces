import {
  ACTIVEPIECES_CHAT_TIERS,
  AIProviderName,
  DEFAULT_CHAT_TIER_ID,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Check,
  ChevronDown,
  Crown,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { aiModelHooks } from '@/features/agents/ai-model/hooks';
import { cn } from '@/lib/utils';

export function ChatModelSelector({
  chatProviderName,
  selectedModel,
  onModelChange,
}: ChatModelSelectorProps) {
  if (chatProviderName === AIProviderName.ACTIVEPIECES) {
    return (
      <TierSelector
        selectedModel={selectedModel}
        onModelChange={onModelChange}
      />
    );
  }

  return (
    <ModelDropdown
      chatProviderName={chatProviderName}
      selectedModel={selectedModel}
      onModelChange={onModelChange}
    />
  );
}

const TIER_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  fast: Zap,
  smart: Sparkles,
  premium: Crown,
};

function TierSelector({
  selectedModel,
  onModelChange,
}: {
  selectedModel: string | null;
  onModelChange: (modelId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const autoSelectedRef = useRef(false);
  useEffect(() => {
    if (!selectedModel && !autoSelectedRef.current) {
      autoSelectedRef.current = true;
      const defaultTier = ACTIVEPIECES_CHAT_TIERS.find(
        (tier) => tier.id === DEFAULT_CHAT_TIER_ID,
      );
      if (defaultTier) {
        onModelChange(defaultTier.modelId);
      }
    }
  }, [selectedModel, onModelChange]);

  const selectedTier = ACTIVEPIECES_CHAT_TIERS.find(
    (tier) => tier.modelId === selectedModel,
  );
  const SelectedIcon = selectedTier
    ? TIER_ICONS[selectedTier.id]
    : TIER_ICONS.smart;

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
          {SelectedIcon && <SelectedIcon className="size-3" />}
          <span>{selectedTier ? t(selectedTier.label) : t('Smart')}</span>
          <ChevronDown className="size-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-40" align="start">
        <Command>
          <CommandGroup>
            {ACTIVEPIECES_CHAT_TIERS.map((tier) => {
              const Icon = TIER_ICONS[tier.id];
              return (
                <CommandItem
                  key={tier.id}
                  value={tier.id}
                  onSelect={() => {
                    onModelChange(tier.modelId);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  {Icon && <Icon className="size-3.5" />}
                  <span className="flex-1">{t(tier.label)}</span>
                  <Check
                    className={cn(
                      'ml-auto size-4',
                      selectedModel === tier.modelId
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                  />
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ModelDropdown({
  chatProviderName,
  selectedModel,
  onModelChange,
}: ChatModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: models = [], isLoading } =
    aiModelHooks.useGetModelsForProvider(chatProviderName);

  const autoSelectedRef = useRef(false);
  useEffect(() => {
    if (!selectedModel && models.length > 0 && !autoSelectedRef.current) {
      autoSelectedRef.current = true;
      onModelChange(models[0].id);
    }
  }, [selectedModel, models, onModelChange]);

  const selectedModelName =
    models.find((m) => m.id === selectedModel)?.name ?? selectedModel;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className="h-7 gap-1 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground"
          disabled={isLoading || models.length === 0}
        >
          {isLoading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : selectedModel ? (
            <span className="max-w-[140px] truncate">{selectedModelName}</span>
          ) : (
            <span>{t('Model')}</span>
          )}
          <ChevronDown className="size-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-64" align="start">
        <Command>
          <CommandInput placeholder={t('Search models...')} />
          <CommandEmpty>{t('No model found.')}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {models.map((model) => (
              <CommandItem
                key={model.id}
                value={model.id}
                onSelect={() => {
                  onModelChange(model.id);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <span className="flex-1 truncate">{model.name}</span>
                <Check
                  className={cn(
                    'ml-auto size-4',
                    selectedModel === model.id ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type ChatModelSelectorProps = {
  chatProviderName?: AIProviderName;
  selectedModel: string | null;
  onModelChange: (modelId: string) => void;
};
