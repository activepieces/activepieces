import { typeboxResolver } from '@hookform/resolvers/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { CopyToClipboardInput } from '@/components/custom/copy-to-clipboard';
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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { apiKeyApi } from '@/features/platform-admin-panel/lib/api-key-api';
import {
  ApiKeyResponseWithValue,
  CreateApiKeyRequest,
} from '@activepieces/ee-shared';

type NewApiKeyDialogProps = {
  children: React.ReactNode;
  onCreate: () => void;
};

export const NewApiKeyDialog = ({
  children,
  onCreate,
}: NewApiKeyDialogProps) => {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState<ApiKeyResponseWithValue | undefined>(
    undefined,
  );
  const form = useForm<CreateApiKeyRequest>({
    resolver: typeboxResolver(CreateApiKeyRequest),
  });

  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationFn: () => apiKeyApi.create(form.getValues()),
    onSuccess: (apiKey) => {
      setApiKey(apiKey);
      onCreate();
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
      setOpen(false);
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
            {apiKey ? t('API Key Created') : t('Create New API Key')}
          </DialogTitle>
        </DialogHeader>
        {apiKey && (
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
              <CopyToClipboardInput useInput={true} textToCopy={apiKey.value} />
            </div>
          </div>
        )}
        {!apiKey && (
          <Form {...form}>
            <form
              className="grid space-y-4"
              onSubmit={form.handleSubmit(() => mutate())}
            >
              <FormField
                name="displayName"
                render={({ field }) => (
                  <FormItem className="grid space-y-4">
                    <FormLabel>{t('API Key Name')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        required
                        placeholder={t('API Key Name')}
                        className="rounded-sm"
                      />
                    </FormControl>
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
          {!apiKey ? (
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
              variant={'secondary'}
              onClick={() => {
                setApiKey(undefined);
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
