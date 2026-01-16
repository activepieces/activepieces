import { t } from 'i18next';
import { ExternalLink } from 'lucide-react';
import { useState } from 'react';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  AIProviderName,
  isNil,
  SUPPORTED_AI_PROVIDERS,
} from '@activepieces/shared';

import { aiModelHooks } from './hooks';

const activepiecesProvider = {
  provider: AIProviderName.ACTIVEPIECES,
  name: 'Activepieces',
  markdown: '',
  logoUrl: 'https://cdn.activepieces.com/pieces/activepieces.png',
};

type AIModelSelectorProps = {
  defaultProvider?: AIProviderName;
  defaultModel?: string;
  disabled?: boolean;
  onChange: (value: { provider?: string; model?: string }) => void;
};

export function AIModelSelector({
  defaultProvider,
  defaultModel,
  disabled = false,
  onChange,
}: AIModelSelectorProps) {
  const { data: configuredProviders = [], isLoading: providersLoading } =
    aiModelHooks.useListProviders();

  const [selectedProvider, setSelectedProvider] = useState<
    AIProviderName | undefined
  >(defaultProvider);

  const [selectedModel, setSelectedModel] = useState<string | undefined>(
    defaultModel,
  );

  const getSupportedProvidersList = () => {
    const apProviderAvailable = !isNil(
      configuredProviders.find(
        (p) => p.provider === AIProviderName.ACTIVEPIECES,
      ),
    );

    if (apProviderAvailable) {
      return [activepiecesProvider, ...SUPPORTED_AI_PROVIDERS];
    }

    return SUPPORTED_AI_PROVIDERS;
  };

  const modelsQueries = SUPPORTED_AI_PROVIDERS.map((provider) => {
    return aiModelHooks.useGetModelsForProvider(
      provider.provider as AIProviderName,
    );
  });

  const getProviderName = (providerName: string) => {
    return (
      SUPPORTED_AI_PROVIDERS.find((p) => p.provider === providerName)?.name ??
      providerName
    );
  };

  const isProviderConfigured = (providerName: string) => {
    return configuredProviders.some((p) => p.provider === providerName);
  };

  const getModelsForProvider = (providerName: string) => {
    const index = SUPPORTED_AI_PROVIDERS.findIndex(
      (p) => p.provider === providerName,
    );
    return index !== -1 ? modelsQueries[index]?.data ?? [] : [];
  };

  const getProviderLogo = (providerName: string) => {
    return SUPPORTED_AI_PROVIDERS.find((p) => p.provider === providerName)
      ?.logoUrl;
  };

  const handleModelSelect = (provider: string, model: string) => {
    setSelectedProvider(provider as AIProviderName);
    setSelectedModel(model);
    onChange({ provider, model });
  };

  const getSelectedLabel = () => {
    if (isNil(selectedProvider) || isNil(selectedModel)) {
      return t('Select model');
    }

    const providerName = getProviderName(selectedProvider);
    const providerLogo = getProviderLogo(selectedProvider);
    const models = getModelsForProvider(selectedProvider);
    const modelName =
      models.find((m) => m.id === selectedModel)?.name ?? selectedModel;

    return (
      <div className="flex items-center gap-2">
        {providerLogo && (
          <img
            src={providerLogo}
            alt={providerName}
            className="h-4 w-4 object-contain"
          />
        )}
        <span>{modelName}</span>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled || providersLoading}
            className="w-full justify-start text-left font-normal"
          >
            {getSelectedLabel()}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-64" align="start">
          <DropdownMenuGroup>
            {getSupportedProvidersList().map((provider, index) => {
              const isConfigured = isProviderConfigured(provider.provider);
              const models = getModelsForProvider(provider.provider);
              const isLoading = modelsQueries[index]?.isLoading;

              return (
                <DropdownMenuSub key={provider.provider}>
                  <DropdownMenuSubTrigger>
                    <div className="flex items-center gap-2">
                      {provider.logoUrl && (
                        <img
                          src={provider.logoUrl}
                          alt={provider.name}
                          className="h-4 w-4 object-contain"
                        />
                      )}
                      <span>{provider.name}</span>
                    </div>
                  </DropdownMenuSubTrigger>

                  <DropdownMenuSubContent className="w-56">
                    {isLoading ? (
                      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        {t('Loading models...')}
                      </div>
                    ) : !isConfigured || models.length === 0 ? (
                      <div>
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                          {t('Provider not configured')}
                        </div>
                        <DropdownMenuSeparator />
                        <a
                          href="/platform/setup/ai"
                          target="_blank"
                          className={cn(
                            buttonVariants({ variant: 'ghost', size: 'sm' }),
                            'w-full text-xs',
                          )}
                        >
                          {t('Configure provider')}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    ) : (
                      <DropdownMenuRadioGroup
                        value={
                          selectedProvider === provider.provider
                            ? selectedModel
                            : undefined
                        }
                      >
                        {models.map((model) => (
                          <DropdownMenuRadioItem
                            key={model.id}
                            value={model.id}
                            onClick={() =>
                              handleModelSelect(provider.provider, model.id)
                            }
                          >
                            {model.name}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
