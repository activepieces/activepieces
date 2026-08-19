import { AIProviderName } from '@activepieces/core-utils';
import { t } from 'i18next';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import * as React from 'react';

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
import { SUPPORTED_AI_PROVIDERS } from '@/features/agents/ai-providers';
import { cn } from '@/lib/utils';

import { aiModelHooks } from './hooks';

export const PROVIDER_EMBEDDING_MODELS: Partial<
  Record<AIProviderName, string>
> = {
  [AIProviderName.OPENAI]: 'text-embedding-3-small',
  [AIProviderName.GOOGLE]: 'text-embedding-004',
  [AIProviderName.AZURE]: 'text-embedding-3-small',
  [AIProviderName.ACTIVEPIECES]: 'text-embedding-3-small',
  [AIProviderName.OPENROUTER]: 'openai/text-embedding-3-small',
};

type AIModelSelectorProps = {
  defaultProvider?: AIProviderName;
  defaultModel?: string;
  defaultConfigId?: string;
  disabled?: boolean;
  onChange: (value: {
    provider?: string;
    model?: string;
    configId?: string;
  }) => void;
};

const ACTIVEPIECES_PROVIDER_CONFIG = {
  provider: AIProviderName.ACTIVEPIECES,
  name: 'Activepieces',
  markdown: '',
  logoUrl: 'https://cdn.activepieces.com/pieces/activepieces.png',
};

const ALL_PROVIDERS = [...SUPPORTED_AI_PROVIDERS, ACTIVEPIECES_PROVIDER_CONFIG];

export function AIModelSelector({
  defaultProvider,
  defaultModel,
  defaultConfigId,
  disabled = false,
  onChange,
}: AIModelSelectorProps) {
  const [providerOpen, setProviderOpen] = React.useState(false);
  const [modelOpen, setModelOpen] = React.useState(false);
  const [configOpen, setConfigOpen] = React.useState(false);
  const [selectedProvider, setSelectedProvider] = React.useState<
    AIProviderName | undefined
  >(defaultProvider);
  const [selectedModel, setSelectedModel] = React.useState<string | undefined>(
    defaultModel,
  );
  const [selectedConfigId, setSelectedConfigId] = React.useState<
    string | undefined
  >(defaultConfigId);

  const { data: providers = [], isLoading: providersLoading } =
    aiModelHooks.useListProviders();
  const { data: models = [], isLoading: modelsLoading } =
    aiModelHooks.useGetModelsForProvider(selectedProvider, selectedConfigId);

  const providerKeys =
    providers.find((p) => p.provider === selectedProvider)?.keys ?? [];

  const getProviderLogo = React.useCallback((providerName: string) => {
    return ALL_PROVIDERS.find((p) => p.provider === providerName)?.logoUrl;
  }, []);

  const getProviderName = React.useCallback(
    (providerName: string) => {
      return (
        providers.find((p) => p.provider === providerName)?.name ?? providerName
      );
    },
    [providers],
  );

  const activepiecesProvider = React.useMemo(
    () => providers.find((p) => p.provider === AIProviderName.ACTIVEPIECES),
    [providers],
  );

  const sortedProviders = React.useMemo(() => {
    return [...providers].sort((a, b) => {
      if (a.provider === AIProviderName.ACTIVEPIECES) return -1;
      if (b.provider === AIProviderName.ACTIVEPIECES) return 1;
      return 0;
    });
  }, [providers]);

  React.useEffect(() => {
    if (!selectedProvider && !providersLoading && providers.length > 0) {
      const preferred =
        activepiecesProvider?.provider || providers[0]?.provider;
      if (preferred) {
        setSelectedProvider(preferred as AIProviderName);
      }
    }
  }, [providers, providersLoading, selectedProvider, activepiecesProvider]);

  React.useEffect(() => {
    if (
      selectedProvider &&
      models.length > 0 &&
      !selectedModel &&
      !modelsLoading
    ) {
      const firstModel = models[0].id;
      setSelectedModel(firstModel);
      onChange({
        provider: selectedProvider,
        model: firstModel,
        configId: selectedConfigId,
      });
    }
  }, [
    models,
    modelsLoading,
    selectedProvider,
    selectedModel,
    selectedConfigId,
    onChange,
  ]);

  React.useEffect(() => {
    if (
      selectedModel &&
      selectedModel !== defaultModel &&
      models.length > 0 &&
      !models.some((m) => m.id === selectedModel)
    ) {
      const fallback = models[0]?.id;
      setSelectedModel(fallback);
      onChange({
        provider: selectedProvider,
        model: fallback,
        configId: selectedConfigId,
      });
    }
  }, [
    models,
    selectedModel,
    selectedProvider,
    selectedConfigId,
    onChange,
    defaultModel,
  ]);

  const handleProviderChange = (provider: AIProviderName) => {
    setSelectedProvider(provider);
    setSelectedModel(undefined);
    setSelectedConfigId(undefined);
    onChange({ provider, model: undefined, configId: undefined });
    setProviderOpen(false);
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    onChange({
      provider: selectedProvider,
      model: modelId,
      configId: selectedConfigId,
    });
    setModelOpen(false);
  };

  const handleConfigChange = (configId?: string) => {
    setSelectedConfigId(configId);
    setSelectedModel(undefined);
    onChange({ provider: selectedProvider, model: undefined, configId });
    setConfigOpen(false);
  };

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium">{t('AI Model *')}</h2>

      <div className="flex items-stretch border rounded-md bg-background overflow-hidden">
        <Popover open={providerOpen} onOpenChange={setProviderOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={providerOpen}
              className="flex-1 justify-between border-0 rounded-none focus-visible:ring-1 focus-visible:ring-offset-0 max-w-72 h-auto"
              disabled={disabled || providersLoading || providers.length === 0}
            >
              {providersLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('Loading...')}</span>
                </div>
              ) : selectedProvider ? (
                <div className="flex items-center gap-2">
                  {getProviderLogo(selectedProvider) && (
                    <img
                      src={getProviderLogo(selectedProvider)}
                      alt={selectedProvider}
                      className="h-4 w-4 object-contain"
                    />
                  )}
                  <span className="truncate">
                    {getProviderName(selectedProvider)}
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground">
                  {providers.length === 0
                    ? t('No providers')
                    : t('Select provider')}
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 w-[var(--radix-popover-trigger-width)]"
            align="start"
          >
            <Command>
              <CommandInput placeholder={t('Search providers...')} />
              <CommandEmpty>{t('No provider found.')}</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {sortedProviders.map((provider) => (
                  <CommandItem
                    key={provider.provider}
                    value={provider.provider}
                    onSelect={() =>
                      handleProviderChange(provider.provider as AIProviderName)
                    }
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {getProviderLogo(provider.provider) && (
                        <img
                          src={getProviderLogo(provider.provider)}
                          alt={provider.provider}
                          className="h-4 w-4 object-contain"
                        />
                      )}
                      <span>{provider.name}</span>
                    </div>
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4',
                        selectedProvider === provider.provider
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="w-px bg-border self-stretch" />

        <Popover open={modelOpen} onOpenChange={setModelOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={modelOpen}
              className="flex-1 justify-between border-0 rounded-none focus-visible:ring-1 focus-visible:ring-offset-0 min-w-32 h-auto"
              disabled={
                disabled ||
                !selectedProvider ||
                modelsLoading ||
                models.length === 0
              }
            >
              {modelsLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('Loading...')}</span>
                </div>
              ) : selectedModel ? (
                <span className="truncate">
                  {models.find((m) => m.id === selectedModel)?.name ??
                    selectedModel}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {!selectedProvider
                    ? t('Select provider first')
                    : models.length === 0
                    ? t('No models')
                    : t('Select model')}
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 w-[var(--radix-popover-trigger-width)]"
            align="start"
          >
            <Command>
              <CommandInput placeholder={t('Search models...')} />
              <CommandEmpty>{t('No model found.')}</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {models.map((model) => (
                  <CommandItem
                    key={model.id}
                    value={model.id}
                    onSelect={() => handleModelChange(model.id)}
                    className="cursor-pointer"
                  >
                    <span className="flex-1">{model.name}</span>
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4',
                        selectedModel === model.id
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {providerKeys.length > 1 && (
        <Popover open={configOpen} onOpenChange={setConfigOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={configOpen}
              className="w-full justify-between h-auto"
              disabled={disabled}
            >
              <span
                className={cn('truncate', {
                  'text-muted-foreground': !selectedConfigId,
                })}
              >
                {providerKeys.find((key) => key.id === selectedConfigId)
                  ?.name ?? t('Automatic')}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 w-[var(--radix-popover-trigger-width)]"
            align="start"
          >
            <Command>
              <CommandGroup className="max-h-64 overflow-auto">
                <CommandItem
                  value="automatic"
                  onSelect={() => handleConfigChange(undefined)}
                  className="cursor-pointer"
                >
                  <span className="flex-1">{t('Automatic')}</span>
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      !selectedConfigId ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
                {providerKeys.map((key) => (
                  <CommandItem
                    key={key.id}
                    value={key.id}
                    onSelect={() => handleConfigChange(key.id)}
                    className="cursor-pointer"
                  >
                    <span className="flex-1">{key.name}</span>
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4',
                        selectedConfigId === key.id
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {selectedProvider && (
        <p className="text-xs text-muted-foreground">
          {PROVIDER_EMBEDDING_MODELS[selectedProvider]
            ? t('Embedding model for knowledge base: {model}', {
                model: PROVIDER_EMBEDDING_MODELS[selectedProvider],
              })
            : t('This provider does not support knowledge base embeddings.')}
        </p>
      )}
    </div>
  );
}
