import { AxiosError } from 'axios';
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
  ApErrorParams,
  ConnectSecretManagerRequest,
  ErrorCode,
  SecretManagerProviderMetaData,
} from '@activepieces/shared';

type ConnectSecretManagerDialogProps = {
  manager: SecretManagerProviderMetaData;
  children: React.ReactNode;
};

const ConnectSecretManagerDialog = ({
  children,
  manager,
}: ConnectSecretManagerDialogProps) => {
  const [open, setOpen] = useState(false);
  const form = useForm();
  const { mutate, isPending } = secretManagersHooks.useConnectSecretManager();

  const connect = () => {
    form.clearErrors('root.serverError');
    mutate(
      {
        providerId: manager.id,
        config: form.getValues(),
      } as ConnectSecretManagerRequest,
      {
        onSuccess: () => {
          form.reset();
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
              return;
            }
          }
          const err = error as AxiosError<{
            message?: string;
            params?: { message: string };
          }>;
          const data = err.response?.data;
          form.setError('root.serverError', {
            type: 'manual',
            message:
              data?.message ?? data?.params?.message ?? JSON.stringify(error),
          });
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
        }
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('Connect secret manager')} ({manager.name})
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="grid space-y-4"
            onSubmit={form.handleSubmit(connect)}
          >
            {Object.entries(manager.fields).map(([fieldId, field]) => (
              <FormField
                key={fieldId}
                rules={{ required: true }}
                name={fieldId}
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
      </DialogContent>
    </Dialog>
  );
};

export default ConnectSecretManagerDialog;
