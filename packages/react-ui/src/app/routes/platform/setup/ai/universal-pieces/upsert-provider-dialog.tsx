import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
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
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { aiProviderApi } from '@/features/platform-admin/lib/ai-provider-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import {
  AIProviderName,
  AnthropicProviderConfig,
  AzureProviderConfig,
  CreateAIProviderRequest,
  GoogleProviderConfig,
  OpenAIProviderConfig,
} from '@activepieces/shared';

import { ApMarkdown } from '../../../../../../components/custom/markdown';

type UpsertAIProviderDialogProps = {
  provider: AIProviderName;
  configured: boolean;
  logoUrl: string;
  markdown: string;
  displayName: string;
  children: React.ReactNode;
  onSave: () => void;
};

export const UpsertAIProviderDialog = ({
  children,
  onSave,
  provider,
  configured,
  displayName,
  markdown,
}: UpsertAIProviderDialogProps) => {
  const [open, setOpen] = useState(false);

  const formSchema = useMemo(() => {
    if (provider === AIProviderName.AZURE) {
      return Type.Object({
        provider: Type.Literal(AIProviderName.AZURE),
        config: AzureProviderConfig,
      });
    }
    return Type.Object({
      provider: Type.Literal(provider),
      config: Type.Union([
        AnthropicProviderConfig,
        GoogleProviderConfig,
        OpenAIProviderConfig,
      ]),
    });
  }, [provider]);

  const form = useForm<CreateAIProviderRequest>({
    resolver: typeboxResolver(formSchema),
    defaultValues: (provider === AIProviderName.AZURE
      ? {
          provider: AIProviderName.AZURE,
          config: { apiKey: '', resourceName: '' },
        }
      : {
          provider,
          config: { apiKey: '' },
        }) as CreateAIProviderRequest,
  });

  const { refetch } = flagsHooks.useFlags();

  const { mutate, isPending } = useMutation({
    mutationFn: (): Promise<void> => {
      return aiProviderApi.upsert(form.getValues());
    },
    onSuccess: () => {
      form.reset({});
      setOpen(false);
      refetch();
      onSave();
    },
    onError: () => {
      setOpen(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          form.reset({});
        }
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {configured ? t('Update AI Provider') : t('Enable AI Provider')} (
            {displayName})
          </DialogTitle>
        </DialogHeader>

        {markdown && (
          <div className="mb-4">
            <ApMarkdown markdown={markdown}></ApMarkdown>
          </div>
        )}

        <Form {...form}>
          <form className="grid space-y-4" onSubmit={(e) => e.preventDefault()}>
            {provider === AIProviderName.AZURE && (
              <FormField
                name="config.resourceName"
                render={({ field }) => (
                  <FormItem className="grid space-y-3">
                    <Label htmlFor="resourceName">{t('Resource Name')}</Label>
                    <div className="flex gap-2 items-center justify-center">
                      <Input
                        {...field}
                        required
                        id="resourceName"
                        placeholder={t('your-resource-name')}
                        className="rounded-sm"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              name="config.apiKey"
              render={({ field }) => (
                <FormItem className="grid space-y-3">
                  <Label htmlFor="apiKey">{t('API Key')}</Label>
                  <div className="flex gap-2 items-center justify-center">
                    <Input
                      autoFocus
                      {...field}
                      required
                      id="apiKey"
                      placeholder={t('sk_************************')}
                      className="rounded-sm"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant={'outline'}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setOpen(false);
            }}
          >
            {t('Cancel')}
          </Button>
          <Button
            disabled={!form.formState.isValid}
            loading={isPending}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              mutate();
            }}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
