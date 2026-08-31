import { AIProviderName } from '@activepieces/core-utils';
import {
  AIProviderWithoutSensitiveData,
  formErrors,
  MarkdownVariant,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { t } from 'i18next';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { ControllerRenderProps, useForm } from 'react-hook-form';
import { z } from 'zod';

import { DictionaryInput } from '@/components/custom/dictionary-input';
import { ApMarkdown } from '@/components/custom/markdown';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AiProviderInfo, SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import { aiProviderMutations } from '@/features/platform-admin';
import { cn } from '@/lib/utils';

import { CredentialField, providerCredentials } from './provider-credentials';
import { ProviderLogo } from './provider-logo';
import { providerRequestUtils } from './provider-request';

export function ConnectProviderDialog({
  open,
  onOpenChange,
  editing,
  defaultProvider,
  onConnected,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: AIProviderWithoutSensitiveData;
  defaultProvider?: AIProviderName;
  onConnected: (createdId?: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <ConnectProviderForm
          key={open ? editing?.id ?? defaultProvider ?? 'new' : 'closed'}
          editing={editing}
          defaultProvider={defaultProvider}
          onConnected={(createdId) => {
            onConnected(createdId);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function ConnectProviderForm({
  editing,
  defaultProvider,
  onConnected,
  onCancel,
}: {
  editing?: AIProviderWithoutSensitiveData;
  defaultProvider?: AIProviderName;
  onConnected: (createdId?: string) => void;
  onCancel: () => void;
}) {
  const form = useForm<ConnectFormValues>({
    resolver: zodResolver(connectFormSchema()),
    mode: 'onChange',
    defaultValues: defaultValuesOf({ editing, defaultProvider }),
  });

  const provider = form.watch('provider');
  const info = providerInfoOf({ provider });
  const fields = providerCredentials.fieldsOf({ provider });

  const { mutate: connect, isPending: connecting } =
    aiProviderMutations.useUpsertAiProvider({
      providerId: editing?.id,
      onSuccess: (created) => onConnected(created?.id),
      onError: (
        error: AxiosError<{ message?: string; params?: { message: string } }>,
      ) => {
        const data = error.response?.data;
        form.setError('root.serverError', {
          type: 'manual',
          message:
            data?.params?.message ??
            data?.message ??
            t('The provider rejected these credentials.'),
        });
      },
    });

  const handleSubmit = (values: ConnectFormValues) => {
    form.clearErrors('root.serverError');
    const request = providerRequestUtils.buildCreateRequest({
      provider: values.provider,
      displayName: values.name.trim(),
      credentials: values.credentials,
      headers: values.headers,
      existingConfig: editing?.config,
    });
    connect(request);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4"
      >
        <DialogHeader>
          <DialogTitle>
            {editing ? t('Replace credentials') : t('Connect a provider')}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? t('Models and project access stay as they are.')
              : t(
                  'We verify the credentials, then you pick models and projects.',
                )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea viewPortClassName="max-h-[60vh] p-px">
          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1.5">
                  <FormLabel>{t('Provider')}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(selected) => {
                      const next = selected as AIProviderName;
                      field.onChange(next);
                      form.setValue('credentials', emptyCredentialsOf(next));
                      form.setValue('headers', {});
                      form.setValue('name', defaultNameOf(next));
                    }}
                    disabled={editing !== undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('Select provider')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUPPORTED_AI_PROVIDERS.map((candidate) => (
                        <SelectItem
                          key={candidate.provider}
                          value={candidate.provider}
                        >
                          <div className="flex items-center gap-2">
                            <ProviderLogo info={candidate} size="sm" />
                            <span>{candidate.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {info?.markdown && <SetupInstructions info={info} />}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1.5">
                  <FormLabel>{t('Name')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('e.g. Marketing')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {fields.map((credentialField) => (
              <CredentialFieldInput
                key={credentialField.key}
                form={form}
                field={credentialField}
              />
            ))}

            {form.formState.errors.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('Cancel')}
          </Button>
          <Button type="submit" loading={connecting} disabled={connecting}>
            {editing ? t('Save credentials') : t('Connect')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function CredentialFieldInput({
  form,
  field,
}: {
  form: ConnectForm;
  field: CredentialField;
}) {
  if (field.type === 'dictionary') {
    return (
      <FormField
        control={form.control}
        name="headers"
        render={({ field: formField }) => (
          <FormItem className="flex flex-col gap-1.5">
            <FormLabel>{field.label}</FormLabel>
            <DictionaryInput
              values={formField.value}
              onChange={formField.onChange}
              keyPlaceholder={t('Header name')}
              valuePlaceholder={t('Header value')}
            />
          </FormItem>
        )}
      />
    );
  }

  return (
    <FormField
      control={form.control}
      name={`credentials.${field.key}`}
      render={({ field: formField }) => (
        <FormItem className="flex flex-col gap-1.5">
          <FormLabel>
            {field.label}
            {field.optional && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {t('optional')}
              </span>
            )}
          </FormLabel>
          {field.options ? (
            <Select value={formField.value} onValueChange={formField.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t('Select an option')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.secret ? (
            <SecretInput field={formField} placeholder={field.placeholder} />
          ) : (
            <FormControl>
              <Input {...formField} placeholder={field.placeholder} />
            </FormControl>
          )}
          {field.description && (
            <FormDescription>{field.description}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function SecretInput({
  field,
  placeholder,
}: {
  field: ControllerRenderProps<ConnectFormValues, `credentials.${string}`>;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <FormControl>
        <Input
          {...field}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          className="pr-9"
        />
      </FormControl>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        tabIndex={-1}
        onClick={() => setVisible(!visible)}
        className="absolute right-1 top-1/2 size-7 -translate-y-1/2 p-0 text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
}

function SetupInstructions({ info }: { info: AiProviderInfo }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown
            className={cn('size-4 transition-transform', open && 'rotate-180')}
          />
          {t('How to get {name} credentials', { name: info.name })}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <ApMarkdown markdown={info.markdown} variant={MarkdownVariant.INFO} />
      </CollapsibleContent>
    </Collapsible>
  );
}

function defaultValuesOf({
  editing,
  defaultProvider,
}: {
  editing?: AIProviderWithoutSensitiveData;
  defaultProvider?: AIProviderName;
}): ConnectFormValues {
  const provider =
    editing?.provider ?? defaultProvider ?? AIProviderName.ANTHROPIC;
  const secretKeys = providerCredentials.secretKeysOf({ provider });
  const prefill = editing
    ? providerRequestUtils.credentialPrefillOf({ row: editing })
    : {};
  return {
    provider,
    name: editing?.name ?? defaultNameOf(provider),
    credentials: {
      ...emptyCredentialsOf(provider),
      ...Object.fromEntries(
        Object.entries(prefill).map(([key, value]) => [
          key,
          secretKeys.includes(key) ? '' : value,
        ]),
      ),
    },
    headers: editing
      ? providerRequestUtils.headersPrefillOf({ row: editing })
      : {},
  };
}

function displayNameOf(provider: AIProviderName): string | undefined {
  return SUPPORTED_AI_PROVIDERS.find((info) => info.provider === provider)
    ?.name;
}

function defaultNameOf(provider: AIProviderName): string {
  return t('{name} key', {
    name: displayNameOf(provider) ?? provider,
  });
}

function emptyCredentialsOf(provider: AIProviderName): Record<string, string> {
  return Object.fromEntries(
    providerCredentials
      .fieldsOf({ provider })
      .filter((field) => field.type !== 'dictionary')
      .map((field) => [field.key, '']),
  );
}

function providerInfoOf({
  provider,
}: {
  provider: AIProviderName;
}): AiProviderInfo | undefined {
  return SUPPORTED_AI_PROVIDERS.find(
    (candidate) => candidate.provider === provider,
  );
}

function connectFormSchema() {
  return z
    .object({
      provider: z.enum(AIProviderName),
      name: z.string().trim().min(1, formErrors.required),
      credentials: z.record(z.string(), z.string()),
      headers: z.record(z.string(), z.string()),
    })
    .superRefine((values, ctx) => {
      providerCredentials
        .fieldsOf({ provider: values.provider })
        .filter((field) => field.type !== 'dictionary' && !field.optional)
        .forEach((field) => {
          if ((values.credentials[field.key] ?? '').trim().length === 0) {
            ctx.addIssue({
              code: 'custom',
              message: formErrors.required,
              path: ['credentials', field.key],
            });
          }
        });
    });
}

type ConnectFormValues = z.infer<ReturnType<typeof connectFormSchema>>;

type ConnectForm = ReturnType<typeof useForm<ConnectFormValues>>;
