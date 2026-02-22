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
import { secretManagersHooks } from '@/features/secret-managers/lib/secret-managers-hooks';
import { api } from '@/lib/api';
import {
  ConnectSecretManagerRequest,
  SecretManagerProviderMetaData,
} from '@activepieces/ee-shared';
import { ApErrorParams, ErrorCode } from '@activepieces/shared';

type ConnectSecretManagerDialogProps = {
  manager: SecretManagerProviderMetaData;
  children: React.ReactNode;
};
const ConnectSecretManagerDialog = ({
  children,
  manager,
}: ConnectSecretManagerDialogProps) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('Connect')}
            <a
              href={`https://activepieces.com/docs/admin-guide/guides/secret-managers/${manager.id}`}
              target="_blank"
              className="text-primary underline"
              rel="noreferrer"
            >
              {manager.name}
            </a>
          </DialogTitle>
        </DialogHeader>

        <ConnectSecretManagerForm
          key={open ? 'open' : 'closed'}
          manager={manager}
          setOpen={setOpen}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ConnectSecretManagerDialog;

const ConnectSecretManagerForm = ({
  manager,
  setOpen,
}: {
  manager: SecretManagerProviderMetaData;
  setOpen: (open: boolean) => void;
}) => {
  const form = useForm<ConnectSecretManagerRequest>({
    defaultValues: {
      providerId: manager.id,
      config: {},
    },
  });

  const { mutate, isPending } = secretManagersHooks.useConnectSecretManager({
    onSuccess: () => {
      setOpen(false);
    },
    onError: (error) => {
      if (api.isError(error)) {
        const apError = error.response?.data as ApErrorParams;
        if (apError?.code === ErrorCode.SECRET_MANAGER_CONNECTION_FAILED) {
          form.setError('root.serverError', {
            type: 'manual',
            message: t(
              'Failed to connect to secret manager with error: "{msg}"',
              {
                msg: apError.params?.message,
              },
            ),
          });
        }
      } else {
        form.setError('root.serverError', {
          type: 'manual',
          message: t(
            'Failed to connect to secret manager, please check console',
          ),
        });
      }
    },
  });
  const connect = () => {
    form.clearErrors('root.serverError');
    mutate(form.getValues());
  };

  return (
    <Form {...form}>
      <form className="grid space-y-4" onSubmit={form.handleSubmit(connect)}>
        {Object.entries(manager.fields).map(([fieldId, field]) => (
          <FormField
            key={fieldId}
            rules={{ required: !field.optional }}
            name={`config.${fieldId}`}
            render={({ field: formField }) => (
              <FormItem className="grid space-y-3">
                <Label htmlFor="fieldName">
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
            variant={'outline'}
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
            disabled={!form.formState.isValid}
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
