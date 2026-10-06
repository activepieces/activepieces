import { ApiKeyResponseWithValue, formErrors } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert02Icon } from '@hugeicons/core-free-icons';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { apiKeyApi } from '@/features/platform-admin';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';

export const NewApiKeyDialog = ({
  open,
  onOpenChange,
  onCreate,
}: NewApiKeyDialogProps) => {
  const [secretShown, setSecretShown] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && secretShown) {
          return;
        }
        onOpenChange(next);
      }}
    >
      <DialogContent size="sm" showCloseButton={!secretShown}>
        <NewApiKeyBody
          key={open ? 'open' : 'closed'}
          onCreate={onCreate}
          onSecretShown={() => setSecretShown(true)}
          onClose={() => {
            setSecretShown(false);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

function NewApiKeyBody({
  onCreate,
  onSecretShown,
  onClose,
}: {
  onCreate: () => Promise<unknown>;
  onSecretShown: () => void;
  onClose: () => void;
}) {
  const [apiKey, setApiKey] = useState<ApiKeyResponseWithValue | undefined>(
    undefined,
  );
  const form = useForm<FormSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues: { displayName: '' },
    mode: 'onChange',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormSchema) => apiKeyApi.create(values),
    onSuccess: async (created) => {
      setApiKey(created);
      onSecretShown();
      await onCreate();
    },
    onError: (error) => {
      form.setError('root.serverError', {
        type: 'manual',
        message: mutationFeedback.message(error),
      });
    },
  });

  if (apiKey) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{t('Copy your key now')}</DialogTitle>
          <DialogDescription>
            {t('This is the only time {name} is shown in full.', {
              name: apiKey.displayName,
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <CopyToClipboardInput
            useInput={true}
            textToCopy={apiKey.value}
            fileName={apiKey.displayName}
            controlId={AdminControl.API_KEYS_API_KEY_COPY}
          />
          <Alert variant="warning">
            <HugeiconsIcon icon={Alert02Icon} />
            <AlertDescription>
              {t(
                'Store it somewhere safe. Once this dialog closes, nobody can see it again.',
              )}
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            {t("I've copied it")}
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('New API key')}</DialogTitle>
        <DialogDescription>
          {t(
            'Name it after what will use it, for example a pipeline, a script or another app.',
          )}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) => {
            if (isPending) {
              return;
            }
            form.clearErrors('root.serverError');
            mutate(values);
          })}
        >
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Name')}</FormLabel>
                <Input {...field} autoFocus placeholder="ci-deploy" />
                <FormMessage />
              </FormItem>
            )}
          />
          {form.formState.errors.root?.serverError && (
            <p className="text-sm text-danger-11">
              {form.formState.errors.root.serverError.message}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              {t('Cancel')}
            </Button>
            <Button
              type="submit"
              loading={isPending}
              disabled={!form.formState.isValid}
              {...adminControl(AdminControl.API_KEYS_API_KEY_SUBMIT)}
            >
              {t('Create')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}

const FormSchema = z.object({
  displayName: z.string().trim().min(1, formErrors.required),
});

type FormSchema = z.infer<typeof FormSchema>;

type NewApiKeyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: () => Promise<unknown>;
};
