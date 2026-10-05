import { SsoDomainVerificationStatus } from '@activepieces/shared';
import { t } from 'i18next';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { AdminPageHeader } from '@/app/routes/platform/admin-page-header';
import { AllowedDomainsPanel } from '@/app/routes/platform/security/sso/allowed-domain';
import {
  SamlDangerZone,
  SamlDetailsPanel,
} from '@/app/routes/platform/security/sso/saml-details-panel';
import { ConfigureSamlDialog } from '@/app/routes/platform/security/sso/saml-dialog';
import { Page } from '@/components/custom/page';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { StatusDot } from '@/components/custom/status-dot';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ssoMutations } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

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
      <AdminPageHeader page="sso" />

      <Panel title={t('Ways to sign in')} flush>
        <SettingRows>
          <SettingRow
            title={t('Email and password')}
            description={t('Turning this off leaves only the providers below.')}
          >
            <Switch
              {...adminControl(AdminControl.SSO_EMAIL_LOGIN_TOGGLE)}
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
              {...adminControl(AdminControl.SSO_GOOGLE_TOGGLE)}
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
                  <Button
                    {...adminControl(AdminControl.SSO_SAML_OPEN)}
                    variant="outline"
                    size="sm"
                  >
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
                <Button
                  {...adminControl(AdminControl.SSO_SAML_OPEN)}
                  size="sm"
                  variant="outline"
                >
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
