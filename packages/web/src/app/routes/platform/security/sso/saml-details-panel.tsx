import {
  ApFlagId,
  PlatformWithoutSensitiveData,
  SsoDomainVerificationStatus,
} from '@activepieces/shared';
import { RefreshIcon } from '@hugeicons/core-free-icons';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { CopyField, DangerZone } from '@/components/custom/settings-parts';
import { StatusDot } from '@/components/custom/status-dot';
import { Button } from '@/components/ui/button';
import { samlSsoApi } from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';

export const SamlDetailsPanel = ({
  platform,
  refetch,
  connected,
}: SamlDetailsPanelProps) => {
  const { data: samlAcs } = flagsHooks.useFlag<string>(
    ApFlagId.SAML_AUTH_ACS_URL,
  );
  const verification = platform.ssoDomainVerification ?? null;
  const verified =
    verification?.status === SsoDomainVerificationStatus.VERIFIED;

  const { mutate: verifyDomain, isPending: isVerifying } = useMutation({
    mutationFn: async () => {
      const result = await samlSsoApi.verifySsoDomain();
      await refetch();
      return result;
    },
    onSuccess: (result) => {
      if (
        result.ssoDomainVerification?.status ===
        SsoDomainVerificationStatus.VERIFIED
      ) {
        toast.success(t('Domain verified'));
      } else {
        toast.message(
          t('TXT record not found yet — DNS can take a few minutes.'),
        );
      }
    },
    onError: (error) => {
      mutationFeedback.error({ error, title: t("Couldn't verify domain") });
    },
  });

  return (
    <Panel title={t('SAML details')} flush>
      <SettingRows>
        <SettingRow
          title={t('SSO domain')}
          description={t(
            'People with an email on this domain are sent to your identity provider.',
          )}
        >
          <span className="text-sm text-gray-12">{platform.ssoDomain}</span>
          {verification && (
            <StatusDot tone={verified ? 'success' : 'warning'}>
              {verified ? t('Verified') : t('Waiting for DNS')}
            </StatusDot>
          )}
        </SettingRow>
      </SettingRows>

      {verification && !verified && (
        <div className="flex flex-col gap-4 border-t border-gray-6 p-5">
          <p className="text-sm text-gray-11">
            {t(
              "Add this TXT record at your DNS provider. We'll detect it once it propagates — this usually takes a few minutes.",
            )}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CopyField
              label={t('Name')}
              value={verification.record.name}
              controlId={AdminControl.SSO_SAML_DNS_NAME_COPY}
            />
            <CopyField
              label={t('Value')}
              value={verification.record.value}
              controlId={AdminControl.SSO_SAML_DNS_VALUE_COPY}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            loading={isVerifying}
            {...adminControl(AdminControl.SSO_SAML_DNS_RUN)}
            onClick={() => verifyDomain()}
          >
            <HugeiconsIcon icon={RefreshIcon} />
            {t('Check DNS now')}
          </Button>
        </div>
      )}

      {connected && (
        <div className="flex flex-col gap-4 border-t border-gray-6 p-5">
          {samlAcs && (
            <CopyField label={t('Single sign-on URL')} value={samlAcs} />
          )}
          <CopyField
            label={t('Audience URI (SP entity ID)')}
            value="Activepieces"
          />
        </div>
      )}
    </Panel>
  );
};

export const SamlDangerZone = ({
  platform,
  refetch,
}: {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
}) => (
  <DangerZone
    actions={[
      {
        title: t('Disable SAML'),
        description: t(
          'People will no longer be able to sign in through your identity provider.',
        ),
        control: (
          <DisableSamlConfirm platform={platform} refetch={refetch}>
            <Button variant="outline" size="sm">
              {t('Disable SAML')}
            </Button>
          </DisableSamlConfirm>
        ),
      },
    ]}
  />
);

export const DisableSamlConfirm = ({
  platform,
  refetch,
  onDisabled,
  children,
}: {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
  onDisabled?: () => void;
  children: React.ReactNode;
}) => (
  <ConfirmDialog
    title={t('Disable SAML?')}
    description={t(
      'People will no longer be able to sign in through your identity provider.',
    )}
    consequence={
      platform.emailAuthEnabled || platform.googleAuthEnabled
        ? t(
            'To turn it back on you paste the identity provider metadata and certificate again.',
          )
        : t(
            'SAML is the only way to sign in right now. Turn on email or Google sign-in first.',
          )
    }
    confirmDisabled={!platform.emailAuthEnabled && !platform.googleAuthEnabled}
    confirmLabel={t('Disable SAML')}
    successMessage={t('SAML disabled')}
    errorTitle={t("Couldn't disable SAML")}
    onConfirm={async () => {
      await platformApi.update(
        { federatedAuthProviders: { saml: null } },
        platform.id,
      );
      await refetch();
      onDisabled?.();
    }}
    controlId={AdminControl.SSO_SAML_DISABLE_RUN}
  >
    {children}
  </ConfirmDialog>
);

type SamlDetailsPanelProps = {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
  connected: boolean;
};
