import { typeboxResolver } from '@hookform/resolvers/typebox';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { aiProviderApi } from '@/features/platform-admin/lib/ai-provider-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import {
  CreateAIProviderRequest,
  SupportedAIProvider,
} from '@activepieces/common-ai';

import { ApMarkdown } from '../../../../../../components/custom/markdown';

type UpsertAIProviderDialogProps = {
  provider: string;
  providerMetadata: SupportedAIProvider;
  children: React.ReactNode;
  onSave: () => void;
  isConfigured?: boolean;
  showAzureOpenAI?: boolean;
};

export const UpsertAIProviderDialog = ({
  children,
  onSave,
  provider,
  providerMetadata,
  isConfigured = false,
  showAzureOpenAI = false,
}: UpsertAIProviderDialogProps) => {
  const [open, setOpen] = useState(false);
  const form = useForm<CreateAIProviderRequest>({
    resolver: typeboxResolver(CreateAIProviderRequest),
    defaultValues: {
      provider,
      apiKey: '',
      useAzureOpenAI: false,
      resourceName: '',
    },
  });

  const { refetch } = flagsHooks.useFlags();

  const { mutate, isPending } = useMutation({
    mutationFn: (): Promise<void> => {
      return aiProviderApi.upsert(form.getValues());
    },
    onSuccess: () => {
      form.reset({
        provider,
        apiKey: '',
        useAzureOpenAI: false,
        resourceName: '',
      });
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
          form.reset({
            provider,
            apiKey: '',
            useAzureOpenAI: false,
            resourceName: '',
          });
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
            {showAzureOpenAI && (
              <FormField
                name="useAzureOpenAI"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <Label className="text-sm font-medium">
                      {t('Provider')}
                    </Label>
                    <FormControl>
                      <RadioGroup
                        value={field.value ? 'azure' : 'openai'}
                        onValueChange={(value) =>
                          field.onChange(value === 'azure')
                        }
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="openai" id="openai" />
                          <label
                            htmlFor="openai"
                            className="flex items-center gap-2 cursor-pointer text-sm"
                          >
                            <img
                              src="https://cdn.activepieces.com/pieces/openai.png"
                              alt="OpenAI"
                              className="w-4 h-4"
                            />
                            OpenAI
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="azure" id="azure" />
                          <label
                            htmlFor="azure"
                            className="flex items-center gap-2 cursor-pointer text-sm"
                          >
                            <img
                              src="https://cdn.activepieces.com/pieces/azure-openai.png"
                              alt="Azure OpenAI"
                              className="w-4 h-4"
                            />
                            Azure OpenAI
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {showAzureOpenAI && form.watch('useAzureOpenAI') && (
              <FormField
                name="resourceName"
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
