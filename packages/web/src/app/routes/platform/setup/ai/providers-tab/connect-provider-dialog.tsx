import { AIProviderName } from '@activepieces/core-utils';
import {
  AIProviderWithoutSensitiveData,
  formErrors,
  MarkdownVariant,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { t } from 'i18next';
import {
  BookOpen,
  ChevronDown,
  CircleAlert,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react';
import { useState } from 'react';
import { ControllerRenderProps, FieldErrors, useForm } from 'react-hook-form';
import { z } from 'zod';

import { adminLayout } from '@/app/components/admin';
import { DictionaryInput } from '@/components/custom/dictionary-input';
import { ApMarkdown } from '@/components/custom/markdown';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AiProviderInfo, SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import { aiProviderMutations } from '@/features/platform-admin';
import { AdminControl, adminControl } from '@/lib/admin-control';
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
      <DialogContent className={adminLayout.dialog.md}>
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
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const provider = form.watch('provider');
  const info = providerInfoOf({ provider });
  const fields = providerCredentials.fieldsOf({ provider });
  const mainFields = fields.filter((field) => !field.advanced);
  const advancedFields = fields.filter((field) => field.advanced);
  const providerLocked = editing !== undefined || defaultProvider !== undefined;
  const serverError = form.formState.errors.root?.serverError?.message;

  const { mutate: connect, isPending: connecting } =
    aiProviderMutations.useUpsertAiProvider({
      providerId: editing?.id,
      onSuccess: (created) => onConnected(created?.id),
      onError: (
        error: AxiosError<{ message?: string; params?: { message: string } }>,
      ) => {
        const data = error.response?.data;
        const message =
          data?.params?.message ??
          data?.message ??
          t('The provider rejected these credentials.');
        form.setError('root.serverError', { type: 'manual', message });
        const fieldKey = providerCredentials.fieldOfServerError({
          provider,
          message,
        });
        if (fieldKey === undefined) {
          return;
        }
        form.setError(`credentials.${fieldKey}`, {
          type: 'manual',
          message: t('Check this field'),
        });
        if (advancedFields.some((field) => field.key === fieldKey)) {
          setAdvancedOpen(true);
        }
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

  const handleInvalid = (errors: FieldErrors<ConnectFormValues>) => {
    const failedKeys = Object.keys(errors.credentials ?? {});
    if (advancedFields.some((field) => failedKeys.includes(field.key))) {
      setAdvancedOpen(true);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit, handleInvalid)}
        onChange={() => form.clearErrors('root.serverError')}
        className="flex flex-col gap-4"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {providerLocked && info && <ProviderLogo info={info} size="sm" />}
            {titleOf({ editing, providerLocked, name: info?.name })}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? t('Models and project access stay as they are.')
              : t(
                  'We verify the credentials, then you pick models and projects.',
                )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea viewPortClassName="max-h-[65vh] p-px pr-4">
          <div className="flex flex-col gap-4">
            {info && <SetupHelp key={info.provider} info={info} />}
            <div className="flex flex-col gap-4">
              {!providerLocked && (
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-1.5">
                      <FormLabel showRequiredIndicator>
                        {t('Provider')}
                      </FormLabel>
                      <FormControl>
                        <SearchableSelect
                          value={field.value}
                          options={SUPPORTED_AI_PROVIDERS.map((candidate) => ({
                            value: candidate.provider,
                            label: candidate.name,
                          }))}
                          placeholder={t('Search providers')}
                          valuesRendering={(value) => (
                            <ProviderOption provider={value} />
                          )}
                          onChange={(next) => {
                            if (next === null || next === field.value) {
                              return;
                            }
                            field.onChange(next);
                            form.setValue(
                              'credentials',
                              emptyCredentialsOf(next),
                            );
                            form.setValue('headers', {});
                            form.setValue('name', defaultNameOf(next));
                            form.clearErrors();
                            setAdvancedOpen(false);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1.5">
                    <FieldLabel
                      label={t('Name')}
                      help={t(
                        'How this key shows up in the list, for example the team or budget it belongs to.',
                      )}
                    />
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('e.g. Marketing')}
                        data-testid="ai-provider-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {mainFields.map((credentialField) => (
                <CredentialFieldInput
                  key={credentialField.key}
                  form={form}
                  field={credentialField}
                />
              ))}

              {advancedFields.length > 0 && (
                <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      data-testid="ai-provider-advanced-toggle"
                      className="flex w-full items-center gap-1.5 pt-2 text-sm font-medium text-gray-11 transition-colors hover:text-gray-12"
                    >
                      <ChevronDown
                        className={cn(
                          'size-4 transition-transform duration-200',
                          advancedOpen && 'rotate-180',
                        )}
                      />
                      {t('Advanced ({count})', {
                        count: advancedFields.length,
                      })}
                      <span className="ml-2 h-px grow bg-gray-6" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className={COLLAPSE_ANIMATION}>
                    <div className="flex flex-col gap-4 pt-4">
                      {advancedFields.map((credentialField) => (
                        <CredentialFieldInput
                          key={credentialField.key}
                          form={form}
                          field={credentialField}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </div>
        </ScrollArea>

        {serverError && (
          <Alert variant="destructive" data-testid="ai-provider-connect-error">
            <CircleAlert />
            <AlertDescription className="break-words">
              {serverError}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('Cancel')}
          </Button>
          <Button
            type="submit"
            loading={connecting}
            disabled={connecting}
            data-testid="ai-provider-connect-submit"
            {...adminControl(
              editing
                ? AdminControl.AI_PROVIDER_KEY_CREDENTIALS_SUBMIT
                : AdminControl.AI_PROVIDER_KEY_SUBMIT,
            )}
          >
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
            <FieldLabel label={field.label} help={field.help} optional />
            <DictionaryInput
              values={formField.value}
              onChange={(change) => {
                form.clearErrors('root.serverError');
                formField.onChange(change);
              }}
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
          <FieldLabel
            label={field.label}
            help={field.help}
            optional={field.optional}
          />
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
          ) : field.type === 'textarea' ? (
            <FormControl>
              <Textarea
                {...formField}
                placeholder={field.placeholder}
                rows={6}
                className="font-mono text-xs"
              />
            </FormControl>
          ) : field.secret ? (
            <SecretInput
              field={formField}
              placeholder={field.placeholder}
              testId={`ai-provider-field-${field.key}`}
            />
          ) : (
            <FormControl>
              <Input
                {...formField}
                placeholder={field.placeholder}
                data-testid={`ai-provider-field-${field.key}`}
              />
            </FormControl>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function FieldLabel({
  label,
  help,
  optional,
}: {
  label: string;
  help: string;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <FormLabel showRequiredIndicator={!optional}>{label}</FormLabel>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={t('About {label}', { label })}
            className="text-gray-11 transition-colors hover:text-gray-12"
          >
            <Info className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{help}</TooltipContent>
      </Tooltip>
    </div>
  );
}

function SecretInput({
  field,
  placeholder,
  testId,
}: {
  field: ControllerRenderProps<ConnectFormValues, `credentials.${string}`>;
  placeholder?: string;
  testId: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <FormControl>
        <Input
          {...field}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          data-testid={testId}
          className="pr-9"
        />
      </FormControl>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        tabIndex={-1}
        aria-label={visible ? t('Hide value') : t('Show value')}
        onClick={() => setVisible(!visible)}
        className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-11 hover:text-gray-12"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
}

function ProviderOption({ provider }: { provider: unknown }) {
  const info = SUPPORTED_AI_PROVIDERS.find(
    (candidate) => candidate.provider === provider,
  );
  if (!info) {
    return null;
  }
  return (
    <span className="flex min-w-0 items-center gap-2">
      <ProviderLogo info={info} size="sm" />
      <span className="truncate">{info.name}</span>
    </span>
  );
}

function SetupHelp({ info }: { info: AiProviderInfo }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border border-gray-6 bg-gray-2"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          data-testid="ai-provider-setup-help-toggle"
          className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-12"
        >
          <BookOpen className="size-4 shrink-0 text-gray-11" />
          <span className="grow text-left">
            {t('How to connect {name}', { name: info.name })}
          </span>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-gray-11 transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className={COLLAPSE_ANIMATION}>
        <div className="border-t border-gray-6 px-3 py-3 text-sm text-gray-11">
          <ApMarkdown
            markdown={info.markdown()}
            variant={MarkdownVariant.BORDERLESS}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function titleOf({
  editing,
  providerLocked,
  name,
}: {
  editing?: AIProviderWithoutSensitiveData;
  providerLocked: boolean;
  name?: string;
}): string {
  if (editing) {
    return t('Replace credentials');
  }
  if (providerLocked && name) {
    return t('Connect {name}', { name });
  }
  return t('Connect a provider');
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
      .map((field) => [field.key, field.defaultValue ?? '']),
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

const COLLAPSE_ANIMATION =
  'overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up';

type ConnectFormValues = z.infer<ReturnType<typeof connectFormSchema>>;

type ConnectForm = ReturnType<typeof useForm<ConnectFormValues>>;
