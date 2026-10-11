import {
  SsoDomainVerificationStatus,
  UpdatePlatformRequestBody,
} from '@activepieces/shared';
import { t } from 'i18next';
import { LockIcon, MailIcon, Earth } from 'lucide-react';

import { platformApi } from '@/api/platforms-api';
import {
  AdminPage,
  AdminPageHeader,
  InstantSwitch,
  SettingsPanel,
  SettingsRow,
  StatusDot,
  adminPageResources,
} from '@/app/components/admin';
import { AllowedDomainDialog } from '@/app/routes/platform/security/sso/allowed-domain';
import { ConfigureSamlDialog } from '@/app/routes/platform/security/sso/saml-dialog';
import { Badge } from '@/components/ui/badge';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl } from '@/lib/admin-control';

import GoogleIcon from '../../../../../assets/img/custom/auth/google-icon.svg';

const SSOPage = () => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();

  const samlConnected = !!platform.federatedAuthProviders?.saml;
  const ssoDomainVerified =
    platform.ssoDomainVerification?.status ===
    SsoDomainVerificationStatus.VERIFIED;
  const emailAuthEnabled = platform.emailAuthEnabled;
  const allowedDomains = platform.allowedAuthDomains ?? [];

  const updatePlatform = async (request: UpdatePlatformRequestBody) => {
    await platformApi.update(request, platform.id);
    await refetch();
  };
  const otherSignInEnabled = platform.googleAuthEnabled || samlConnected;

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
                  {allowedDomains.map((domain, index) => (
                    <Badge key={`${domain}-${index}`} variant="outline">
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
          <InstantSwitch
            controlId={AdminControl.SSO_GOOGLE_TOGGLE}
            aria-label="Google"
            checked={platform.googleAuthEnabled}
            onCheckedChange={(googleAuthEnabled) =>
              updatePlatform({ googleAuthEnabled })
            }
            undo
            successMessage={(on) =>
              on ? t('Google sign-in turned on') : t('Google sign-in turned off')
            }
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
          <InstantSwitch
            controlId={AdminControl.SSO_EMAIL_LOGIN_TOGGLE}
            aria-label={t('Allowed Email Login')}
            checked={emailAuthEnabled}
            onCheckedChange={(next) => updatePlatform({ emailAuthEnabled: next })}
            successMessage={(on) =>
              on ? t('Email sign-in turned on') : t('Email sign-in turned off')
            }
            confirmBefore={(next) =>
              next
                ? null
                : {
                    title: t('Turn off email sign-in?'),
                    consequence: otherSignInEnabled
                      ? t(
                          'People who sign in with an email and password, including you, will have to use Google or SAML instead.',
                        )
                      : t(
                          'No other sign-in method is on. Nobody, including you, will be able to sign in until one is set up.',
                        ),
                    confirmLabel: t('Turn off email sign-in'),
                  }
            }
          />
        </SettingsRow>
      </SettingsPanel>
    </AdminPage>
  );
};

SSOPage.displayName = 'SSOPage';
export { SSOPage };
