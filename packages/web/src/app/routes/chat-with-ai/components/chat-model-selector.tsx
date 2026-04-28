import { AIProviderName, isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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

function useChatModels() {
  const { data: providers = [], isLoading: providersLoading } =
    aiModelHooks.useListProviders();

  const provider = useMemo(
    () => providers.find((p) => p.provider === AIProviderName.ACTIVEPIECES),
    [providers],
  );

  const { data: models = [], isLoading: modelsLoading } =
    aiModelHooks.useGetModelsForProvider(provider?.provider);

  return { models, isLoading: providersLoading || modelsLoading };
}

function ChatModelSelector({ value, onChange, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const { models, isLoading } = useChatModels();

  useEffect(() => {
    if (!isLoading && models.length > 0 && isNil(value) && !disabled) {
      onChange(models[0].id);
    }
  }, [isLoading, models, value, disabled, onChange]);

  const selectedModel = models.find((m) => m.id === value);
  const displayName = selectedModel?.name ?? value ?? t('Select model');

  if (disabled && value) {
    return (
      <span className="text-xs text-muted-foreground px-1">{displayName}</span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading || models.length === 0}
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors',
            'text-muted-foreground hover:text-foreground hover:bg-muted',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          <span className="max-w-[140px] truncate">{displayName}</span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-64" align="start" side="top">
        <Command>
          <CommandInput placeholder={t('Search models...')} />
          <CommandEmpty>{t('No model found.')}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {models.map((model) => (
              <CommandItem
                key={model.id}
                value={model.id}
                onSelect={() => {
                  onChange(model.id);
                  setOpen(false);
                }}
                className="cursor-pointer text-xs"
              >
                <span className="flex-1 truncate">{model.name}</span>
                <Check
                  className={cn(
                    'ml-auto h-3.5 w-3.5',
                    value === model.id ? 'opacity-100' : 'opacity-0',
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

type Props = {
  value: string | null;
  onChange: (model: string) => void;
  disabled?: boolean;
};

export { ChatModelSelector };
