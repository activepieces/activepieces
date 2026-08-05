import { t } from 'i18next';
import { Check, ChevronsUpDown, Layers } from 'lucide-react';
import { useState } from 'react';

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
import { Button } from '@/components/ui/button';
import { SUPPORTED_AI_PROVIDERS } from '@/features/agents/ai-providers';
import { TIER_CONFIG } from '@/features/agents/tier-config';
import { cn } from '@/lib/utils';

import { AiModelFacts, ModelFactsRow } from './model-facts-row';

export function TierModelPicker({
  tiers,
  models,
  disabledModels = {},
  value,
  onChange,
  disabled = false,
  compact = false,
}: TierModelPickerProps) {
  const [open, setOpen] = useState(false);
  const selectedTier =
    value?.kind === 'tier'
      ? tiers.find((tier) => tier.id === value.id)
      : undefined;
  const selectedModel =
    value?.kind === 'model'
      ? models.find((model) => model.id === value.id)
      : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', {
            'h-8 text-xs': compact,
          })}
        >
          {selectedTier ? (
            <span className="flex items-center gap-2 min-w-0">
              <TierIcon tierId={selectedTier.id} className="size-4 shrink-0" />
              <span className="truncate">{selectedTier.name}</span>
            </span>
          ) : selectedModel ? (
            <span className="flex items-center gap-2 min-w-0">
              {providerLogoOf({ provider: selectedModel.provider }) && (
                <img
                  src={providerLogoOf({ provider: selectedModel.provider })}
                  alt={selectedModel.provider}
                  className="size-4 object-contain shrink-0"
                />
              )}
              <span className="truncate">{selectedModel.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              {t('Select a tier or model')}
            </span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-96" align="start">
        <Command>
          <CommandInput placeholder={t('Search tiers and models...')} />
          <CommandEmpty>{t('Nothing found.')}</CommandEmpty>
          <div className="max-h-80 overflow-auto">
            {tiers.length > 0 && (
            <CommandGroup heading={t('Tiers (recommended)')}>
              {tiers.map((tier) => (
                <CommandItem
                  key={tier.id}
                  value={`tier-${tier.id} ${tier.name}`}
                  onSelect={() => {
                    onChange({ kind: 'tier', id: tier.id });
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <TierIcon
                    tierId={tier.id}
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm">{tier.name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {tier.description}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      'ml-auto size-4 shrink-0',
                      value?.kind === 'tier' && value.id === tier.id
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            )}
            <CommandGroup
              heading={
                tiers.length > 0 ? t('Specific model (advanced)') : t('Models')
              }
            >
              {models.map((model) => {
                const disabledReason = disabledModels[model.id];
                return (
                  <CommandItem
                    key={`${model.provider}-${model.id}`}
                    value={`model-${model.id} ${model.name}`}
                    disabled={disabledReason !== undefined}
                    onSelect={() => {
                      onChange({ kind: 'model', id: model.id });
                      setOpen(false);
                    }}
                    className={cn('cursor-pointer items-start', {
                      'opacity-60': disabledReason !== undefined,
                    })}
                  >
                    {providerLogoOf({ provider: model.provider }) && (
                      <img
                        src={providerLogoOf({ provider: model.provider })}
                        alt={model.provider}
                        className="size-4 object-contain shrink-0 mt-0.5"
                      />
                    )}
                    <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                      <span className="text-sm">{model.name}</span>
                      {disabledReason === undefined ? (
                        <ModelFactsRow model={model} />
                      ) : (
                        <span className="text-xs text-destructive">
                          {disabledReason}
                        </span>
                      )}
                    </div>
                    <Check
                      className={cn(
                        'ml-auto size-4 shrink-0',
                        value?.kind === 'model' && value.id === model.id
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function TierIcon({
  tierId,
  className,
}: {
  tierId: string;
  className?: string;
}) {
  const builtIn = Object.entries(TIER_CONFIG).find(([key]) => key === tierId);
  const Icon = builtIn ? builtIn[1].icon : Layers;
  return <Icon className={className} />;
}

function providerLogoOf({ provider }: { provider: string }): string | undefined {
  if (provider === 'activepieces') {
    return 'https://cdn.activepieces.com/pieces/activepieces.png';
  }
  return SUPPORTED_AI_PROVIDERS.find(
    (candidate) => candidate.provider === provider,
  )?.logoUrl;
}

export type TierOption = {
  id: string;
  name: string;
  description: string;
};

export type TierModelValue =
  | { kind: 'tier'; id: string }
  | { kind: 'model'; id: string };

export type TierModelPickerProps = {
  tiers: TierOption[];
  models: AiModelFacts[];
  disabledModels?: Record<string, string>;
  value: TierModelValue | null;
  onChange: (value: TierModelValue) => void;
  disabled?: boolean;
  compact?: boolean;
};
