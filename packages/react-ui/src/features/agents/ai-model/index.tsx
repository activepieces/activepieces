import { t } from 'i18next';
import { Check, ChevronsUpDown, Inbox, AlertCircle } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { AIProviderName, SUPPORTED_AI_PROVIDERS } from '@activepieces/shared';

import { aiModelHooks } from './hooks';

type AIModelSelectorProps = {
  defaultProvider?: AIProviderName;
  defaultModel?: string;
  disabled: boolean;
  onChange: (value: { provider?: string; model?: string }) => void;
};

export function AIModelSelector({
  defaultProvider,
  defaultModel,
  disabled,
  onChange,
}: AIModelSelectorProps) {
  const { data: providers = [], isLoading: providersLoading } =
    aiModelHooks.useListProviders();

  const getProviderLogo = (providerName: string) => {
    const info = SUPPORTED_AI_PROVIDERS.find(
      (p) => p.provider === providerName,
    );
    return info?.logoUrl;
  };

  const activepiecesProvider = React.useMemo(
    () => providers.find((p) => p.provider === AIProviderName.ACTIVEPIECES),
    [providers],
  );

  const [selectedProvider, setSelectedProvider] = React.useState<
    AIProviderName | undefined
  >(defaultProvider);

  const { data: models = [], isLoading: modelsLoading } =
    aiModelHooks.useGetModelsForProvider(selectedProvider);

  const [selectedModel, setSelectedModel] = React.useState<string | undefined>(
    defaultModel,
  );

  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (
      !defaultProvider &&
      !selectedProvider &&
      activepiecesProvider &&
      !providersLoading
    ) {
      setSelectedProvider(activepiecesProvider.provider);
    }
  }, [
    activepiecesProvider,
    defaultProvider,
    selectedProvider,
    providersLoading,
  ]);

  React.useEffect(() => {
    if (
      selectedProvider === AIProviderName.ACTIVEPIECES &&
      !selectedModel &&
      models.length > 0 &&
      !modelsLoading
    ) {
      const firstModel = models[0].id;
      setSelectedModel(firstModel);
      onChange({ provider: selectedProvider, model: firstModel });
    }
  }, [selectedProvider, models, selectedModel, modelsLoading, onChange]);

  React.useEffect(() => {
    if (
      selectedModel &&
      models.length > 0 &&
      !models.some((m) => m.id === selectedModel)
    ) {
      const fallback = models[0]?.id || undefined;
      setSelectedModel(fallback);
      onChange({ provider: selectedProvider, model: fallback });
    }
  }, [selectedProvider, models, selectedModel, onChange]);

  const isLoading = providersLoading || modelsLoading;
  const hasProviders = providers.length > 0;
  const hasModels = models.length > 0;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium">{t('AI Model *')}</h2>
      <div className="flex items-center border rounded-md bg-background min-w-[340px] md:min-w-[420px]">
        <Select
          value={selectedProvider}
          onValueChange={(value) => {
            setSelectedProvider(value as AIProviderName);
            onChange({ provider: value, model: selectedModel });
          }}
          disabled={isLoading || !hasProviders}
        >
          <SelectTrigger
            disabled={disabled}
            className="border-0 focus:ring-0 rounded-none rounded-l-md w-[140px] md:w-[180px]"
          >
            <SelectValue
              placeholder={
                providersLoading
                  ? 'Loading...'
                  : !hasProviders
                  ? 'No providers'
                  : 'Select provider'
              }
            >
              {selectedProvider && (
                <div className="flex items-center gap-2">
                  {getProviderLogo(selectedProvider) && (
                    <img
                      src={getProviderLogo(selectedProvider)}
                      alt={selectedProvider}
                      className="h-4 w-4 object-contain"
                    />
                  )}
                  <span>
                    {
                      providers.find((p) => p.provider === selectedProvider)
                        ?.name
                    }
                  </span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {hasProviders ? (
              [...providers]
                .sort((a, b) => {
                  if (a.provider === AIProviderName.ACTIVEPIECES) return -1;
                  if (b.provider === AIProviderName.ACTIVEPIECES) return 1;
                  return 0;
                })
                .map((provider) => (
                  <SelectItem key={provider.id} value={provider.provider}>
                    <div className="flex items-center gap-2">
                      {getProviderLogo(provider.provider) && (
                        <img
                          src={getProviderLogo(provider.provider)}
                          alt=""
                          className="h-4 w-4 object-contain"
                        />
                      )}
                      <span>{provider.name}</span>
                    </div>
                  </SelectItem>
                ))
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">
                  {t('No providers configured')}
                </p>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  {t('Configure at least one AI provider to get started')}
                </p>
              </div>
            )}
          </SelectContent>
        </Select>

        <div className="h-8 w-px bg-border" />

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger disabled={disabled} asChild>
            <Button
              variant="ghost"
              role="combobox"
              aria-expanded={open}
              disabled={isLoading || !selectedProvider || !hasModels}
              className={cn(
                'justify-between rounded-none rounded-r-md px-3 flex-1 font-normal',
                !selectedModel && 'text-muted-foreground',
              )}
            >
              {modelsLoading
                ? 'Loading models...'
                : selectedModel
                ? models.find((m) => m.id === selectedModel)?.name ||
                  selectedModel
                : !selectedProvider
                ? 'Select provider first'
                : !hasModels
                ? 'No models available'
                : 'Select model...'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-(--radix-popover-trigger-width) p-0"
            align="start"
          >
            <Command>
              <CommandInput placeholder="Search model..." className="h-9" />
              <CommandList>
                <CommandEmpty>{t('No model found.')}</CommandEmpty>
                <CommandGroup>
                  {hasModels ? (
                    models.map((model) => {
                      return (
                        <CommandItem
                          key={model.id}
                          value={model.id}
                          onSelect={(currentValue) => {
                            setSelectedModel(currentValue);
                            onChange({
                              provider: selectedProvider,
                              model: currentValue,
                            });
                            setOpen(false);
                          }}
                        >
                          {model.name}
                          <Check
                            className={cn(
                              'ml-auto h-4 w-4',
                              selectedModel === model.id
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                        </CommandItem>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                      <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-2" />
                      <p className="text-sm font-medium text-foreground mb-1">
                        {t('No models available')}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-[220px]">
                        {t(
                          "This provider doesn't have any models configured yet",
                        )}
                      </p>
                    </div>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
