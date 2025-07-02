import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
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
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { aiProviderApi } from '@/features/platform-admin/lib/ai-provider-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { SupportedAIProvider } from '@activepieces/shared';

import { ApMarkdown } from '../../../../../../components/custom/markdown';

const UpsertAIProviderInput = Type.Object({
  provider: Type.String(),
  apiKey: Type.String(),
});

export type UpsertAIProviderInput = Static<typeof UpsertAIProviderInput>;

type UpsertAIProviderDialogProps = {
  provider: string;
  providerMetadata: SupportedAIProvider;
  children: React.ReactNode;
  onSave: () => void;
  isConfigured?: boolean;
};

export const UpsertAIProviderDialog = ({
  children,
  onSave,
  provider,
  providerMetadata,
  isConfigured = false,
}: UpsertAIProviderDialogProps) => {
  const [open, setOpen] = useState(false);
  const form = useForm<UpsertAIProviderInput>({
    resolver: typeboxResolver(UpsertAIProviderInput),
    defaultValues: {
      provider,
      apiKey: '',
    },
  });

  const { refetch } = flagsHooks.useFlags();

  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationFn: (): Promise<void> => {
      return aiProviderApi.upsert(form.getValues());
    },
    onSuccess: () => {
      form.reset({ provider, apiKey: '' });
      setOpen(false);
      refetch();
      onSave();
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
      setOpen(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          form.reset({ provider, apiKey: '' });
        }
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isConfigured ? t('Update AI Provider') : t('Enable AI Provider')} (
            {providerMetadata.displayName})
          </DialogTitle>
        </DialogHeader>

        {providerMetadata.markdown && (
          <div className="mb-4">
            <ApMarkdown markdown={providerMetadata.markdown}></ApMarkdown>
          </div>
        )}

        <Form {...form}>
          <form className="grid space-y-4" onSubmit={(e) => e.preventDefault()}>
            <FormField
              name="apiKey"
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
