import { useMutation } from '@tanstack/react-query';
import { LockIcon, MailIcon } from 'lucide-react';
import React from 'react';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { NewOAuth2Dialog } from '@/app/routes/platform/settings/sso/oauth2-dialog';
import { ConfigureSamlDialog } from '@/app/routes/platform/settings/sso/saml-dialog';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { platformHooks } from '@/hooks/platform-hooks';
import { platformApi } from '@/lib/platforms-api';
import { isNil } from '@activepieces/shared';

import GithubIcon from '../../../../../assets/img/custom/auth/github.svg';
import GoogleIcon from '../../../../../assets/img/custom/auth/google-icon.svg';

type ProviderCardProps = {
  providerName: string;
  providerDescription?: string;
  providerIcon?: React.ReactNode;
  button: React.ReactNode;
};
const ProviderCard = ({
  providerName,
  providerIcon,
  providerDescription,
  button,
}: ProviderCardProps) => {
  return (
    <Card className="w-full px-4 py-4">
      <div className="flex w-full gap-2 justify-center items-center">
        <div className="flex flex-col gap-2 text-center mr-2">
          {providerIcon}
        </div>
        <div className="flex flex-grow  flex-col">
          <div className="text-lg">{providerName}</div>
          <div className="text-sm text-muted-foreground">
            {providerDescription ??
              `Allow logins through ${providerName.toLowerCase()}'s single sign-on functionality.`}
          </div>
        </div>
        <div className="flex flex-col justify-center items-center">
          {button}
        </div>
      </div>
    </Card>
  );
};

const SSOPage = () => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();

  const googleConnected = !isNil(platform.federatedAuthProviders?.google);
  const githubConnected = !isNil(platform.federatedAuthProviders?.github);
  const samlConnected = !isNil(platform.federatedAuthProviders?.saml);
  const emailAuthEnabled = platform.emailAuthEnabled;

  const { mutate: toggleEmailAuthentication, isPending } = useMutation({
    mutationFn: async () => {
      await platformApi.update(
        {
          emailAuthEnabled: !platform.emailAuthEnabled,
        },
        platform.id,
      );
      await refetch();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Email authentication updated',
        duration: 3000,
      });
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });
  return (
    <LockedFeatureGuard
      locked={!platform.ssoEnabled}
      lockTitle="Enable Single Sign On"
      lockDescription="Let your users sign in with your current SSO provider or give them self serve sign up access"
    >
      <div className="flex-col w-full">
        <div className="mb-4 flex">
          <div className="flex justify-between flex-row w-full">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold w-full">Single Sign On</h1>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <ProviderCard
            providerName="Google"
            providerIcon={
              <img src={GoogleIcon} alt="icon" width={32} height={32} />
            }
            button={
              <NewOAuth2Dialog
                providerDisplayName="Google"
                providerName="google"
                platform={platform}
                refetch={refetch}
                connected={googleConnected}
              />
            }
          />
          <ProviderCard
            providerName="GitHub"
            providerIcon={
              <img src={GithubIcon} alt="icon" width={32} height={32} />
            }
            button={
              <NewOAuth2Dialog
                providerDisplayName="Github"
                providerName="github"
                platform={platform}
                refetch={refetch}
                connected={githubConnected}
              />
            }
          />
          <ProviderCard
            providerName="SAML 2.0"
            providerIcon={<LockIcon className="w-[32px] h-[32px]" />}
            button={
              <ConfigureSamlDialog
                platform={platform}
                refetch={refetch}
                connected={samlConnected}
              />
            }
          />
          <ProviderCard
            providerName="Allowed Email Login"
            providerDescription="Allow logins through email and password."
            providerIcon={<MailIcon className="w-[32px] h-[32px]" />}
            button={
              <Switch
                checked={emailAuthEnabled}
                onCheckedChange={() => toggleEmailAuthentication()}
                disabled={isPending}
              />
            }
          />
        </div>
      </div>
    </LockedFeatureGuard>
  );
};

SSOPage.displayName = 'SSOPage';
export { SSOPage };
