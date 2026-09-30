import { SsoDomainVerificationStatus } from '@activepieces/shared';
import { t } from 'i18next';
import { CheckCircle, LockIcon, MailIcon, Earth } from 'lucide-react';
import { toast } from 'sonner';

import { AllowedDomainDialog } from '@/app/routes/platform/security/sso/allowed-domain';
import { ConfigureSamlDialog } from '@/app/routes/platform/security/sso/saml-dialog';
import { Page, PageHeader } from '@/components/custom/page';
import { Panel, SettingRows } from '@/components/custom/panel';
import { Badge } from '@/components/ui/badge';
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/ui/item';
import { Switch } from '@/components/ui/switch';
import { ssoMutations } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

import GoogleIcon from '../../../../../assets/img/custom/auth/google-icon.svg';

const SSOPage = () => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();

  const samlConnected = !!platform.federatedAuthProviders?.saml;
  const ssoDomainVerified =
    platform.ssoDomainVerification?.status ===
    SsoDomainVerificationStatus.VERIFIED;
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
    <Page width="narrow">
      <PageHeader
        title={t('Single Sign On')}
        description={t('Manage single sign on providers')}
      />
      <Panel flush>
        <SettingRows>
          <Item>
            <ItemMedia variant="icon">
              <Earth />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{t('Allowed Domains')}</ItemTitle>
              <ItemDescription>
                {t('Restrict authentication to specific email domains.')}
              </ItemDescription>
              {(platform?.allowedAuthDomains ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2">
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

          <Item>
            <ItemMedia variant="icon">
              <img className="size-5" src={GoogleIcon} alt="icon" />
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

          <Item>
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
              {platform.ssoDomain && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{platform.ssoDomain}</Badge>
                  {ssoDomainVerified ? (
                    <span className="flex items-center gap-1 text-sm text-success-11">
                      <CheckCircle className="size-4" />
                      {t('Verified')}
                    </span>
                  ) : (
                    <span className="text-sm text-warning-11">
                      {t('Pending verification')}
                    </span>
                  )}
                </div>
              )}
            </ItemContent>
            <ItemActions>
              <ConfigureSamlDialog
                platform={platform}
                refetch={refetch}
                connected={samlConnected}
              />
            </ItemActions>
          </Item>

          <Item>
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
        </SettingRows>
      </Panel>
    </Page>
  );
};

SSOPage.displayName = 'SSOPage';
export { SSOPage };
