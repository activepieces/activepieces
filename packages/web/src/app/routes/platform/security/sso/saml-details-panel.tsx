import {
  ApFlagId,
  PlatformWithoutSensitiveData,
  SsoDomainVerificationStatus,
} from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';
import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { StatusDot } from '@/components/custom/status-dot';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { samlSsoApi } from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';

import { ConfigureSamlDialog } from './saml-dialog';

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
      toast.error(
        api.extractServerErrorMessage(error, t("Couldn't verify domain")),
      );
    },
  });

  return (
    <Panel title={t('SAML 2.0')} flush>
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
        <div className="flex flex-col gap-4 border-t border-gray-6 p-4">
          <p className="text-sm text-gray-11">
            {t(
              "Add this TXT record at your DNS provider. We'll detect it once it propagates — this usually takes a few minutes.",
            )}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CopyField label={t('Name')} value={verification.record.name} />
            <CopyField label={t('Value')} value={verification.record.value} />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            loading={isVerifying}
            onClick={() => verifyDomain()}
          >
            <RefreshCw />
            {t('Check DNS now')}
          </Button>
        </div>
      )}

      {connected && (
        <div className="flex flex-col gap-4 border-t border-gray-6 p-4">
          {samlAcs && (
            <CopyField label={t('Single sign-on URL')} value={samlAcs} />
          )}
          <CopyField
            label={t('Audience URI (SP entity ID)')}
            value="Activepieces"
          />
        </div>
      )}

      {connected && (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-6 p-4">
          <ConfigureSamlDialog platform={platform} refetch={refetch} connected>
            <Button variant="outline">{t('Replace metadata')}</Button>
          </ConfigureSamlDialog>
          <ConfirmDialog
            title={t('Disable SAML?')}
            description={t(
              'People will no longer be able to sign in through your identity provider.',
            )}
            confirmLabel={t('Disable SAML')}
            successMessage={t('Single sign-on settings updated')}
            onConfirm={async () => {
              await platformApi.update(
                { federatedAuthProviders: { saml: null } },
                platform.id,
              );
              await refetch();
            }}
          >
            <Button variant="destructive">{t('Disable SAML')}</Button>
          </ConfirmDialog>
        </div>
      )}
    </Panel>
  );
};

const CopyField = ({ label, value }: { label: string; value: string }) => (
  <div className="flex min-w-0 flex-col gap-2">
    <Label>{label}</Label>
    <CopyToClipboardInput textToCopy={value} useInput={true} />
  </div>
);

type SamlDetailsPanelProps = {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
  connected: boolean;
};
