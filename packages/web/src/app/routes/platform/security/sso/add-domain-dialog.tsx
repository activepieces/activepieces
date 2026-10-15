import {
  formErrors,
  PlatformWithoutSensitiveData,
  SsoDomainVerificationStatus,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { adminLayout } from '@/app/components/admin';
import { DomainDnsRecord } from '@/app/routes/platform/security/sso/domain-dns-record';
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
import { samlSsoApi, ssoMutations } from '@/features/platform-admin';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { api } from '@/lib/api';

export const AddDomainDialog = ({
  platform,
  refetch,
  children,
}: AddDomainDialogProps) => {
  const [open, setOpen] = useState(false);
  const verification = platform.ssoDomainVerification;
  const pendingRecord =
    platform.ssoDomain &&
    verification?.status === SsoDomainVerificationStatus.PENDING_VERIFICATION
      ? verification.record
      : null;

  const form = useForm<DomainFormValues>({
    defaultValues: { domain: '' },
    resolver: zodResolver(DomainFormValues),
    mode: 'onChange',
  });

  const { mutate: saveDomain, isPending: isSaving } = useMutation({
    mutationFn: async ({ domain }: DomainFormValues) => {
      await samlSsoApi.updateSsoDomain(domain);
      await refetch();
    },
    onError: (error) => {
      form.setError('root.serverError', {
        type: 'manual',
        message: api.extractServerErrorMessage(
          error,
          t("Couldn't save domain"),
        ),
      });
    },
  });

  const { mutate: verifyDomain, isPending: isVerifying } =
    ssoMutations.useVerifySsoDomain({
      refetch,
      onVerified: () => setOpen(false),
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
          <DialogTitle>{t('Add a domain')}</DialogTitle>
          <DialogDescription>
            {pendingRecord
              ? t(
                  'Add this TXT record at your DNS provider, then verify. Verify within 3 hours or the domain is dropped.',
                )
              : t('Enter the email domain your company owns.')}
          </DialogDescription>
        </DialogHeader>

        {pendingRecord ? (
          <>
            <DomainDnsRecord record={pendingRecord} />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t('Verify later')}
              </Button>
              <Button
                {...adminControl(AdminControl.SSO_DOMAIN_DNS_RUN)}
                type="button"
                loading={isVerifying}
                onClick={() => verifyDomain()}
              >
                {t('Verify DNS')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <Form {...form}>
            <form
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit((values) => saveDomain(values))}
            >
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem className="grid space-y-2">
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
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  {...adminControl(AdminControl.SSO_SAML_DOMAIN_SUBMIT)}
                  type="submit"
                  loading={isSaving}
                  disabled={!form.formState.isValid}
                >
                  {t('Add domain')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

const DomainFormValues = z.object({
  domain: z
    .string()
    .transform((value) => value.trim().toLowerCase())
    .pipe(
      z
        .hostname(formErrors.invalidDomain)
        .max(253, formErrors.invalidDomain)
        .refine((value) => value.includes('.'), formErrors.invalidDomain),
    ),
});
type DomainFormValues = { domain: string };

type AddDomainDialogProps = {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
  children: ReactNode;
};
