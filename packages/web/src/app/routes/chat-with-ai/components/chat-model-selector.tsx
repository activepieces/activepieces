import { ACTIVEPIECES_CHAT_TIERS } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronDown, Crown, Sparkles, Zap } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const TIER_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  fast: Zap,
  smart: Sparkles,
  premium: Crown,
};

export function ChatModelSelector({
  selectedModel,
  onModelChange,
}: {
  selectedModel: string | null;
  onModelChange: (modelId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const selectedTier = ACTIVEPIECES_CHAT_TIERS.find(
    (tier) => tier.id === selectedModel,
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
                    onModelChange(tier.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  {Icon && <Icon className="size-3.5" />}
                  <span className="flex-1">{t(tier.label)}</span>
                  <Check
                    className={cn(
                      'ml-auto size-4',
                      selectedModel === tier.id ? 'opacity-100' : 'opacity-0',
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
