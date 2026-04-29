import { AIProviderName } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
