import {
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
import { aiToolConfigMutations } from '@/features/platform-admin';

import { AiToolCapabilityInfo } from './catalog';

const formSchema = z.object({
  provider: z.enum(AiToolProvider),
  apiKey: z.string().min(1, formErrors.required),
});
type FormValues = z.infer<typeof formSchema>;

export function AiCapabilityDialog({
  capabilityInfo,
  existingConfig,
  onSaved,
  children,
}: {
  capabilityInfo: AiToolCapabilityInfo;
  existingConfig?: AiToolConfigWithoutSensitiveData;
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
  onClose,
  onSaved,
}: {
  capabilityInfo: AiToolCapabilityInfo;
  existingConfig?: AiToolConfigWithoutSensitiveData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      provider: existingConfig?.provider ?? capabilityInfo.providers[0].id,
      apiKey: '',
    },
  });

  const { mutate, isPending } = aiToolConfigMutations.useUpsertAiToolConfig({
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
  });

  const handleSubmit = (values: FormValues) => {
    form.clearErrors('root.serverError');
    const request: CreateAiToolConfigRequest = {
      capability: capabilityInfo.capability,
      provider: values.provider,
      auth: { apiKey: values.apiKey },
      enabled: true,
    };
    mutate(request);
  };

  const selectedProvider = capabilityInfo.providers.find(
    (p) => p.id === form.watch('provider'),
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <DialogHeader>
          <DialogTitle>{capabilityInfo.name}</DialogTitle>
          <DialogDescription>{capabilityInfo.description}</DialogDescription>
        </DialogHeader>

        {capabilityInfo.providers.length > 1 && (
          <FormField
            control={form.control}
            name="provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Provider')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
                    existingConfig
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
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
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

        {form.formState.errors.root?.serverError && (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.serverError.message}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit" loading={isPending}>
            {t('Save')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
