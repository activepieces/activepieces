import { SsoDomainVerificationStatus } from '@activepieces/shared';
import { t } from 'i18next';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { AllowedDomainsPanel } from '@/app/routes/platform/security/sso/allowed-domain';
import {
  SamlDangerZone,
  SamlDetailsPanel,
} from '@/app/routes/platform/security/sso/saml-details-panel';
import { ConfigureSamlDialog } from '@/app/routes/platform/security/sso/saml-dialog';
import { Page, PageHeader } from '@/components/custom/page';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { StatusDot } from '@/components/custom/status-dot';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ssoMutations } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

const SSOPage = () => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();

  const samlConnected = !!platform.federatedAuthProviders?.saml;
  const ssoDomainVerified =
    platform.ssoDomainVerification?.status ===
    SsoDomainVerificationStatus.VERIFIED;

  const { mutate: toggleEmailAuthentication, isPending: isEmailAuthPending } =
    ssoMutations.useUpdatePlatformSso({
      platformId: platform.id,
      refetch,
      onSuccess: () => {
        toast.success(t('Email authentication updated'), { duration: 3000 });
      },
    });

  const { mutate: toggleGoogleAuth, isPending: isGoogleAuthPending } =
    ssoMutations.useUpdatePlatformSso({
      platformId: platform.id,
      refetch,
      onSuccess: () => {
        toast.success(t('Google authentication updated'), { duration: 3000 });
      },
    });

  return (
    <Page width="narrow">
      <PageHeader
        title={t('Single sign-on')}
        description={t(
          'How people sign in to this platform, and which email domains may join it.',
        )}
      />

      <Panel title={t('Ways to sign in')} flush>
        <SettingRows>
          <SettingRow
            title={t('Email and password')}
            description={t('Turning this off leaves only the providers below.')}
          >
            <Switch
              aria-label={t('Email and password')}
              checked={platform.emailAuthEnabled}
              onCheckedChange={() =>
                toggleEmailAuthentication({
                  emailAuthEnabled: !platform.emailAuthEnabled,
                })
              }
              disabled={isEmailAuthPending}
            />
          </SettingRow>
          <SettingRow
            title={t('Google')}
            description={t('People sign in with their Google account.')}
          >
            <Switch
              aria-label={t('Google')}
              checked={platform.googleAuthEnabled}
              onCheckedChange={() =>
                toggleGoogleAuth({
                  googleAuthEnabled: !platform.googleAuthEnabled,
                })
              }
              disabled={isGoogleAuthPending}
            />
          </SettingRow>
          <SettingRow
            title={t('SAML 2.0')}
            description={
              platform.ssoDomain
                ? t('Domain {domain}', { domain: platform.ssoDomain })
                : t(
                    'Connect an identity provider so people sign in with the account your company already gave them.',
                  )
            }
          >
            {samlConnected ? (
              <>
                <StatusDot tone={ssoDomainVerified ? 'success' : 'warning'}>
                  {ssoDomainVerified ? t('Connected') : t('Waiting for DNS')}
                </StatusDot>
                <ConfigureSamlDialog
                  platform={platform}
                  refetch={refetch}
                  connected
                >
                  <Button variant="outline" size="sm">
                    <Pencil />
                    {t('Edit')}
                  </Button>
                </ConfigureSamlDialog>
              </>
            ) : (
              <ConfigureSamlDialog
                platform={platform}
                refetch={refetch}
                connected={false}
              >
                <Button size="sm" variant="outline">
                  {t('Set up')}
                </Button>
              </ConfigureSamlDialog>
            )}
          </SettingRow>
        </SettingRows>
      </Panel>

      <AllowedDomainsPanel platform={platform} refetch={refetch} />

      {(samlConnected || platform.ssoDomain) && (
        <SamlDetailsPanel
          platform={platform}
          refetch={refetch}
          connected={samlConnected}
        />
      )}

      {samlConnected && (
        <SamlDangerZone platform={platform} refetch={refetch} />
      )}
    </Page>
  );
};

SSOPage.displayName = 'SSOPage';
export { SSOPage };
