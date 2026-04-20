import {
  AIProviderAuthConfig,
  AIProviderConfig,
  AIProviderName,
  AnthropicProviderAuthConfig,
  AnthropicProviderConfig,
  AzureProviderAuthConfig,
  AzureProviderConfig,
  BedrockProviderAuthConfig,
  BedrockProviderConfig,
  CloudflareGatewayProviderAuthConfig,
  CloudflareGatewayProviderConfig,
  CreateAIProviderRequest,
  GoogleProviderAuthConfig,
  GoogleProviderConfig,
  isNil,
  OpenAICompatibleProviderAuthConfig,
  OpenAICompatibleProviderConfig,
  OpenAIProviderAuthConfig,
  OpenAIProviderConfig,
  UpdateAIProviderRequest,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { t } from 'i18next';
import { useMemo, useState } from 'react';
import {
  FieldErrors,
  Resolver,
  ResolverOptions,
  ResolverResult,
  useForm,
} from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
  FormControl,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import { aiProviderApi } from '@/features/platform-admin';

import { ApMarkdown } from '../../../../../../components/custom/markdown';

import { UpsertProviderConfigForm } from './upsert-provider-config-form';

type UpsertAIProviderDialogProps = {
  provider: AIProviderName;
  providerId?: string;
  config?: AIProviderConfig;
  children: React.ReactNode;
  onSave: () => void;
  defaultDisplayName?: string;
};

export const UpsertAIProviderDialog = (params: UpsertAIProviderDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
      }}
    >
      <UpsertAIProviderDialogContent
        key={open ? 'opened' : 'closed'}
        {...params}
        setOpen={setOpen}
      />
    </Dialog>
  );
};

export const UpsertAIProviderDialogContent = ({
  children,
  onSave,
  config,
  provider,
  providerId,
  defaultDisplayName = '',
  setOpen,
}: UpsertAIProviderDialogProps & { setOpen: (val: boolean) => void }) => {
  const currentProviderDef = useMemo(
    () => SUPPORTED_AI_PROVIDERS.find((p) => p.provider === provider)!,
    [provider],
  );

  const form = useForm<CreateAIProviderRequest>({
    resolver: ((
      values: CreateAIProviderRequest,
      context: unknown,
      options: ResolverOptions<CreateAIProviderRequest>,
    ) => {
      const originalResolve = zodResolver(
        createFormSchema(provider, !isNil(providerId)),
      ) as unknown as (
        values: CreateAIProviderRequest,
        context: unknown,
        options: ResolverOptions<CreateAIProviderRequest>,
      ) => Promise<ResolverResult<CreateAIProviderRequest>>;
      if (values.provider === AIProviderName.CLOUDFLARE_GATEWAY) {
        if (
          values.config.models.some((m) =>
            m.modelId.includes('google-vertex-ai'),
          )
        ) {
          const errors: FieldErrors<CreateAIProviderRequest> = {};
          if (
            isNil(values.config.vertexProject) ||
            values.config.vertexProject.trim().length === 0
          ) {
            errors.config = {
              vertexProject: {
                message: 'Required when using Google Vertex AI models',
                type: 'required',
              },
            };
          }
          if (
            isNil(values.config.vertexRegion) ||
            values.config.vertexRegion.trim().length === 0
          ) {
            errors.config = {
              ...errors.config,
              vertexRegion: {
                message: 'Required when using Google Vertex AI models',
                type: 'required',
              },
            };
          }
          if (Object.keys(errors).length > 0) {
            return {
              errors,
              values: {} as Record<string, never>,
            };
          }
        }
      }
      return originalResolve(values, context, options);
    }) as Resolver<CreateAIProviderRequest>,
    defaultValues: {
      provider,
      displayName: defaultDisplayName,
      config: config,
    } as CreateAIProviderRequest,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateAIProviderRequest): Promise<void> => {
      if (providerId) {
        const updateData: UpdateAIProviderRequest = {
          displayName: data.displayName,
          config: data.config,
          ...(hasAnyAuthFieldFilled(data.auth) ? { auth: data.auth } : {}),
        };
        return aiProviderApi.update(providerId, updateData);
      } else {
        return aiProviderApi.upsert(data);
      }
    },
    onSuccess: () => {
      setOpen(false);
      onSave();
    },
    onError: (
      error: AxiosError<{ message?: string; params?: { message: string } }>,
    ) => {
      const data = error.response?.data;

      form.setError('root.serverError', {
        type: 'manual',
        message:
          data?.message ?? data?.params?.message ?? JSON.stringify(error),
      });
    },
  });

  const handleSave = (data: CreateAIProviderRequest) => {
    mutate(data);
  };

  return (
    <>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {providerId ? t('Update AI Provider') : t('Add AI Provider')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            className="grid space-y-4"
            onSubmit={form.handleSubmit(handleSave)}
          >
            <ScrollArea viewPortClassName="max-h-[calc(70vh)] p-px">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem
                      className="space-y-3"
                      hidden={
                        currentProviderDef.provider !== AIProviderName.CUSTOM
                      }
                    >
                      <FormLabel>{t('Display Name')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={'My Provider'}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {currentProviderDef.markdown && (
                  <div className="text-sm text-muted-foreground">
                    <ApMarkdown
                      markdown={currentProviderDef.markdown}
                    ></ApMarkdown>
                  </div>
                )}

                <UpsertProviderConfigForm
                  form={form}
                  provider={provider}
                  apiKeyRequired={!config}
                  isLoading={isPending}
                  isEditMode={!!providerId}
                />

                {form.formState.errors.root?.serverError && (
                  <FormMessage>
                    {form.formState.errors.root.serverError.message}
                  </FormMessage>
                )}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button
                variant={'outline'}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setOpen(false);
                }}
                disabled={isPending}
              >
                {t('Cancel')}
              </Button>
              <Button disabled={isPending} loading={isPending} type="submit">
                {t('Save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </>
  );
};

const OptionalAuthSchema = z
  .object({
    apiKey: z.string().optional(),
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
  })
  .optional();

const createFormSchema = (provider: AIProviderName, editMode: boolean) => {
  if (provider === AIProviderName.AZURE) {
    return z.object({
      displayName: z.string().min(1),
      provider: z.literal(AIProviderName.AZURE),
      config: AzureProviderConfig,
      auth: editMode ? OptionalAuthSchema : AzureProviderAuthConfig,
    });
  }
  if (provider === AIProviderName.CLOUDFLARE_GATEWAY) {
    return z.object({
      displayName: z.string().min(1),
      provider: z.literal(AIProviderName.CLOUDFLARE_GATEWAY),
      config: CloudflareGatewayProviderConfig,
      auth: editMode ? OptionalAuthSchema : CloudflareGatewayProviderAuthConfig,
    });
  }
  if (provider === AIProviderName.CUSTOM) {
    return z.object({
      displayName: z.string().min(1),
      provider: z.literal(AIProviderName.CUSTOM),
      config: OpenAICompatibleProviderConfig,
      auth: editMode ? OptionalAuthSchema : OpenAICompatibleProviderAuthConfig,
    });
  }
  if (provider === AIProviderName.BEDROCK) {
    return z.object({
      displayName: z.string().min(1),
      provider: z.literal(AIProviderName.BEDROCK),
      config: BedrockProviderConfig,
      auth: editMode ? OptionalAuthSchema : BedrockProviderAuthConfig,
    });
  }
  const authSchema = z.union([
    AnthropicProviderAuthConfig,
    GoogleProviderAuthConfig,
    OpenAIProviderAuthConfig,
  ]);
  return z.object({
    displayName: z.string().min(1),
    provider: z.literal(provider),
    auth: editMode ? OptionalAuthSchema : authSchema,
    config: z.union([
      AnthropicProviderConfig,
      GoogleProviderConfig,
      OpenAIProviderConfig,
    ]),
  });
};

const hasAnyAuthFieldFilled = (
  auth: AIProviderAuthConfig | undefined,
): boolean => {
  if (!auth) {
    return false;
  }
  return Object.values(auth).some(
    (value) => typeof value === 'string' && value.length > 0,
  );
};
