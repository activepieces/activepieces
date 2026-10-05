import { ApErrorParams, ErrorCode } from '@activepieces/core-utils';
import {
  ConnectSecretManagerRequest,
  ConnectSecretManagerRequestSchema,
  SECRET_MANAGER_PROVIDERS_METADATA,
  SecretManagerConnectionScope,
  SecretManagerConnectionWithStatus,
  SecretManagerProviderMetaData,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { LogoPlate } from '@/components/custom/logo-plate';
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
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProjectSelector } from '@/features/connections';
import { secretManagersHooks } from '@/features/secret-managers';
import { api } from '@/lib/api';

import { secretManagersUtils } from './util';

const AddEditSecretManagerConnectionDialog = ({
  children,
  connection,
}: AddEditSecretManagerConnectionDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent size="lg" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {connection
              ? t('Edit {name}', { name: connection.name })
              : t('Connect a vault')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'The connection is tested before it is saved. The credentials you enter here are the only thing stored on the platform.',
            )}
          </DialogDescription>
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

  const form = useForm<ConnectSecretManagerRequest>({
    resolver: zodResolver(ConnectSecretManagerRequestSchema),
    mode: 'onChange',
    defaultValues: secretManagersUtils.getDefaultValues(connection),
  });

  const watchedProviderId = form.watch('providerId');
  const watchedScope = form.watch('scope');
  const selectedProvider: SecretManagerProviderMetaData | undefined =
    SECRET_MANAGER_PROVIDERS_METADATA.find((p) => p.id === watchedProviderId);

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

  const handleSubmit = (values: ConnectSecretManagerRequest) => {
    form.clearErrors('root.serverError');
    if (isEdit && connection) {
      updateConnection({ id: connection.id, config: values });
    } else {
      createConnection(values);
    }
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <ScrollArea className="max-h-[500px]">
          <div className="flex flex-col gap-4 p-px">
            {!isEdit && (
              <FormField
                name="providerId"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="provider-select">{t('Provider')}</Label>
                    <Select
                      value={field.value ?? ''}
                      onValueChange={(val) => {
                        const provider = SECRET_MANAGER_PROVIDERS_METADATA.find(
                          (p) => p.id === val,
                        );
                        field.onChange(val);
                        if (provider) {
                          form.setValue(
                            'config',
                            secretManagersUtils.getEmptySecretManagerConfig(
                              provider.id,
                            ),
                          );
                        }
                      }}
                    >
                      <SelectTrigger id="provider-select">
                        <SelectValue placeholder={t('Select a provider')} />
                      </SelectTrigger>
                      <SelectContent>
                        {SECRET_MANAGER_PROVIDERS_METADATA.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            <div className="flex items-center gap-2">
                              <LogoPlate
                                src={provider.logo}
                                alt={provider.name}
                                size="xxs"
                              />
                              <span>{provider.name}</span>
                            </div>
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="connection-name">{t('Name')}</Label>
                  <Input
                    {...field}
                    id="connection-name"
                    placeholder={t('e.g. Production HashiCorp')}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="scope"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="connection-scope">{t('Available to')}</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="connection-scope">
                      <SelectValue placeholder={t('Select scope')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SecretManagerConnectionScope.PLATFORM}>
                        {t('Every project')}
                      </SelectItem>
                      <SelectItem value={SecretManagerConnectionScope.PROJECT}>
                        {t('Only the projects I choose')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedScope === SecretManagerConnectionScope.PROJECT && (
              <ProjectSelector control={form.control} name="projectIds" />
            )}

            {selectedProvider &&
              Object.entries(selectedProvider.fields).map(
                ([fieldId, field]) => (
                  <FormField
                    key={fieldId}
                    name={`config.${fieldId}`}
                    render={({ field: formField }) => (
                      <FormItem>
                        <Label htmlFor={fieldId}>
                          {field.optional
                            ? t('{label} (optional)', {
                                label: field.displayName,
                              })
                            : field.displayName}
                        </Label>
                        <Input
                          {...formField}
                          id={fieldId}
                          placeholder={field.placeholder}
                          type={field.type}
                          value={formField.value}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ),
              )}
          </div>
        </ScrollArea>
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
          <Button loading={isPending} type="submit">
            {isEdit ? t('Save') : t('Connect')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

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

type AddEditSecretManagerConnectionDialogProps = {
  connection?: SecretManagerConnectionWithStatus;
  children: React.ReactNode;
};
