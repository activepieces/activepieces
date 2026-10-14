import { formErrors, PlatformWithoutSensitiveData } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import { adminLayout } from '@/app/components/admin';
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
import { AdminControl, adminControl } from '@/lib/admin-control';
import { api } from '@/lib/api';

export const AddAllowedDomainDialog = ({
  platform,
  refetch,
  children,
}: AddAllowedDomainDialogProps) => {
  const [open, setOpen] = useState(false);
  const existing = platform.allowedAuthDomains;
  const form = useForm<AllowedDomainFormValues>({
    defaultValues: { domain: '' },
    resolver: zodResolver(allowedDomainSchema(existing)),
    mode: 'onChange',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ domain }: AllowedDomainFormValues) => {
      await platformApi.update(
        {
          allowedAuthDomains: [...existing, normalizeDomain(domain)],
          enforceAllowedAuthDomains: true,
        },
        platform.id,
      );
      await refetch();
    },
    onSuccess: () => {
      toast.success(t('Allowed domain added'));
      setOpen(false);
    },
    onError: (error) => {
      form.setError('root.serverError', {
        type: 'manual',
        message: api.extractServerErrorMessage(error, t("Couldn't add domain")),
      });
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        form.reset({ domain: '' });
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className={adminLayout.dialog.md}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t('Add domain')}</DialogTitle>
          <DialogDescription>
            {describeAddingDomain({ isFirstDomain: existing.length === 0 })}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => mutate(values))}
          >
            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <FormLabel>{t('Domain')}</FormLabel>
                  <Input {...field} placeholder="contractors.io" autoFocus />
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
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t('Cancel')}
              </Button>
              <Button
                {...adminControl(AdminControl.SSO_ALLOWED_DOMAINS_SUBMIT)}
                type="submit"
                loading={isPending}
                disabled={!form.formState.isValid}
              >
                {t('Add domain')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

function describeAddingDomain({
  isFirstDomain,
}: {
  isFirstDomain: boolean;
}): string {
  return isFirstDomain
    ? t(
        'Once a domain is on this list, only people at listed domains can sign in with email and password. Add your company domain too.',
      )
    : t('People at this domain can sign in with email and password.');
}

function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase();
}

function allowedDomainSchema(existing: string[]) {
  return z.object({
    domain: z
      .string()
      .transform(normalizeDomain)
      .pipe(
        z
          .hostname(formErrors.invalidDomain)
          .max(253, formErrors.invalidDomain)
          .refine((value) => value.includes('.'), formErrors.invalidDomain)
          .refine(
            (value) => !existing.includes(value),
            formErrors.duplicateDomain,
          ),
      ),
  });
}

type AllowedDomainFormValues = { domain: string };

type AddAllowedDomainDialogProps = {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
  children: ReactNode;
};
