import {
  ConnectSecretManagerRequest,
  ConnectSecretManagerRequestSchema,
  SECRET_MANAGER_PROVIDERS_METADATA,
  SecretManagerConnectionScope,
  SecretManagerConnectionWithStatus,
  SecretManagerProviderMetaData,
  ApErrorParams,
  ErrorCode,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>{children}</DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{t('Edit')}</TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {connection
              ? `${t('Edit')} ${connection.name}`
              : t('New Secret Manager Connection')}
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
        className="grid space-y-4"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <ScrollArea className="max-h-[500px]">
          <div className="grid space-y-3">
            {!isEdit && (
              <FormField
                name="providerId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="provider-select" showRequiredIndicator>
                      {t('Provider')}
                    </Label>
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
                              <img
                                src={provider.logo}
                                alt={provider.name}
                                className="w-4 h-4 object-contain"
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
                <FormItem className="space-y-2">
                  <Label htmlFor="connection-name" showRequiredIndicator>
                    {t('Name')}
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
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="connection-scope" showRequiredIndicator>
                    {t('Scope')}
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
              <ProjectSelector control={form.control} name="projectIds" />
            )}

            {selectedProvider &&
              Object.entries(selectedProvider.fields).map(
                ([fieldId, field]) => (
                  <FormField
                    key={fieldId}
                    name={`config.${fieldId}`}
                    render={({ field: formField }) => (
                      <FormItem className="space-y-2">
                        <Label
                          htmlFor={fieldId}
                          showRequiredIndicator={!field.optional}
                        >
                          {field.displayName}
                        </Label>
                        <div className="flex gap-2 items-center justify-center">
                          <Input
                            {...formField}
                            id={fieldId}
                            placeholder={field.placeholder}
                            className="rounded-sm"
                            type={field.type}
                            value={formField.value}
                          />
                        </div>
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

        <DialogFooter className="mt-1">
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
            {t('Save')}
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
