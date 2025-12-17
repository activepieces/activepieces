import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { t } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

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
import { aiProviderApi } from '@/features/platform-admin/lib/ai-provider-api';
import { aiProviderHooks } from '@/features/platform-admin/lib/ai-provider-hooks';
import {
  AIProviderName,
  AnthropicProviderConfig,
  AzureProviderConfig,
  CloudflareGatewayProviderConfig,
  CreateAIProviderRequest,
  GoogleProviderConfig,
  OpenAICompatibleProviderConfig,
  OpenAIProviderConfig,
} from '@activepieces/shared';

import { ApMarkdown } from '../../../../../../components/custom/markdown';

import { SUPPORTED_AI_PROVIDERS } from './supported-ai-providers';
import { UpsertProviderConfigForm } from './upsert-provider-config-form';

type UpsertAIProviderDialogProps = {
  provider: AIProviderName;
  providerId?: string;
  children: React.ReactNode;
  onSave: () => void;
  defaultDisplayName?: string;
};

export const UpsertAIProviderDialog = ({
  children,
  onSave,
  provider,
  providerId,
  defaultDisplayName = '',
}: UpsertAIProviderDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] =
    useState<AIProviderName>(provider);

  const { data: config, isLoading: isLoadingConfig } =
    aiProviderHooks.useConfig(providerId ?? '', open && !!providerId);

  const currentProviderDef = useMemo(
    () => SUPPORTED_AI_PROVIDERS.find((p) => p.provider === selectedProvider)!,
    [selectedProvider],
  );

  const formSchema = useMemo(() => {
    if (selectedProvider === AIProviderName.AZURE) {
      return Type.Object({
        provider: Type.Literal(AIProviderName.AZURE),
        config: AzureProviderConfig,
      });
    }
    if (selectedProvider === AIProviderName.CLOUDFLARE_GATEWAY) {
      return Type.Object({
        provider: Type.Literal(AIProviderName.CLOUDFLARE_GATEWAY),
        config: CloudflareGatewayProviderConfig,
      });
    }
    if (selectedProvider === AIProviderName.OPENAI_COMPATIBLE) {
      return Type.Object({
        provider: Type.Literal(AIProviderName.OPENAI_COMPATIBLE),
        config: OpenAICompatibleProviderConfig,
      });
    }
    return Type.Object({
      provider: Type.Literal(selectedProvider),
      config: Type.Union([
        AnthropicProviderConfig,
        GoogleProviderConfig,
        OpenAIProviderConfig,
      ]),
    });
  }, [selectedProvider]);

  const form = useForm<CreateAIProviderRequest>({
    resolver: typeboxResolver(formSchema),
    defaultValues: {
      provider: selectedProvider,
      displayName: defaultDisplayName,
      config: {},
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (config) {
        form.reset({
          provider,
          displayName: defaultDisplayName,
          config: config as any,
        });
        setSelectedProvider(provider);
      } else if (!providerId) {
        form.reset({
          provider,
          displayName: currentProviderDef.name,
          config: {} as any,
        });
        setSelectedProvider(provider);
      }
    }
  }, [open, config, defaultDisplayName, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateAIProviderRequest): Promise<void> => {
      if (providerId) {
        return aiProviderApi.update(providerId, data);
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

      toast(data?.message ?? data?.params?.message ?? JSON.stringify(error));
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {providerId ? t('Update AI Provider') : t('Add AI Provider')}
          </DialogTitle>
        </DialogHeader>

        {isLoadingConfig && providerId ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Form {...form}>
            <form
              className="grid space-y-4"
              onSubmit={(e) => e.preventDefault()}
            >
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem
                    className="space-y-3"
                    hidden={
                      currentProviderDef.provider !==
                      AIProviderName.OPENAI_COMPATIBLE
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
                provider={selectedProvider}
                apiKeyRequired={!config}
                isLoading={isPending}
              />

              {form.formState.errors.root?.serverError && (
                <FormMessage>
                  {form.formState.errors.root.serverError.message}
                </FormMessage>
              )}

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
                <Button
                  disabled={
                    !form.formState.isValid || isPending || !selectedProvider
                  }
                  loading={isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    mutate(form.getValues());
                  }}
                >
                  {t('Save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
