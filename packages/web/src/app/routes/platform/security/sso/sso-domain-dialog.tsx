import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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
import { samlSsoApi } from '@/features/platform-admin';

const SsoDomainFormValues = z.object({
  ssoDomain: z.union([
    z
      .hostname('invalidSsoDomain')
      .max(253, 'invalidSsoDomain')
      .refine((v) => v.includes('.'), 'invalidSsoDomain'),
    z.literal(''),
  ]),
});

type SsoDomainFormValues = z.infer<typeof SsoDomainFormValues>;

type SsoDomainDialogProps = {
  ssoDomain: string | null;
  refetch: () => Promise<void>;
};

export const SsoDomainDialog = ({
  ssoDomain,
  refetch,
}: SsoDomainDialogProps) => {
  const [open, setOpen] = useState(false);
  const form = useForm<SsoDomainFormValues>({
    resolver: zodResolver(SsoDomainFormValues),
    defaultValues: { ssoDomain: ssoDomain ?? '' },
    mode: 'onChange',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: SsoDomainFormValues) => {
      const trimmed = values.ssoDomain.trim().toLowerCase();
      await samlSsoApi.updateSsoDomain(trimmed.length === 0 ? null : trimmed);
      await refetch();
    },
    onSuccess: () => {
      toast.success(t('SSO domain updated'), { duration: 3000 });
      setOpen(false);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : t('Save failed');
      form.setError('root.serverError', { type: 'manual', message });
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset({ ssoDomain: ssoDomain ?? '' });
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="basic" onClick={() => setOpen(true)}>
          {ssoDomain ? t('Update') : t('Set domain')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('SSO Domain')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((data) => mutate(data))}
          >
            <p className="text-sm text-muted-foreground">
              {t(
                'When a user enters this domain on the sign-in page, they will be redirected to your SAML identity provider.',
              )}
            </p>
            <FormField
              name="ssoDomain"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1.5">
                  <FormLabel>{t('Domain')}</FormLabel>
                  <Input {...field} placeholder="acme.com" />
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                type="button"
              >
                {t('Cancel')}
              </Button>
              <Button
                type="submit"
                loading={isPending}
                disabled={!form.formState.isValid}
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
