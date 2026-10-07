import { SsoDomainVerificationStatus } from '@activepieces/shared';
import { t } from 'i18next';
import { LockIcon, MailIcon, Earth } from 'lucide-react';
import { toast } from 'sonner';

import {
  AdminPage,
  AdminPageHeader,
  SettingsPanel,
  SettingsRow,
  StatusDot,
  adminPageResources,
} from '@/app/components/admin';
import { AllowedDomainDialog } from '@/app/routes/platform/security/sso/allowed-domain';
import { ConfigureSamlDialog } from '@/app/routes/platform/security/sso/saml-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ssoMutations } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

import GoogleIcon from '../../../../../assets/img/custom/auth/google-icon.svg';

const SSOPage = () => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();

  const samlConnected = !!platform.federatedAuthProviders?.saml;
  const ssoDomainVerified =
    platform.ssoDomainVerification?.status ===
    SsoDomainVerificationStatus.VERIFIED;
  const emailAuthEnabled = platform.emailAuthEnabled;
  const allowedDomains = platform.allowedAuthDomains ?? [];

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
    <AdminPage width="content">
      <AdminPageHeader
        title={t('Single Sign On')}
        description={t('Manage single sign on providers')}
        resources={adminPageResources.sso}
      />
      <SettingsPanel flush>
        <SettingsRow
          icon={<Earth />}
          title={t('Allowed Domains')}
          description={
            <div className="flex flex-col gap-2">
              {t('Restrict authentication to specific email domains.')}
              {allowedDomains.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {allowedDomains.map((domain) => (
                    <Badge key={domain} variant="outline">
                      {domain}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          }
        >
          <AllowedDomainDialog platform={platform} refetch={refetch} />
        </SettingsRow>

        <SettingsRow
          icon={<img className="size-5" src={GoogleIcon} alt="icon" />}
          title="Google"
          description={t(
            "Allow logins through google's single sign-on functionality.",
          )}
        >
          <Switch
            {...adminControl(AdminControl.SSO_GOOGLE_TOGGLE)}
            aria-label="Google"
            checked={platform.googleAuthEnabled}
            onCheckedChange={() =>
              toggleGoogleAuth({
                googleAuthEnabled: !platform.googleAuthEnabled,
              })
            }
            disabled={isGoogleAuthPending}
          />
        </SettingsRow>

        <SettingsRow
          icon={<LockIcon />}
          title={t('SAML 2.0')}
          description={
            <div className="flex flex-col gap-2">
              {t(
                "Allow logins through saml 2.0's single sign-on functionality.",
              )}
              {platform.ssoDomain && (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{platform.ssoDomain}</Badge>
                  <StatusDot
                    tone={ssoDomainVerified ? 'success' : 'warning'}
                    className="text-xs text-gray-11"
                  >
                    {ssoDomainVerified
                      ? t('Verified')
                      : t('Pending verification')}
                  </StatusDot>
                </div>
              )}
            </div>
          }
        >
          <ConfigureSamlDialog
            platform={platform}
            refetch={refetch}
            connected={samlConnected}
          />
        </SettingsRow>

        <SettingsRow
          icon={<MailIcon />}
          title={t('Allowed Email Login')}
          description={t('Allow logins through email and password.')}
        >
          <Switch
            {...adminControl(AdminControl.SSO_EMAIL_LOGIN_TOGGLE)}
            aria-label={t('Allowed Email Login')}
            checked={emailAuthEnabled}
            onCheckedChange={() =>
              toggleEmailAuthentication({
                emailAuthEnabled: !platform.emailAuthEnabled,
              })
            }
            disabled={isEmailAuthPending}
          />
        </SettingsRow>
      </SettingsPanel>
    </AdminPage>
  );
};

SSOPage.displayName = 'SSOPage';
export { SSOPage };
