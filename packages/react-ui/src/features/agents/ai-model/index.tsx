import { t } from 'i18next';
import * as React from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

  const [selectedProvider, setSelectedProvider] = React.useState<
    AIProviderName | undefined
  >(defaultProvider);

  const [selectedModel, setSelectedModel] = React.useState<string | undefined>(
    defaultModel,
  );

  const getProviderLogo = (providerName: string) => {
    return SUPPORTED_AI_PROVIDERS.find((p) => p.provider === providerName)
      ?.logoUrl;
  };

  const { data: models = [], isLoading: modelsLoading } =
    aiModelHooks.useGetModelsForProvider(selectedProvider);

  const activepiecesProvider = React.useMemo(
    () => providers.find((p) => p.provider === AIProviderName.ACTIVEPIECES),
    [providers],
  );

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
      onChange({ provider: selectedProvider, model: firstModel });
    }
  }, [models, modelsLoading, selectedProvider, selectedModel, onChange]);

  React.useEffect(() => {
    if (
      selectedModel &&
      models.length > 0 &&
      !models.some((m) => m.id === selectedModel)
    ) {
      const fallback = models[0]?.id;
      setSelectedModel(fallback);
      onChange({ provider: selectedProvider, model: fallback });
    }
  }, [models, selectedModel, selectedProvider, onChange]);

  const isLoading = providersLoading || modelsLoading;
  const hasProviders = providers.length > 0;
  const hasModels = models.length > 0;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium">{t('AI Model *')}</h2>

      <div className="flex items-center border rounded-md bg-background">
        <Select
          value={selectedProvider}
          onValueChange={(value) => {
            const provider = value as AIProviderName;
            setSelectedProvider(provider);
            setSelectedModel(undefined); // reset model when provider changes
            onChange({ provider, model: undefined });
          }}
          disabled={isLoading || !hasProviders || disabled}
        >
          <SelectTrigger className="border-0 focus:ring-0 rounded-none rounded-l-md max-w-72">
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
                    {providers.find((p) => p.provider === selectedProvider)
                      ?.name ?? selectedProvider}
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
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t('No providers configured')}
              </div>
            )}
          </SelectContent>
        </Select>

        <div className="h-8 w-px bg-border" />

        <Select
          value={selectedModel}
          onValueChange={(value) => {
            setSelectedModel(value);
            onChange({ provider: selectedProvider, model: value });
          }}
          disabled={isLoading || !selectedProvider || !hasModels || disabled}
        >
          <SelectTrigger className="border-0 focus:ring-0 rounded-none rounded-r-md min-w-28">
            <SelectValue
              placeholder={
                modelsLoading
                  ? 'Loading models...'
                  : !selectedProvider
                  ? 'Select provider first'
                  : !hasModels
                  ? 'No models available'
                  : 'Select model...'
              }
            />
          </SelectTrigger>

          <SelectContent>
            {hasModels ? (
              models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("This provider doesn't have any models configured yet")}
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
