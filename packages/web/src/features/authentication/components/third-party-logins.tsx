import {
  ApFlagId,
  ThirdPartyAuthnProviderEnum,
  ThirdPartyAuthnProvidersToShowMap,
} from '@activepieces/shared';
import { t } from 'i18next';
import React from 'react';

import { authenticationApi } from '@/api/authentication-api';
import GoogleIcon from '@/assets/img/custom/auth/google-icon.svg';
import SamlIcon from '@/assets/img/custom/auth/saml.svg';
import { Button } from '@/components/ui/button';
import { internalErrorToast } from '@/components/ui/sonner';
import { SamlDomainDialog } from '@/features/authentication/components/saml-domain-dialog';
import { oauth2Utils } from '@/features/connections/utils/oauth2-utils';
import { flagsHooks } from '@/hooks/flags-hooks';

const ThirdPartyIcon = ({ icon }: { icon: string }) => {
  return <img src={icon} alt="icon" width={24} height={24} className="mr-2" />;
};

const ThirdPartyLogin = React.memo(({ isSignUp }: { isSignUp: boolean }) => {
  const { data: thirdPartyAuthProviders } =
    flagsHooks.useFlag<ThirdPartyAuthnProvidersToShowMap>(
      ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP,
    );
  const { data: thirdPartyRedirectUrl } = flagsHooks.useFlag<string>(
    ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL,
  );
  const thirdPartyLogin = oauth2Utils.useThirdPartyLogin();

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
      internalErrorToast();
      return;
    }
    thirdPartyLogin(loginUrl, providerName);
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
      {thirdPartyAuthProviders?.saml && (
        <SamlDomainDialog>
          <Button variant="outline" className="w-full rounded-sm">
            <ThirdPartyIcon icon={SamlIcon} />
            {isSignUp
              ? `${t(`Sign up With`)} ${t('SAML')}`
              : `${t(`Sign in With`)} ${t('SAML')}`}
          </Button>
        </SamlDomainDialog>
      )}
    </div>
  );
});

ThirdPartyLogin.displayName = 'ThirdPartyLogin';
export { ThirdPartyLogin };
