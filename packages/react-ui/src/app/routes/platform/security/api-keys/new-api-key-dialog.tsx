import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Type, Static } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
import { apiKeyApi } from '@/features/platform-admin/lib/api-key-api';
import { ApiKeyResponseWithValue } from '@activepieces/ee-shared';

type NewApiKeyDialogProps = {
  children: React.ReactNode;
  onCreate: () => void;
};
const FormSchema = Type.Object({
  displayName: Type.String({
    minLength: 1,
    errorMessage: t('Name is required'),
  }),
});

type FormSchema = Static<typeof FormSchema>;

export const NewApiKeyDialog = ({
  children,
  onCreate,
}: NewApiKeyDialogProps) => {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState<ApiKeyResponseWithValue | undefined>(
    undefined,
  );
  const form = useForm<FormSchema>({
    resolver: typeboxResolver(FormSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => apiKeyApi.create(form.getValues()),
    onSuccess: (apiKey) => {
      setApiKey(apiKey);
      onCreate();
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        form.reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {apiKey ? t('API Key Created') : t('Create API Key')}
          </DialogTitle>
        </DialogHeader>
        {apiKey && (
          <>
            <div className="p-4">
              <div className="flex flex-col items-start gap-2">
                <span className="text-md">
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
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant={'accent'}
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
              onSubmit={form.handleSubmit(() => mutate())}
            >
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem className="grid space-y-4">
                    <FormLabel>{t('Name')}</FormLabel>
                    <Input
                      {...field}
                      required
                      placeholder={t('API Key Name')}
                      className="rounded-sm"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setOpen(false)}
                >
                  {t('Cancel')}
                </Button>
                <Button disabled={isPending} loading={isPending}>
                  {t('Save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
