import { ErrorCode, isNil } from '@activepieces/core-utils';
import {
  EmailDomain,
  EmailDomainWithUsage,
  SsoDomainVerificationStatus,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { emailDomainMutations } from '@/features/platform-admin';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { api } from '@/lib/api';
import { DomainVerificationStatus } from '@/lib/statuses';

export const DomainVerification = ({
  emailDomain,
  refetchPlatform,
  onAdded,
  onVerified,
  onLocked,
  secondaryAction,
  nextAction,
  showIntro = true,
}: DomainVerificationProps) => {
  if (isNil(emailDomain)) {
    return (
      <DomainEntry
        onAdded={onAdded}
        onLocked={onLocked}
        secondaryAction={secondaryAction}
        nextAction={nextAction}
      />
    );
  }
  if (emailDomain.verificationStatus === SsoDomainVerificationStatus.VERIFIED) {
    return (
      <VerifiedDomain domain={emailDomain.domain} nextAction={nextAction} />
    );
  }
  return (
    <PendingDomain
      emailDomain={emailDomain}
      refetchPlatform={refetchPlatform}
      onVerified={onVerified}
      onLocked={onLocked}
      secondaryAction={secondaryAction}
      nextAction={nextAction}
      showIntro={showIntro}
    />
  );
};

const DomainEntry = ({
  onAdded,
  onLocked,
  secondaryAction,
  nextAction,
}: {
  onAdded: (emailDomain: EmailDomain) => void;
  onLocked: () => void;
  secondaryAction?: ReactNode;
  nextAction?: ReactNode;
}) => {
  const form = useForm<DomainFormValues>({
    defaultValues: { domain: '' },
    resolver: zodResolver(DomainFormValues),
    mode: 'onChange',
  });

  const { mutate: addDomain, isPending } =
    emailDomainMutations.useAddEmailDomain({ onAdded, onLocked });

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((values) =>
          addDomain(values.domain, {
            onError: (error) => {
              if (api.isApError(error, ErrorCode.FEATURE_DISABLED)) {
                return;
              }
              form.setError('root.serverError', {
                type: 'manual',
                message: api.extractServerErrorMessage(
                  error,
                  t("Couldn't save domain"),
                ),
              });
            },
          }),
        )}
      >
        <FormField
          control={form.control}
          name="domain"
          render={({ field }) => (
            <FormItem className="grid space-y-2">
              <FormLabel>{t('Domain')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  data-testid="sso-domain-input"
                  onChange={(event) => {
                    form.clearErrors('root.serverError');
                    field.onChange(event);
                  }}
                  placeholder="acme.com"
                  autoFocus
                />
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
            data-testid="sso-domain-submit"
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
  emailDomain,
  refetchPlatform,
  onVerified,
  onLocked,
  secondaryAction,
  nextAction,
  showIntro,
}: {
  emailDomain: EmailDomainWithUsage;
  refetchPlatform: () => Promise<void>;
  onVerified?: () => void;
  onLocked: () => void;
  secondaryAction?: ReactNode;
  nextAction?: ReactNode;
  showIntro: boolean;
}) => {
  const { mutate: verifyDomain, isPending } =
    emailDomainMutations.useVerifyEmailDomain({
      refetchPlatform,
      onVerified,
      onLocked,
    });

  return (
    <div className="flex flex-col gap-4">
      {showIntro && (
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-gray-12">
            {t('Verify {domain}', { domain: emailDomain.domain })}
          </h3>
          <p className="text-sm text-gray-11">
            {t(
              'Add this TXT record at your DNS provider, then verify. Verify within 7 days or the domain is dropped.',
            )}
          </p>
        </div>
      )}
      <DomainDnsRecord emailDomain={emailDomain} />
      <FormActions trailing={nextAction}>
        {secondaryAction}
        <Button
          {...adminControl(AdminControl.SSO_DOMAIN_DNS_RUN)}
          data-testid="sso-domain-verify"
          type="button"
          loading={isPending}
          onClick={() => verifyDomain(emailDomain.id)}
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
        <StatusDot
          status={DomainVerificationStatus.VERIFIED}
          className="text-xs text-gray-11"
        >
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
  emailDomain: EmailDomainWithUsage | null;
  refetchPlatform: () => Promise<void>;
  onAdded: (emailDomain: EmailDomain) => void;
  onVerified?: () => void;
  onLocked: () => void;
  secondaryAction?: ReactNode;
  nextAction?: ReactNode;
  showIntro?: boolean;
};
