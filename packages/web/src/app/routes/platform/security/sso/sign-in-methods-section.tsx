import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import { t } from 'i18next';
import { LockKeyhole, MailIcon } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import {
  AdminSection,
  SettingsPanel,
  SettingsRow,
  StatusDot,
} from '@/app/components/admin';
import { MethodConfirmDialog } from '@/app/routes/platform/security/sso/method-confirm-dialog';
import { ssoPaths } from '@/app/routes/platform/security/sso/sso-paths';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ssoMutations } from '@/features/platform-admin';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import GoogleIcon from '../../../../../assets/img/custom/auth/google-icon.svg';

export const SignInMethodsSection = ({
  platform,
  refetch,
}: SignInMethodsSectionProps) => {
  const samlConnected = !!platform.federatedAuthProviders?.saml;
  const [googleChange, setGoogleChange] = useState<boolean | null>(null);
  const [emailChange, setEmailChange] = useState<boolean | null>(null);

  const { mutate: toggleGoogleAuth, isPending: isGoogleAuthPending } =
    ssoMutations.useUpdatePlatformSso({
      platformId: platform.id,
      refetch,
      onSuccess: () => {
        setGoogleChange(null);
        toast.success(t('Google authentication updated'), { duration: 3000 });
      },
    });

  const { mutate: toggleEmailAuth, isPending: isEmailAuthPending } =
    ssoMutations.useUpdatePlatformSso({
      platformId: platform.id,
      refetch,
      onSuccess: () => {
        setEmailChange(null);
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
          media={
            <MethodIcon on={samlConnected}>
              <LockKeyhole />
            </MethodIcon>
          }
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
          media={
            <MethodIcon on={platform.googleAuthEnabled}>
              <img
                className={cn(
                  'size-4',
                  !platform.googleAuthEnabled && 'grayscale',
                )}
                src={GoogleIcon}
                alt=""
              />
            </MethodIcon>
          }
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
            onCheckedChange={(checked) => setGoogleChange(checked)}
            disabled={isGoogleAuthPending}
          />
        </SettingsRow>

        <SettingsRow
          media={
            <MethodIcon on={platform.emailAuthEnabled}>
              <MailIcon />
            </MethodIcon>
          }
          title={t('Email and password')}
        >
          <Switch
            {...adminControl(AdminControl.SSO_EMAIL_LOGIN_TOGGLE)}
            aria-label={t('Email and password')}
            checked={platform.emailAuthEnabled}
            onCheckedChange={(checked) => setEmailChange(checked)}
            disabled={isEmailAuthPending}
          />
        </SettingsRow>
      </SettingsPanel>

      <MethodConfirmDialog
        open={googleChange !== null}
        onOpenChange={(open) => !open && setGoogleChange(null)}
        title={
          googleChange
            ? t('Turn on Google sign-in?')
            : t('Turn off Google sign-in?')
        }
        description={
          googleChange
            ? t('Google sign-in will be on for this platform.')
            : t('Google sign-in will be off for this platform.')
        }
        confirmLabel={googleChange ? t('Turn on') : t('Turn off')}
        destructive={googleChange === false}
        isPending={isGoogleAuthPending}
        controlId={AdminControl.SSO_GOOGLE_TOGGLE_CONFIRM}
        onConfirm={() =>
          googleChange !== null &&
          toggleGoogleAuth({ googleAuthEnabled: googleChange })
        }
      />

      <MethodConfirmDialog
        open={emailChange !== null}
        onOpenChange={(open) => !open && setEmailChange(null)}
        title={
          emailChange
            ? t('Turn on email sign-in?')
            : t('Turn off email sign-in?')
        }
        description={
          emailChange
            ? t('People can sign in with email and password again.')
            : t(
                'People can no longer sign in with email and password. Make sure another sign-in method works for you first.',
              )
        }
        confirmLabel={emailChange ? t('Turn on') : t('Turn off')}
        destructive={emailChange === false}
        isPending={isEmailAuthPending}
        controlId={AdminControl.SSO_EMAIL_LOGIN_TOGGLE_CONFIRM}
        onConfirm={() =>
          emailChange !== null &&
          toggleEmailAuth({ emailAuthEnabled: emailChange })
        }
      />
    </AdminSection>
  );
};

const MethodIcon = ({ on, children }: { on: boolean; children: ReactNode }) => (
  <div
    className={cn(
      'flex size-9 items-center justify-center rounded-lg border [&_svg]:size-4',
      on
        ? 'border-accent-7 bg-accent-3 text-accent-11'
        : 'bg-gray-3 text-gray-11 opacity-60',
    )}
  >
    {children}
  </div>
);

type SignInMethodsSectionProps = {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
};
