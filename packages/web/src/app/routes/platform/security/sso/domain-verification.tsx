import {
  formErrors,
  PlatformWithoutSensitiveData,
  SsoDomainVerificationRecord,
  SsoDomainVerificationStatus,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check } from 'lucide-react';
import { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { DomainDnsRecord } from '@/app/routes/platform/security/sso/domain-dns-record';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { samlSsoApi, ssoMutations } from '@/features/platform-admin';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { api } from '@/lib/api';

export const DomainVerification = ({
  platform,
  refetch,
  onVerified,
  secondaryAction,
  showIntro = true,
}: DomainVerificationProps) => {
  const verification = platform.ssoDomainVerification;
  if (!platform.ssoDomain || !verification) {
    return <DomainEntry refetch={refetch} secondaryAction={secondaryAction} />;
  }
  if (verification.status === SsoDomainVerificationStatus.VERIFIED) {
    return <VerifiedDomain domain={platform.ssoDomain} />;
  }
  return (
    <PendingDomain
      domain={platform.ssoDomain}
      record={verification.record}
      refetch={refetch}
      onVerified={onVerified}
      secondaryAction={secondaryAction}
      showIntro={showIntro}
    />
  );
};

const DomainEntry = ({
  refetch,
  secondaryAction,
}: {
  refetch: () => Promise<void>;
  secondaryAction?: ReactNode;
}) => {
  const form = useForm<DomainFormValues>({
    defaultValues: { domain: '' },
    resolver: zodResolver(DomainFormValues),
    mode: 'onChange',
  });

  const { mutate: saveDomain, isPending } = useMutation({
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

  return (
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
              <FormControl>
                <Input {...field} placeholder="acme.com" autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root?.serverError && (
          <FormMessage>
            {form.formState.errors.root.serverError.message}
          </FormMessage>
        )}
        <Actions>
          {secondaryAction}
          <Button
            {...adminControl(AdminControl.SSO_SAML_DOMAIN_SUBMIT)}
            type="submit"
            loading={isPending}
            disabled={!form.formState.isValid}
          >
            {t('Continue')}
          </Button>
        </Actions>
      </form>
    </Form>
  );
};

const PendingDomain = ({
  domain,
  record,
  refetch,
  onVerified,
  secondaryAction,
  showIntro,
}: {
  domain: string;
  record: SsoDomainVerificationRecord;
  refetch: () => Promise<void>;
  onVerified?: () => void;
  secondaryAction?: ReactNode;
  showIntro: boolean;
}) => {
  const { mutate: verifyDomain, isPending } = ssoMutations.useVerifySsoDomain({
    refetch,
    onVerified,
  });

  return (
    <div className="flex flex-col gap-4">
      {showIntro && (
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-gray-12">
            {t('Verify {domain}', { domain })}
          </h3>
          <p className="text-sm text-gray-11">
            {t(
              'Add this TXT record at your DNS provider, then verify. Verify within 3 hours or the domain is dropped.',
            )}
          </p>
        </div>
      )}
      <DomainDnsRecord record={record} />
      <Actions>
        {secondaryAction}
        <Button
          {...adminControl(AdminControl.SSO_DOMAIN_DNS_RUN)}
          type="button"
          loading={isPending}
          onClick={() => verifyDomain()}
        >
          {t('Verify DNS')}
        </Button>
      </Actions>
    </div>
  );
};

const VerifiedDomain = ({ domain }: { domain: string }) => (
  <div className="flex items-center gap-3">
    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success-3 text-success-11">
      <Check className="size-5" />
    </div>
    <div className="flex min-w-0 flex-col">
      <span className="truncate text-base font-semibold text-gray-12">
        {domain}
      </span>
      <span className="text-sm text-success-11">{t('Verified')}</span>
    </div>
  </div>
);

const Actions = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    {children}
  </div>
);

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

type DomainVerificationProps = {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
  onVerified?: () => void;
  secondaryAction?: ReactNode;
  showIntro?: boolean;
};
