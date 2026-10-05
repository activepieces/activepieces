import { SAFE_STRING_PATTERN } from '@activepieces/core-utils';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { SubmitHandler, useForm } from 'react-hook-form';

import { platformApi } from '@/api/platforms-api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authenticationSession } from '@/lib/authentication-session';
import { mutationFeedback } from '@/lib/mutation-feedback';

type CreatePlatformSchema = {
  name: string;
};

function CreatePlatformDialogForm({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const form = useForm<CreatePlatformSchema>({
    defaultValues: { name: '' },
    mode: 'onChange',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: platformApi.createPlatform,
    onSuccess: (data) => {
      authenticationSession.saveResponse(data, false);
      window.location.href = '/';
    },
    onError: (error) => {
      form.setError('root.serverError', {
        type: 'manual',
        message: mutationFeedback.message(error),
      });
    },
  });

  const onSubmit: SubmitHandler<CreatePlatformSchema> = (data) => {
    if (isPending) {
      return;
    }
    form.clearErrors('root.serverError');
    mutate({ name: data.name.trim() });
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="name"
          rules={{
            required: t('Platform name is required'),
            maxLength: {
              value: 100,
              message: t('Platform name is too long'),
            },
            pattern: {
              value: new RegExp(SAFE_STRING_PATTERN),
              message: t('Platform name cannot contain "." or "/"'),
            },
          }}
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="createPlatformName">{t('Platform name')}</Label>
              <Input
                {...field}
                required
                id="createPlatformName"
                type="text"
                placeholder={t('My platform')}
                autoFocus
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
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button type="submit" loading={isPending}>
            {t('Create platform')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function CreatePlatformDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Create platform')}</DialogTitle>
        </DialogHeader>
        <CreatePlatformDialogForm
          key={open ? 'open' : 'closed'}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}
