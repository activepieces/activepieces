import { t } from 'i18next';
import { LockIcon, MailIcon, Earth } from 'lucide-react';
import { toast } from 'sonner';

import { CenteredPage } from '@/app/components/centered-page';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { AllowedDomainDialog } from '@/app/routes/platform/security/sso/allowed-domain';
import { ConfigureSamlDialog } from '@/app/routes/platform/security/sso/saml-dialog';
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/custom/item';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ssoMutations } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

import GoogleIcon from '../../../../../assets/img/custom/auth/google-icon.svg';

const SSOPage = () => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();

  const samlConnected = !!platform.federatedAuthProviders?.saml;
  const emailAuthEnabled = platform.emailAuthEnabled;

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
    <LockedFeatureGuard
      featureKey="SSO"
      locked={!platform.plan.ssoEnabled}
      lockTitle={t('Enable Single Sign On')}
      lockDescription={t(
        'Let your users sign in with your current SSO provider or give them self serve sign up access',
      )}
    >
      <CenteredPage
        title={t('Single Sign On')}
        description={t('Manage single sign on providers')}
      >
        <div className="flex flex-col gap-4">
          <Item variant="outline">
            <ItemMedia variant="icon">
              <Earth />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{t('Allowed Domains')}</ItemTitle>
              <ItemDescription>
                {t('Restrict authentication to specific email domains.')}
              </ItemDescription>
              {(platform?.allowedAuthDomains ?? []).length > 0 && (
                <div className="mt-1 gap-2 flex">
                  {(platform?.allowedAuthDomains ?? []).map((text, index) => (
                    <Badge key={index} variant={'outline'}>
                      {text}
                    </Badge>
                  ))}
                </div>
              )}
            </ItemContent>
            <ItemActions>
              <AllowedDomainDialog platform={platform} refetch={refetch} />
            </ItemActions>
          </Item>

          <Item variant="outline">
            <ItemMedia variant="icon">
              <img className="size-6" src={GoogleIcon} alt="icon" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Google</ItemTitle>
              <ItemDescription>
                {t(
                  "Allow logins through google's single sign-on functionality.",
                )}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Switch
                checked={platform.googleAuthEnabled}
                onCheckedChange={() =>
                  toggleGoogleAuth({
                    googleAuthEnabled: !platform.googleAuthEnabled,
                  })
                }
                disabled={isGoogleAuthPending}
              />
            </ItemActions>
          </Item>

          <Item variant="outline">
            <ItemMedia variant="icon">
              <LockIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{t('SAML 2.0')}</ItemTitle>
              <ItemDescription>
                {t(
                  "Allow logins through saml 2.0's single sign-on functionality.",
                )}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <ConfigureSamlDialog
                platform={platform}
                refetch={refetch}
                connected={samlConnected}
              />
            </ItemActions>
          </Item>

          <Item variant="outline">
            <ItemMedia variant="icon">
              <MailIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{t('Allowed Email Login')}</ItemTitle>
              <ItemDescription>
                {t('Allow logins through email and password.')}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Switch
                checked={emailAuthEnabled}
                onCheckedChange={() =>
                  toggleEmailAuthentication({
                    emailAuthEnabled: !platform.emailAuthEnabled,
                  })
                }
                disabled={isEmailAuthPending}
              />
            </ItemActions>
          </Item>
        </div>
      </CenteredPage>
    </LockedFeatureGuard>
  );
};

SSOPage.displayName = 'SSOPage';
export { SSOPage };
