import { ApiKeyResponseWithValue, formErrors } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
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
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { internalErrorToast } from '@/components/ui/sonner';
import { apiKeyApi } from '@/features/platform-admin';

export const NewApiKeyDialog = ({
  children,
  onCreate,
}: NewApiKeyDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent size="sm">
        <NewApiKeyBody
          key={open ? 'open' : 'closed'}
          onCreate={onCreate}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

function NewApiKeyBody({
  onCreate,
  onClose,
}: {
  onCreate: () => void;
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
    onSuccess: (created) => {
      setApiKey(created);
      onCreate();
    },
    onError: () => internalErrorToast(),
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
          onSubmit={form.handleSubmit((values) => mutate(values))}
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
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              {t('Cancel')}
            </Button>
            <Button type="submit" loading={isPending}>
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
  children: React.ReactNode;
  onCreate: () => void;
};
