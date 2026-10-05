import { AddSigningKeyResponse, formErrors } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { signingKeyMutations } from '../hooks/signing-key-hooks';

export const NewSigningKeyDialog = ({
  children,
  onCreate,
}: NewSigningKeyDialogProps) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <NewSigningKeyBody
          key={open ? 'open' : 'closed'}
          onCreate={onCreate}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

function NewSigningKeyBody({
  onCreate,
  onClose,
}: {
  onCreate: () => Promise<unknown>;
  onClose: () => void;
}) {
  const [signingKey, setSigningKey] = useState<
    AddSigningKeyResponse | undefined
  >(undefined);
  const form = useForm<FormSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues: { displayName: '' },
    mode: 'onChange',
  });

  const { mutate, isPending } = signingKeyMutations.useCreateSigningKey({
    onSuccess: async (key) => {
      await onCreate();
      setSigningKey(key);
    },
    onError: (error) => {
      form.setError('root.serverError', {
        type: 'manual',
        message: mutationFeedback.message(error),
      });
    },
  });

  if (signingKey) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{t('Copy your private key now')}</DialogTitle>
          <DialogDescription>
            {t('This is the only time {name} is shown in full.', {
              name: signingKey.displayName,
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <CopyToClipboardInput
            useInput={false}
            fileName={signingKey.displayName}
            textToCopy={signingKey.privateKey}
            controlId={AdminControl.EMBEDDING_SIGNING_KEY_SECRET_COPY}
          />
          <Alert variant="warning">
            <TriangleAlert />
            <AlertDescription>
              {t(
                'Store it somewhere safe. Once this dialog closes, nobody can see it again.',
              )}
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            {t('Done')}
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('New signing key')}</DialogTitle>
        <DialogDescription>
          {t(
            'Your app keeps the private key and uses it to sign tokens. Only the public half is stored here.',
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
                <Label htmlFor="displayName">{t('Name')}</Label>
                <Input {...field} id="displayName" autoFocus />
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
            <Button type="button" variant="outline" onClick={onClose}>
              {t('Cancel')}
            </Button>
            <Button
              {...adminControl(AdminControl.EMBEDDING_SIGNING_KEY_NEW_SUBMIT)}
              type="submit"
              loading={isPending}
              disabled={!form.formState.isValid}
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

type NewSigningKeyDialogProps = {
  children: React.ReactNode;
  onCreate: () => Promise<unknown>;
};
