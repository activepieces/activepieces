import {
  SsoDomainVerificationStatus,
  UpdatePlatformRequestBody,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
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

import { ssoRules } from './sso-rules';

const SSOPage = () => {
  const { platform, refetch, setCurrentPlatform } =
    platformHooks.useCurrentPlatform();
  const queryClient = useQueryClient();

  const samlConnected = !!platform.federatedAuthProviders?.saml;
  const ssoDomainVerified =
    platform.ssoDomainVerification?.status ===
    SsoDomainVerificationStatus.VERIFIED;
  const emailAuthEnabled = platform.emailAuthEnabled;
  const allowedDomains = platform.allowedAuthDomains ?? [];

  const updatePlatform = async (request: UpdatePlatformRequestBody) => {
    const updated = await platformApi.update(request, platform.id);
    setCurrentPlatform(queryClient, updated);
  };
  const samlCanSignIn = samlConnected && ssoDomainVerified;
  const otherSignInEnabled = platform.googleAuthEnabled || samlCanSignIn;
  const signInOtherThanGoogle = emailAuthEnabled || samlCanSignIn;
  const emailIsOnlyMethod = emailAuthEnabled && !otherSignInEnabled;
  const googleIsOnlyMethod =
    platform.googleAuthEnabled && !signInOtherThanGoogle;

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
          description={
            googleIsOnlyMethod
              ? t(
                  "Allow logins through google's single sign-on functionality. Turn on email or SAML before turning this off, so people can still sign in.",
                )
              : t("Allow logins through google's single sign-on functionality.")
          }
        >
          <InstantSwitch
            controlId={AdminControl.SSO_GOOGLE_TOGGLE}
            aria-label="Google"
            checked={platform.googleAuthEnabled}
            beforeSave={(googleAuthEnabled) =>
              ssoRules.assertSignInRemains({ googleAuthEnabled })
            }
            blockedReason={
              googleIsOnlyMethod
                ? t(
                    'Google is the only way to sign in. Turn on email or SAML first.',
                  )
                : undefined
            }
            onCheckedChange={(googleAuthEnabled) =>
              updatePlatform({ googleAuthEnabled })
            }
            undo
            successMessage={(on) =>
              on
                ? t('Google sign-in turned on')
                : t('Google sign-in turned off')
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
          description={
            emailIsOnlyMethod
              ? t(
                  'Allow logins through email and password. Turn on Google or SAML before turning this off, so people can still sign in.',
                )
              : t('Allow logins through email and password.')
          }
        >
          <InstantSwitch
            controlId={AdminControl.SSO_EMAIL_LOGIN_TOGGLE}
            aria-label={t('Allowed Email Login')}
            checked={emailAuthEnabled}
            beforeSave={(next) =>
              ssoRules.assertSignInRemains({ emailAuthEnabled: next })
            }
            blockedReason={
              emailIsOnlyMethod
                ? t(
                    'Email is the only way to sign in. Turn on Google or SAML first.',
                  )
                : undefined
            }
            onCheckedChange={(next) =>
              updatePlatform({ emailAuthEnabled: next })
            }
            undo
            successMessage={(on) =>
              on ? t('Email sign-in turned on') : t('Email sign-in turned off')
            }
            confirmBefore={(next) =>
              next
                ? null
                : {
                    title: t('Turn off email sign-in?'),
                    consequence: t(
                      'People who sign in with an email and password will have to use Google or SAML instead.',
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
