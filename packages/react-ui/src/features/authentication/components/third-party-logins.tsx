import { useQueryClient } from '@tanstack/react-query';
import React from 'react';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  ApFlagId,
  ThirdPartyAuthnProviderEnum,
  ThirdPartyAuthnProvidersToShowMap,
} from '@activepieces/shared';

import { flagsHooks } from '../../../hooks/flags-hooks';
import { authenticationApi } from '../../../lib/authentication-api';
import { oauth2Utils } from '../lib/oauth2-utils';

const ThirdPartyLogin = React.memo(() => {
  const queryClient = useQueryClient();
  const { data: thirdPartyAuthProviders } =
    flagsHooks.useFlag<ThirdPartyAuthnProvidersToShowMap>(
      ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP,
      queryClient,
    );
  const { data: thirdPartyRedirectUrl } = flagsHooks.useFlag<string>(
    ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL,
    queryClient,
  );

  const handleProviderClick = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    providerName: ThirdPartyAuthnProviderEnum,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const { loginUrl } = await authenticationApi.getFederatedAuthLoginUrl(
      providerName,
    );
    if (!loginUrl || !thirdPartyRedirectUrl) {
      toast({
        title: 'Error',
        description: 'Something went wrong, please try again later.',
        duration: 3000,
      });
      return;
    }
    await oauth2Utils.openWithLoginUrl(loginUrl, thirdPartyRedirectUrl);
  };

  return (
    <div className="flex flex-col gap-4">
      {thirdPartyAuthProviders?.google && (
        <Button
          variant="outline"
          className="w-full"
          onClick={(e) =>
            handleProviderClick(e, ThirdPartyAuthnProviderEnum.GOOGLE)
          }
        >
          Sign in with Google
        </Button>
      )}
      {thirdPartyAuthProviders?.github && (
        <Button
          variant="outline"
          className="w-full"
          onClick={(e) =>
            handleProviderClick(e, ThirdPartyAuthnProviderEnum.GITHUB)
          }
        >
          Sign in with Github
        </Button>
      )}
    </div>
  );
});

ThirdPartyLogin.displayName = 'ThirdPartyLogin';
export { ThirdPartyLogin };
