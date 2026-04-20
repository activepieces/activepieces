import {
  ApFlagId,
  assertNotNullOrUndefined,
  ThirdPartyAuthnProviderEnum,
  ThirdPartyAuthnProvidersToShowMap,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import React from 'react';

import { authenticationApi } from '@/api/authentication-api';
import GoogleIcon from '@/assets/img/custom/auth/google-icon.svg';
import SamlIcon from '@/assets/img/custom/auth/saml.svg';
import { Button } from '@/components/ui/button';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authClient } from '@/lib/better-auth';

const ThirdPartyIcon = ({ icon }: { icon: string }) => {
  return <img src={icon} alt="icon" width={24} height={24} className="mr-2" />;
};

const ThirdPartyLogin = React.memo(({ isSignUp }: { isSignUp: boolean }) => {
  const { data: thirdPartyAuthProviders } =
    flagsHooks.useFlag<ThirdPartyAuthnProvidersToShowMap>(
      ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP,
    );
  const { data: googleProviderData } = useQuery({
    queryKey: ['federated-provider-id', ThirdPartyAuthnProviderEnum.GOOGLE],
    queryFn: () =>
      authenticationApi.getFederatedProviderId({
        providerName: ThirdPartyAuthnProviderEnum.GOOGLE,
      }),
    staleTime: Infinity,
  });

  const { data: samlProviderData } = useQuery({
    queryKey: ['federated-provider-id', ThirdPartyAuthnProviderEnum.SAML],
    queryFn: () =>
      authenticationApi.getFederatedProviderId({
        providerName: ThirdPartyAuthnProviderEnum.SAML,
      }),
    staleTime: Infinity,
    enabled: thirdPartyAuthProviders?.saml === true,
  });

  const handleProviderClick = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    providerName: ThirdPartyAuthnProviderEnum,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const providerId =
      providerName === ThirdPartyAuthnProviderEnum.SAML
        ? samlProviderData?.providerId
        : googleProviderData?.providerId;
    assertNotNullOrUndefined(providerId, 'providerId');

    await authClient.signIn.sso({
      providerId: providerId,
      callbackURL: `/redirect?providerId=${providerId}`,
    });
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
          {isSignUp
            ? `${t(`Sign up With`)} ${t('Google')}`
            : `${t(`Sign in With`)} ${t('Google')}`}
        </Button>
      )}
      {thirdPartyAuthProviders?.saml && samlProviderData?.providerId && (
        <Button
          variant="outline"
          className="w-full rounded-sm"
          onClick={(e) =>
            handleProviderClick(e, ThirdPartyAuthnProviderEnum.SAML)
          }
        >
          <ThirdPartyIcon icon={SamlIcon} />
          {isSignUp
            ? `${t(`Sign up With`)} ${t('SAML')}`
            : `${t(`Sign in With`)} ${t('SAML')}`}
        </Button>
      )}
    </div>
  );
});

ThirdPartyLogin.displayName = 'ThirdPartyLogin';
export { ThirdPartyLogin };
