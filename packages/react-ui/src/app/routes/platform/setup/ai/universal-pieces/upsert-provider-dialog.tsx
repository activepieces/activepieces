import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { t } from 'i18next';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

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
import { aiProviderApi } from '@/features/platform-admin/lib/ai-provider-api';
import {
  AIProviderConfig,
  AIProviderName,
  AnthropicProviderAuthConfig,
  AnthropicProviderConfig,
  AzureProviderAuthConfig,
  AzureProviderConfig,
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

import { ApMarkdown } from '../../../../../../components/custom/markdown';
import { SUPPORTED_AI_PROVIDERS } from '../../../../../../features/agents/ai-providers';

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
    resolver: typeboxResolver(createFormSchema(provider, !isNil(providerId))),
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
          ...(data.auth?.apiKey?.length > 0 ? { auth: data.auth } : {}),
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
                <div className="mb-4 text-sm text-muted-foreground">
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

const OptionalAuthSchema = Type.Optional(
  Type.Object({
    apiKey: Type.Optional(Type.String()),
  }),
);

const createFormSchema = (provider: AIProviderName, editMode: boolean) => {
  if (provider === AIProviderName.AZURE) {
    return Type.Object({
      provider: Type.Literal(AIProviderName.AZURE),
      config: AzureProviderConfig,
      auth: editMode ? OptionalAuthSchema : AzureProviderAuthConfig,
    });
  }
  if (provider === AIProviderName.CLOUDFLARE_GATEWAY) {
    return Type.Object({
      provider: Type.Literal(AIProviderName.CLOUDFLARE_GATEWAY),
      config: CloudflareGatewayProviderConfig,
      auth: editMode ? OptionalAuthSchema : CloudflareGatewayProviderAuthConfig,
    });
  }
  if (provider === AIProviderName.CUSTOM) {
    return Type.Object({
      provider: Type.Literal(AIProviderName.CUSTOM),
      config: OpenAICompatibleProviderConfig,
      auth: editMode ? OptionalAuthSchema : OpenAICompatibleProviderAuthConfig,
    });
  }
  const authSchema = Type.Union([
    AnthropicProviderAuthConfig,
    GoogleProviderAuthConfig,
    OpenAIProviderAuthConfig,
  ]);
  return Type.Object({
    provider: Type.Literal(provider),
    auth: editMode ? OptionalAuthSchema : authSchema,
    config: Type.Union([
      AnthropicProviderConfig,
      GoogleProviderConfig,
      OpenAIProviderConfig,
    ]),
  });
};
