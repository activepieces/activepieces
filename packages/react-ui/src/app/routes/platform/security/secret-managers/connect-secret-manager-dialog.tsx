import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { ApErrorParams, ConnectSecretManagerRequest, SecretManagerProviderMetaData } from '@activepieces/shared';
import { t } from 'i18next';
import {
  Form,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { secretManagersHooks } from '@/features/secret-managers/lib/secret-managers-hooks';

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
    mutate({
      providerId: manager.id,
      config: form.getValues(),
    } as ConnectSecretManagerRequest,
    {
      onSuccess: () => {
        form.reset();
        setOpen(false);
      }
    }
  );
  }

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
          <form className="grid space-y-4" onSubmit={(e) => e.preventDefault()}>
            {
              Object.entries(manager.fields).map(([fieldId, field]) => (
                <FormField
                  rules={{ required: true }}
                  name={fieldId}
                  render={({ field: formField }) => (
                    <FormItem className="grid space-y-3">
                      <Label htmlFor="fieldName">{field.displayName}</Label>
                      <div className="flex gap-2 items-center justify-center">
                        <Input
                          {...formField}
                          required
                          id={fieldId}
                          placeholder={field.placeholder}
                          className="rounded-sm"
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))
            }
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
              connect();
            }}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectSecretManagerDialog;
