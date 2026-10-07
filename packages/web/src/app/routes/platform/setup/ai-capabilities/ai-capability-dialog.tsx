import { isNil } from '@activepieces/core-utils';
import {
  AIProviderModelType,
  AiProviderToolConfig,
  AIProviderWithoutSensitiveData,
  AiToolCapability,
  AiToolConfigWithoutSensitiveData,
  AiToolProvider,
  CreateAiToolConfigRequest,
  formErrors,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  aiProviderQueries,
  aiToolConfigMutations,
} from '@/features/platform-admin';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { aiCapabilitySources, AiToolCapabilityInfo } from './catalog';

const formSchema = z.object({
  source: z.string().min(1, formErrors.required),
  apiKey: z.string(),
  modelId: z.string(),
});
type FormValues = z.infer<typeof formSchema>;

export function AiCapabilityDialog({
  capabilityInfo,
  existingConfig,
  defaultProviderId,
  onSaved,
  children,
}: {
  capabilityInfo: AiToolCapabilityInfo;
  existingConfig?: AiToolConfigWithoutSensitiveData;
  defaultProviderId?: string;
  onSaved: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <CapabilityForm
          key={open ? 'open' : 'closed'}
          capabilityInfo={capabilityInfo}
          existingConfig={existingConfig}
          defaultProviderId={defaultProviderId}
          onClose={() => setOpen(false)}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}

function CapabilityForm({
  capabilityInfo,
  existingConfig,
  defaultProviderId,
  onClose,
  onSaved,
}: {
  capabilityInfo: AiToolCapabilityInfo;
  existingConfig?: AiToolConfigWithoutSensitiveData;
  defaultProviderId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { data: providers = [] } = aiProviderQueries.useAiProviderConfigs();
  const aiProviders = aiCapabilitySources.eligibleProviders({
    capability: capabilityInfo.capability,
    providers,
  });
  const existingChoice = AiProviderToolConfig.safeParse(existingConfig?.config);
  const needsModel =
    capabilityInfo.capability === AiToolCapability.IMAGE_GENERATION;
  const savedKeyProvider = existingConfig?.hasApiKey
    ? existingConfig.provider
    : undefined;
  const form = useForm<FormValues>({
    resolver: zodResolver(
      formSchema.superRefine((values, ctx) => {
        const aiSource = aiProviders.some((p) => p.id === values.source);
        const keepsSavedKey = values.source === savedKeyProvider;
        if (!aiSource && !keepsSavedKey && values.apiKey.length === 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['apiKey'],
            message: formErrors.required,
          });
        }
        if (aiSource && needsModel && values.modelId.length === 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['modelId'],
            message: formErrors.required,
          });
        }
      }),
    ),
    mode: 'onChange',
    defaultValues: {
      source: pickDefaultSource({
        preferred: existingChoice.success
          ? existingChoice.data.aiProviderId
          : existingConfig?.provider ?? defaultProviderId,
        sourceIds: [
          ...aiProviders.map((p) => p.id),
          ...capabilityInfo.providers.map((p) => p.id),
        ],
        fallback: capabilityInfo.providers[0].id,
      }),
      apiKey: '',
      modelId: existingChoice.success ? existingChoice.data.modelId ?? '' : '',
    },
  });
  const source = form.watch('source');
  const selectedAiProvider = aiProviders.find((p) => p.id === source);
  const { data: models = [] } = aiProviderQueries.useConfigModels(
    needsModel ? selectedAiProvider?.id : undefined,
  );
  const imageModels = isNil(selectedAiProvider)
    ? []
    : models.filter(
        (model) =>
          model.type === AIProviderModelType.IMAGE &&
          modelAllowed({ model, provider: selectedAiProvider }),
      );

  const selectedModel = imageModels.find(
    (model) => model.id === form.watch('modelId'),
  );

  const saveCallbacks: SaveCallbacks = {
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (error) => {
      form.setError('root.serverError', {
        type: 'manual',
        message:
          error.response?.data?.params?.message ??
          error.response?.data?.message ??
          t('Failed to save. Please check the API key and try again.'),
      });
    },
  };
  const { mutate, isPending } =
    aiToolConfigMutations.useUpsertAiToolConfig(saveCallbacks);
  const { mutate: reenable, isPending: isReenabling } =
    aiToolConfigMutations.useUpdateAiToolConfig(saveCallbacks);

  const handleSubmit = (values: FormValues) => {
    form.clearErrors('root.serverError');
    const reusesSavedKey =
      !isNil(existingConfig) &&
      values.source === savedKeyProvider &&
      values.apiKey.length === 0;
    if (reusesSavedKey) {
      reenable({ id: existingConfig.id, request: { enabled: true } });
      return;
    }
    const request: CreateAiToolConfigRequest = isNil(selectedAiProvider)
      ? {
          capability: capabilityInfo.capability,
          provider: z.enum(AiToolProvider).parse(values.source),
          auth: { apiKey: values.apiKey },
          enabled: true,
        }
      : {
          capability: capabilityInfo.capability,
          provider: AiToolProvider.AI_PROVIDER,
          config: {
            aiProviderId: selectedAiProvider.id,
            ...(needsModel ? { modelId: values.modelId } : {}),
          },
          enabled: true,
        };
    mutate(request);
  };

  const selectedProvider = capabilityInfo.providers.find(
    (p) => p.id === source,
  );
  const sourceCount = aiProviders.length + capabilityInfo.providers.length;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <DialogHeader>
          <DialogTitle>{capabilityInfo.name}</DialogTitle>
          <DialogDescription>{capabilityInfo.description}</DialogDescription>
        </DialogHeader>

        {sourceCount > 1 && (
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Source')}</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue('modelId', '');
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {aiProviders.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                    {capabilityInfo.providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedAiProvider && needsModel && (
          <FormField
            control={form.control}
            name="modelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Image model')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('Choose a model')}>
                        {selectedModel && (
                          <span className="flex min-w-0 items-baseline gap-2">
                            <span className="truncate">
                              {selectedModel.name}
                            </span>
                            <span className="truncate text-xs text-gray-11">
                              {selectedModel.id}
                            </span>
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {imageModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <span className="flex flex-col">
                          <span>{model.name}</span>
                          <span className="text-xs text-gray-11">
                            {model.id}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {!selectedAiProvider && (
          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('API Key')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    autoComplete="off"
                    placeholder={
                      source === savedKeyProvider
                        ? t('Enter a new key to replace the saved one')
                        : t('Paste your API key')
                    }
                  />
                </FormControl>
                {selectedProvider && (
                  <a
                    href={selectedProvider.signupUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-gray-11 hover:underline"
                    {...adminControl(AdminControl.AI_API_KEY_LINK)}
                  >
                    {t('Get a {provider} API key', {
                      provider: selectedProvider.name,
                    })}
                    <ExternalLink className="size-3" />
                  </a>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {form.formState.errors.root?.serverError && (
          <p className="text-sm text-danger-11">
            {form.formState.errors.root.serverError.message}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button
            type="submit"
            loading={isPending || isReenabling}
            {...adminControl(AdminControl.AI_CAPABILITY_SUBMIT)}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function pickDefaultSource({
  preferred,
  sourceIds,
  fallback,
}: {
  preferred: string | undefined;
  sourceIds: string[];
  fallback: string;
}): string {
  return !isNil(preferred) && sourceIds.includes(preferred)
    ? preferred
    : fallback;
}

function modelAllowed({
  model,
  provider,
}: {
  model: { id: string };
  provider: AIProviderWithoutSensitiveData;
}): boolean {
  return (
    provider.modelScope !== 'selected' || provider.modelIds.includes(model.id)
  );
}

type SaveCallbacks = Parameters<
  typeof aiToolConfigMutations.useUpsertAiToolConfig
>[0];
