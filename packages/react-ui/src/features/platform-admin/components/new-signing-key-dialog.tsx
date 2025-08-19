import { typeboxResolver } from '@hookform/resolvers/typebox';
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
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signingKeyApi } from '@/features/platform-admin/lib/signing-key-api';
import {
  AddSigningKeyRequestBody,
  AddSigningKeyResponse,
} from '@activepieces/ee-shared';

type NewSigningKeyDialogProps = {
  children: React.ReactNode;
  onCreate: () => void;
};

export const NewSigningKeyDialog = ({
  children,
  onCreate,
}: NewSigningKeyDialogProps) => {
  const [open, setOpen] = useState(false);
  const [signingKey, setSigningKey] = useState<
    AddSigningKeyResponse | undefined
  >(undefined);
  const form = useForm<AddSigningKeyRequestBody>({
    resolver: typeboxResolver(AddSigningKeyRequestBody),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => signingKeyApi.create(form.getValues()),
    onSuccess: (key) => {
      setSigningKey(key);
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
            {signingKey ? t('Signing Key Created') : t('Create Signing Key')}
          </DialogTitle>
        </DialogHeader>
        {signingKey && (
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
                useInput={false}
                fileName={signingKey.displayName}
                textToCopy={signingKey.privateKey}
              />
            </div>
          </div>
        )}
        {!signingKey && (
          <Form {...form}>
            <form
              className="grid space-y-4"
              onSubmit={form.handleSubmit(() => mutate())}
            >
              <FormField
                name="displayName"
                render={({ field }) => (
                  <FormItem className="grid space-y-4">
                    <Label htmlFor="displayName">{t('Name')}</Label>
                    <Input
                      {...field}
                      required
                      id="displayName"
                      className="rounded-sm"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form?.formState?.errors?.root?.serverError && (
                <FormMessage>
                  {form.formState.errors.root.serverError.message}
                </FormMessage>
              )}
            </form>
          </Form>
        )}
        <DialogFooter>
          {!signingKey ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button
                disabled={isPending || !form.formState.isValid}
                loading={isPending}
                onClick={() => mutate()}
              >
                {t('Save')}
              </Button>
            </>
          ) : (
            <Button
              variant={'accent'}
              onClick={() => {
                setSigningKey(undefined);
                setOpen(false);
              }}
            >
              {t('Done')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
