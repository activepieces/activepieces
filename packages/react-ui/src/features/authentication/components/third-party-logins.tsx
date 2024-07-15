import {
  ApFlagId,
  ThirdPartyAuthnProviderEnum,
  ThirdPartyAuthnProvidersToShowMap,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import Github from '../../../assets/img/custom/auth/github.svg';
import GoogleIcon from '../../../assets/img/custom/auth/google-icon.svg';
import { authenticationApi } from '../lib/authentication-api';
import { authenticationSession } from '../lib/authentication-session';
import { oauth2Utils } from '../lib/oauth2-utils';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { flagsHooks } from '@/features/flags/lib/flags-hooks';

const ThirdPartyIcon = ({ icon }: { icon: string }) => {
  return <img src={icon} alt="icon" width={24} height={24} className="mr-2" />;
};

const ThirdPartyLogin = React.memo(() => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: thirdPartyAuthProviders } =
    flagsHooks.useFlag<ThirdPartyAuthnProvidersToShowMap>(
      ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP,
      queryClient
    );
  const { data: thirdPartyRedirectUrl } = flagsHooks.useFlag<string>(
    ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL,
    queryClient
  );

  const handleProviderClick = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    providerName: ThirdPartyAuthnProviderEnum
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const { loginUrl } = await authenticationApi.getFederatedAuthLoginUrl(
      providerName
    );

    if (!loginUrl || !thirdPartyRedirectUrl) {
      toast({
        title: 'Error',
        description: 'Something went wrong, please try again later.',
        duration: 3000,
      });
      return;
    }

    const { code } = await oauth2Utils.openWithLoginUrl(
      loginUrl,
      thirdPartyRedirectUrl
    );

    const data = await authenticationApi.claimThirdPartyRequest({
      providerName,
      code,
    });

    if (data.token) {
      authenticationSession.saveResponse(data);
      navigate('/flows');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {thirdPartyAuthProviders?.google && (
        <Button
          variant="outline"
          className="w-full rounded-sm"
          onClick={(e) =>
            handleProviderClick(e, ThirdPartyAuthnProviderEnum.GOOGLE)
          }
        >
          <ThirdPartyIcon icon={GoogleIcon} />
          Sign in with Google
        </Button>
      )}
      {thirdPartyAuthProviders?.github && (
        <Button
          variant="outline"
          className="w-full rounded-sm"
          onClick={(e) =>
            handleProviderClick(e, ThirdPartyAuthnProviderEnum.GITHUB)
          }
        >
          <ThirdPartyIcon icon={Github} />
          Sign in with Github
        </Button>
      )}
    </div>
  );
});

ThirdPartyLogin.displayName = 'ThirdPartyLogin';
export { ThirdPartyLogin };
