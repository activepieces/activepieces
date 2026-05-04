import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
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

const FormValues = z.object({
  domain: z.string().min(1, 'required'),
});

type FormValues = z.infer<typeof FormValues>;

type SamlDomainDialogProps = {
  children: ReactNode;
};

export const SamlDomainDialog = ({ children }: SamlDomainDialogProps) => {
  const [open, setOpen] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(FormValues),
    defaultValues: { domain: '' },
    mode: 'onChange',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const domain = values.domain.trim().toLowerCase();
      const { platformId } = await samlSsoApi.discover(domain);
      if (!platformId) {
        throw new Error(t('No SAML provider found for this domain'));
      }
      window.location.href = `/api/v1/authn/saml/login?platformId=${encodeURIComponent(
        platformId,
      )}`;
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : t('Sign-in failed');
      form.setError('root.serverError', { type: 'manual', message });
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset();
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Sign in with SAML')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((data) => mutate(data))}
          >
            <p className="text-sm text-muted-foreground">
              {t(
                "Enter your organization's domain to be redirected to your SAML provider.",
              )}
            </p>
            <FormField
              name="domain"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1.5">
                  <FormLabel>{t('Domain')}</FormLabel>
                  <Input {...field} placeholder="acme.com" autoFocus />
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
                {t('Continue')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
