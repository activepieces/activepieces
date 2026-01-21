import { t } from 'i18next';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { aiModelHooks } from '@/features/agents/ai-model/hooks';
import { chatHooks } from '@/features/chat-v2/lib/chat-hooks';
import { useChatSessionStore } from '@/features/chat-v2/store';
import { cn } from '@/lib/utils';
import {
  AIProviderName,
  DEFAULT_CHAT_MODEL,
  isNil,
  SUPPORTED_AI_PROVIDERS,
} from '@activepieces/shared';

const getProviderFromModelId = (modelId: string): string => {
  if (modelId.includes('/')) {
    return modelId.split('/')[0];
  }

  return AIProviderName.ACTIVEPIECES;
};

const getModelNameWithoutProvider = (modelName: string): string => {
  if (modelName.includes(':')) {
    return modelName.split(':')[1];
  }

  return modelName;
};

const getProviderLogo = (providerName: string) => {
  return SUPPORTED_AI_PROVIDERS.find((p) => p.provider === providerName)
    ?.logoUrl;
};

const getProviderName = (providerName: string) => {
  return (
    SUPPORTED_AI_PROVIDERS.find((p) => p.provider === providerName)?.name ??
    providerName
  );
};

export function AIModelSelector() {
  const [open, setOpen] = useState(false);
  const { session, setSession } = useChatSessionStore();

  const { mutate: updateChatModel } =
    chatHooks.useUpdateChatSession(setSession);

  const defaultModel = session?.modelId || DEFAULT_CHAT_MODEL;
  const [selectedModel, setSelectedModel] = useState<string | undefined>(
    defaultModel,
  );

  const { data: models = [], isLoading } = aiModelHooks.useGetModelsForProvider(
    AIProviderName.ACTIVEPIECES,
  );

  const groupedModels = models.reduce((acc, model) => {
    const provider = getProviderFromModelId(model.id);
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(model);
    return acc;
  }, {} as Record<string, typeof models>);

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    updateChatSession({
      update: { modelId },
      currentSession: isNil(session) ? null : session,
    });
    setOpen(false);
  };

  const getSelectedLabel = () => {
    if (isNil(selectedModel)) {
      return t('Select model');
    }

    const model = models.find((m) => m.id === selectedModel);
    if (!model) {
      return t('Select model');
    }

    const provider = getProviderFromModelId(model.id);
    const providerLogo = getProviderLogo(provider);

    return (
      <div className="flex items-center gap-2">
        {providerLogo && (
          <img src={providerLogo} alt="" className="h-4 w-4 object-contain" />
        )}
        <span>{getModelNameWithoutProvider(model.name)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        role="combobox"
        aria-expanded={open}
        disabled={isLoading}
      >
        {getSelectedLabel()}
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t('Search models...')} className="h-9" />
        <CommandList className="overflow-y-auto max-h-[300px]">
          <CommandEmpty>{t('No models found.')}</CommandEmpty>
          {Object.entries(groupedModels).map(
            ([provider, providerModels], index) => (
              <div key={provider}>
                {index > 0 && <CommandSeparator />}
                <CommandGroup
                  heading={
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">
                        {getProviderName(provider)}
                      </span>
                    </div>
                  }
                >
                  {providerModels.map((model) => (
                    <CommandItem
                      key={model.id}
                      value={model.name}
                      onSelect={() => handleModelSelect(model.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {getProviderLogo(provider) && (
                          <img
                            src={getProviderLogo(provider)}
                            alt=""
                            className="h-3 w-3 object-contain"
                          />
                        )}
                        <span>{model.name}</span>
                      </div>
                      <Check
                        className={cn(
                          'ml-auto size-3',
                          selectedModel === model.id
                            ? 'opacity-100'
                            : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            ),
          )}
        </CommandList>
      </CommandDialog>
    </div>
  );
}
