import {
  ConnectSecretManagerRequest,
  SecretManagerConnectionScope,
  SecretManagerConnectionWithStatus,
  SecretManagerProviderMetaData,
  SecretManagerProviderId,
  ApErrorParams,
  ErrorCode,
} from '@activepieces/shared';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AssignConnectionToProjectsControl } from '@/features/connections';
import { secretManagersHooks } from '@/features/secret-managers';
import { api } from '@/lib/api';

type AddEditSecretManagerConnectionDialogProps = {
  connection?: SecretManagerConnectionWithStatus;
  children: React.ReactNode;
};

const AddEditSecretManagerConnectionDialog = ({
  children,
  connection,
}: AddEditSecretManagerConnectionDialogProps) => {
  const [open, setOpen] = useState(false);
  const isEdit = !!connection;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('Edit Connection') : t('New Secret Manager Connection')}
          </DialogTitle>
        </DialogHeader>
        <AddEditSecretManagerForm
          key={open ? 'open' : 'closed'}
          connection={connection}
          setOpen={setOpen}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddEditSecretManagerConnectionDialog;

const AddEditSecretManagerForm = ({
  connection,
  setOpen,
}: {
  connection?: SecretManagerConnectionWithStatus;
  setOpen: (open: boolean) => void;
}) => {
  const isEdit = !!connection;
  const { data: providers } = secretManagersHooks.useListProviders();

  const [selectedProviderId, setSelectedProviderId] =
    useState<SecretManagerProviderId | null>(
      connection ? (connection.providerId as SecretManagerProviderId) : null,
    );

  const selectedProvider: SecretManagerProviderMetaData | undefined =
    providers?.find((p) => p.id === selectedProviderId);

  type FormValues = {
    name: string;
    scope: SecretManagerConnectionScope;
    projectIds: string[];
    config: Record<string, string>;
  };

  const form = useForm<FormValues>({
    defaultValues: {
      name: connection?.name ?? '',
      scope: getConnectionScope(connection),
      projectIds: getProjectIds(connection),
      config: {},
    },
  });

  const watchedScope = form.watch('scope');

  const { mutate: createConnection, isPending: isCreating } =
    secretManagersHooks.useCreateSecretManagerConnection({
      onSuccess: () => setOpen(false),
      onError: (error) => handleMutationError(error, form),
    });

  const { mutate: updateConnection, isPending: isUpdating } =
    secretManagersHooks.useUpdateSecretManagerConnection({
      onSuccess: () => setOpen(false),
      onError: (error) => handleMutationError(error, form),
    });

  const isPending = isCreating || isUpdating;

  const handleSubmit = () => {
    form.clearErrors('root.serverError');

    const values = form.getValues();
    if (!selectedProviderId) {
      return;
    }

    const requestBase: ConnectSecretManagerRequest = {
      providerId: selectedProviderId,
      name: values.name,
      scope: values.scope,
      projectIds:
        values.scope === SecretManagerConnectionScope.PROJECT
          ? values.projectIds
          : undefined,
      config: values.config,
    } as ConnectSecretManagerRequest;

    if (isEdit && connection) {
      updateConnection({ id: connection.id, config: requestBase });
    } else {
      createConnection(requestBase);
    }
  };

  return (
    <Form {...form}>
      <form
        className="grid space-y-4"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        {!isEdit && (
          <div className="space-y-2">
            <Label>{t('Provider')}</Label>
            <div className="grid grid-cols-2 gap-3">
              {providers?.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  className={`flex items-center gap-3 p-3 border rounded-lg text-left transition-colors ${
                    selectedProviderId === provider.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() =>
                    setSelectedProviderId(
                      provider.id as SecretManagerProviderId,
                    )
                  }
                >
                  <img
                    src={provider.logo}
                    alt={provider.name}
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-sm font-medium">{provider.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <FormField
          name="name"
          rules={{ required: t('Name is required') }}
          render={({ field }) => (
            <FormItem className="space-y-2">
              <Label htmlFor="connection-name">
                {t('Name')}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                {...field}
                id="connection-name"
                placeholder={t('e.g. Production HashiCorp')}
                className="rounded-sm"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="scope"
          rules={{ required: t('Scope is required') }}
          render={({ field }) => (
            <FormItem className="space-y-2">
              <Label htmlFor="connection-scope">
                {t('Scope')}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="connection-scope">
                  <SelectValue placeholder={t('Select scope')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SecretManagerConnectionScope.PLATFORM}>
                    {t('Platform')}
                  </SelectItem>
                  <SelectItem value={SecretManagerConnectionScope.PROJECT}>
                    {t('Project')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchedScope === SecretManagerConnectionScope.PROJECT && (
          <AssignConnectionToProjectsControl
            control={form.control}
            name="projectIds"
          />
        )}

        {selectedProvider &&
          Object.entries(selectedProvider.fields).map(([fieldId, field]) => (
            <FormField
              key={fieldId}
              rules={{ required: !field.optional }}
              name={`config.${fieldId}`}
              render={({ field: formField }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor={fieldId}>
                    {field.displayName}
                    {!field.optional && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                  <div className="flex gap-2 items-center justify-center">
                    <Input
                      {...formField}
                      required={!field.optional}
                      id={fieldId}
                      placeholder={field.placeholder}
                      className="rounded-sm"
                      type={field.type}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

        {form.formState.errors.root?.serverError && (
          <FormMessage>
            {form.formState.errors.root.serverError.message}
          </FormMessage>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setOpen(false);
            }}
          >
            {t('Cancel')}
          </Button>
          <Button
            disabled={!selectedProviderId}
            loading={isPending}
            type="submit"
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

function getConnectionScope(
  connection?: SecretManagerConnectionWithStatus,
): SecretManagerConnectionScope {
  if (!connection) return SecretManagerConnectionScope.PLATFORM;
  return connection.scope as SecretManagerConnectionScope;
}

function getProjectIds(
  connection?: SecretManagerConnectionWithStatus,
): string[] {
  if (!connection) return [];
  if (connection.scope === SecretManagerConnectionScope.PROJECT) {
    return (connection as { projectIds: string[] }).projectIds ?? [];
  }
  return [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleMutationError(
  error: Error,
  form: ReturnType<typeof useForm<any>>,
): void {
  if (api.isError(error)) {
    const apError = error.response?.data as ApErrorParams;
    if (apError?.code === ErrorCode.SECRET_MANAGER_CONNECTION_FAILED) {
      form.setError('root.serverError', {
        type: 'manual',
        message: t('Failed to connect to secret manager with error: "{msg}"', {
          msg: apError.params?.message,
        }),
      });
    }
  } else {
    form.setError('root.serverError', {
      type: 'manual',
      message: t('Failed to connect to secret manager, please check console'),
    });
  }
}
