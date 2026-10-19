import { formErrors } from '@activepieces/core-utils';
import { ApiKeyResponseWithValue } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { adminLayout, useAdminAction } from '@/app/components/admin';
import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { apiKeyApi } from '@/features/platform-admin';
import { AdminControl, adminControl } from '@/lib/admin-control';

type NewApiKeyDialogProps = {
  children: React.ReactNode;
  onCreate: () => void;
};
const FormSchema = z.object({
  displayName: z.string().trim().min(1, formErrors.required),
});

type FormSchema = z.infer<typeof FormSchema>;

export const NewApiKeyDialog = ({
  children,
  onCreate,
}: NewApiKeyDialogProps) => {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState<ApiKeyResponseWithValue | undefined>(
    undefined,
  );
  const submitting = useRef(false);
  const form = useForm<FormSchema>({
    resolver: zodResolver(FormSchema),
    mode: 'onChange',
    defaultValues: { displayName: '' },
  });

  const { mutate, isPending } = useAdminAction<
    FormSchema,
    ApiKeyResponseWithValue
  >({
    verb: 'create',
    name: t('API key'),
    run: ({ displayName }) =>
      apiKeyApi.create({ displayName: displayName.trim() }),
    onSuccess: ({ data }) => {
      setApiKey(data);
      onCreate();
    },
  });

  const submit = (values: FormSchema) => {
    if (submitting.current) {
      return;
    }
    submitting.current = true;
    mutate(values, {
      onSettled: () => {
        submitting.current = false;
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && isPending) {
          return;
        }
        setOpen(next);
        if (!next) {
          setApiKey(undefined);
        }
        form.reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className={adminLayout.dialog.md}
        showCloseButton={!isPending}
      >
        <DialogHeader>
          <DialogTitle>
            {apiKey ? t('API Key Created') : t('Create API Key')}
          </DialogTitle>
          {!apiKey && (
            <DialogDescription>
              {t(
                'Create a new API key for programmatic access to the platform.',
              )}
            </DialogDescription>
          )}
        </DialogHeader>
        {apiKey && (
          <>
            <div className="p-4">
              <div className="flex flex-col items-start gap-2">
                <span>
                  {t(
                    'Please save this secret key somewhere safe and accessible. For security reasons,',
                  )}{' '}
                  <span className="font-semibold">
                    {t(
                      "you won't be able to view it again after closing this dialog.",
                    )}
                  </span>
                </span>
                <CopyToClipboardInput
                  useInput={true}
                  textToCopy={apiKey.value}
                  fileName={`${apiKey.displayName}`}
                  controlId={AdminControl.API_KEYS_API_KEY_COPY}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant={'secondary'}
                onClick={() => {
                  setApiKey(undefined);
                  setOpen(false);
                }}
                type="button"
              >
                {t('Done')}
              </Button>
            </DialogFooter>
          </>
        )}
        {!apiKey && (
          <Form {...form}>
            <form
              className="grid space-y-4"
              onSubmit={form.handleSubmit(submit)}
            >
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem className="grid space-y-4">
                    <FormLabel>{t('Name')}</FormLabel>
                    <Input {...field} placeholder={t('API Key Name')} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  disabled={isPending}
                  onClick={() => setOpen(false)}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  disabled={isPending}
                  loading={isPending}
                  {...adminControl(AdminControl.API_KEYS_API_KEY_SUBMIT)}
                >
                  {t('Create')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
