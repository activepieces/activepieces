import {
  PlatformWithoutSensitiveData,
  SsoDomainVerificationRecord,
  SsoDomainVerificationStatus,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { SettingsPanel, SettingsRow, StatusDot } from '@/app/components/admin';
import { DomainDnsRecord } from '@/app/routes/platform/security/sso/domain-dns-record';
import { domainSchema } from '@/app/routes/platform/security/sso/domain-schema';
import { DomainStatusIcon } from '@/app/routes/platform/security/sso/domain-status-icon';
import { FormActions } from '@/app/routes/platform/security/sso/form-actions';
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
  nextAction,
  showIntro = true,
}: DomainVerificationProps) => {
  const verification = platform.ssoDomainVerification;
  if (!platform.ssoDomain || !verification) {
    return (
      <DomainEntry
        refetch={refetch}
        secondaryAction={secondaryAction}
        nextAction={nextAction}
      />
    );
  }
  if (verification.status === SsoDomainVerificationStatus.VERIFIED) {
    return (
      <VerifiedDomain domain={platform.ssoDomain} nextAction={nextAction} />
    );
  }
  return (
    <PendingDomain
      domain={platform.ssoDomain}
      record={verification.record}
      refetch={refetch}
      onVerified={onVerified}
      secondaryAction={secondaryAction}
      nextAction={nextAction}
      showIntro={showIntro}
    />
  );
};

const DomainEntry = ({
  refetch,
  secondaryAction,
  nextAction,
}: {
  refetch: () => Promise<void>;
  secondaryAction?: ReactNode;
  nextAction?: ReactNode;
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
        <FormActions trailing={nextAction}>
          {secondaryAction}
          <Button
            {...adminControl(AdminControl.SSO_SAML_DOMAIN_SUBMIT)}
            type="submit"
            loading={isPending}
            disabled={!form.formState.isValid}
          >
            {t('Continue')}
          </Button>
        </FormActions>
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
  nextAction,
  showIntro,
}: {
  domain: string;
  record: SsoDomainVerificationRecord;
  refetch: () => Promise<void>;
  onVerified?: () => void;
  secondaryAction?: ReactNode;
  nextAction?: ReactNode;
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
              'Add this TXT record at your DNS provider, then verify. Verify within 7 days or the domain is dropped.',
            )}
          </p>
        </div>
      )}
      <DomainDnsRecord record={record} />
      <FormActions trailing={nextAction}>
        {secondaryAction}
        <Button
          {...adminControl(AdminControl.SSO_DOMAIN_DNS_RUN)}
          type="button"
          loading={isPending}
          onClick={() => verifyDomain()}
        >
          {t('Verify DNS')}
        </Button>
      </FormActions>
    </div>
  );
};

const VerifiedDomain = ({
  domain,
  nextAction,
}: {
  domain: string;
  nextAction?: ReactNode;
}) => (
  <div className="flex flex-col gap-3">
    <p className="text-sm text-gray-11">
      {t('Your domain is verified. Next, connect your identity provider.')}
    </p>
    <SettingsPanel flush>
      <SettingsRow
        media={<DomainStatusIcon status="verified" />}
        title={domain}
      >
        <StatusDot tone="success" className="text-xs text-gray-11">
          {t('Verified')}
        </StatusDot>
      </SettingsRow>
    </SettingsPanel>
    {nextAction && <FormActions trailing={nextAction} />}
  </div>
);

const DomainFormValues = z.object({ domain: domainSchema });
type DomainFormValues = { domain: string };

type DomainVerificationProps = {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
  onVerified?: () => void;
  secondaryAction?: ReactNode;
  nextAction?: ReactNode;
  showIntro?: boolean;
};
