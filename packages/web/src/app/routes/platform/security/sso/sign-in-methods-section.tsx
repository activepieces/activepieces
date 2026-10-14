import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import { t } from 'i18next';
import { LockKeyhole, MailIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import {
  AdminSection,
  SettingsPanel,
  SettingsRow,
  StatusDot,
} from '@/app/components/admin';
import { ssoPaths } from '@/app/routes/platform/security/sso/sso-paths';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ssoMutations } from '@/features/platform-admin';
import { AdminControl, adminControl } from '@/lib/admin-control';

import GoogleIcon from '../../../../../assets/img/custom/auth/google-icon.svg';

export const SignInMethodsSection = ({
  platform,
  refetch,
}: SignInMethodsSectionProps) => {
  const samlConnected = !!platform.federatedAuthProviders?.saml;

  const { mutate: toggleGoogleAuth, isPending: isGoogleAuthPending } =
    ssoMutations.useUpdatePlatformSso({
      platformId: platform.id,
      refetch,
      onSuccess: () => {
        toast.success(t('Google authentication updated'), { duration: 3000 });
      },
    });

  const { mutate: toggleEmailAuth, isPending: isEmailAuthPending } =
    ssoMutations.useUpdatePlatformSso({
      platformId: platform.id,
      refetch,
      onSuccess: () => {
        toast.success(t('Email authentication updated'), { duration: 3000 });
      },
    });

  return (
    <AdminSection
      title={t('Sign-in methods')}
      description={t('Choose how people at your verified domain sign in.')}
    >
      <SettingsPanel flush>
        <SettingsRow
          icon={<LockKeyhole />}
          title={
            <>
              {t('Single sign-on')}
              <Badge variant="outline">{t('SAML 2.0')}</Badge>
              {samlConnected && (
                <StatusDot tone="success" className="text-xs text-gray-11">
                  {t('Connected')}
                </StatusDot>
              )}
            </>
          }
        >
          <Button asChild size="sm" variant="outline">
            <Link
              {...adminControl(AdminControl.SSO_SAML_OPEN)}
              to={ssoPaths.samlSetup}
            >
              {samlConnected ? t('Manage') : t('Set up')}
            </Link>
          </Button>
        </SettingsRow>

        <SettingsRow
          icon={<img className="size-4" src={GoogleIcon} alt="" />}
          title={
            <>
              {t('Continue with Google')}
              <Badge variant="outline">{t('OAuth 2.0')}</Badge>
            </>
          }
        >
          <Switch
            {...adminControl(AdminControl.SSO_GOOGLE_TOGGLE)}
            aria-label={t('Continue with Google')}
            checked={platform.googleAuthEnabled}
            onCheckedChange={() =>
              toggleGoogleAuth({
                googleAuthEnabled: !platform.googleAuthEnabled,
              })
            }
            disabled={isGoogleAuthPending}
          />
        </SettingsRow>

        <SettingsRow icon={<MailIcon />} title={t('Email and password')}>
          <Switch
            {...adminControl(AdminControl.SSO_EMAIL_LOGIN_TOGGLE)}
            aria-label={t('Email and password')}
            checked={platform.emailAuthEnabled}
            onCheckedChange={() =>
              toggleEmailAuth({
                emailAuthEnabled: !platform.emailAuthEnabled,
              })
            }
            disabled={isEmailAuthPending}
          />
        </SettingsRow>
      </SettingsPanel>
    </AdminSection>
  );
};

type SignInMethodsSectionProps = {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
};
