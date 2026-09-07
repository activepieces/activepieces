import {
  ApEdition,
  ApFlagId,
  ThirdPartyAuthnProviderEnum,
  ThirdPartyAuthnProvidersToShowMap,
  TelemetryEventName,
} from '@activepieces/shared';
import { t } from 'i18next';
import React from 'react';

import { authenticationApi } from '@/api/authentication-api';
import GoogleIcon from '@/assets/img/custom/auth/google-icon.svg';
import SamlIcon from '@/assets/img/custom/auth/saml.svg';
import { useTelemetry } from '@/components/providers/telemetry-provider';
import { Button } from '@/components/ui/button';
import { internalErrorToast } from '@/components/ui/sonner';
import { oauth2Utils } from '@/features/connections/utils/oauth2-utils';
import { flagsHooks } from '@/hooks/flags-hooks';

// Mirrors the render gates below so callers can hide surrounding chrome — an
// "or" divider — or place each provider themselves. SAML is offered on cloud
// for enterprise SSO, and self-hosted only once a SAML config exists.
function useThirdPartyAvailability(): ThirdPartyAvailability {
  const { data: thirdPartyAuthProviders } =
    flagsHooks.useFlag<ThirdPartyAuthnProvidersToShowMap>(
      ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP,
    );
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCloud = edition === ApEdition.CLOUD;
  return {
    google: Boolean(thirdPartyAuthProviders?.google),
    saml: isCloud || Boolean(thirdPartyAuthProviders?.saml),
    samlIsCloud: isCloud,
  };
}

function useShowThirdPartyProviders(): boolean {
  const { google, saml } = useThirdPartyAvailability();
  return google || saml;
}

const ThirdPartyIcon = ({ icon }: { icon: string }) => {
  return <img src={icon} alt="icon" width={18} height={18} className="mr-2" />;
};

const ThirdPartyLogin = React.memo(
  ({
    isSignUp,
    onSamlClick,
    hideSaml = false,
  }: {
    isSignUp: boolean;
    onSamlClick: () => void;
    hideSaml?: boolean;
  }) => {
    const { data: thirdPartyAuthProviders } =
      flagsHooks.useFlag<ThirdPartyAuthnProvidersToShowMap>(
        ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP,
      );
    const { data: thirdPartyRedirectUrl } = flagsHooks.useFlag<string>(
      ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL,
    );
    const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
    const isCloud = edition === ApEdition.CLOUD;
    const thirdPartyLogin = oauth2Utils.useThirdPartyLogin();
    const { capture } = useTelemetry();
    const availability = useThirdPartyAvailability();
    const showProviders =
      availability.google || (!hideSaml && availability.saml);

    const handleProviderClick = async (
      event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
      providerName: ThirdPartyAuthnProviderEnum,
    ) => {
      event.preventDefault();
      event.stopPropagation();
      capture({
        name: TelemetryEventName.FEDERATED_LOGIN_STARTED,
        payload: {
          provider:
            providerName === ThirdPartyAuthnProviderEnum.GOOGLE
              ? 'google'
              : 'saml',
        },
      });
      const { loginUrl } = await authenticationApi.getFederatedAuthLoginUrl(
        providerName,
      );

      if (!loginUrl || !thirdPartyRedirectUrl) {
        internalErrorToast();
        return;
      }
      thirdPartyLogin(loginUrl, providerName);
    };

    if (!showProviders) {
      return null;
    }

    return (
      <div className="flex flex-col gap-4">
        {thirdPartyAuthProviders?.google && (
          <Button
            variant="outline"
            className="h-10 w-full rounded-lg text-sm font-normal"
            onClick={(e) =>
              handleProviderClick(e, ThirdPartyAuthnProviderEnum.GOOGLE)
            }
          >
            <ThirdPartyIcon icon={GoogleIcon} />
            {t('Continue with Google')}
          </Button>
        )}
        {!hideSaml && isCloud && (
          <Button
            variant="outline"
            className="h-10 w-full rounded-lg text-sm font-normal"
            onClick={() => {
              capture({
                name: TelemetryEventName.FEDERATED_LOGIN_STARTED,
                payload: { provider: 'saml' },
              });
              onSamlClick();
            }}
          >
            <ThirdPartyIcon icon={SamlIcon} />
            {isSignUp
              ? `${t(`Sign up With`)} ${t('SAML')}`
              : `${t(`Sign in With`)} ${t('SAML')}`}
          </Button>
        )}
        {!hideSaml && !isCloud && thirdPartyAuthProviders?.saml && (
          <Button
            variant="outline"
            className="h-10 w-full rounded-lg text-sm font-normal"
            onClick={() => {
              capture({
                name: TelemetryEventName.FEDERATED_LOGIN_STARTED,
                payload: { provider: 'saml' },
              });
              window.location.href = '/api/v1/authn/saml/login';
            }}
          >
            <ThirdPartyIcon icon={SamlIcon} />
            {isSignUp
              ? `${t(`Sign up With`)} ${t('SAML')}`
              : `${t(`Sign in With`)} ${t('SAML')}`}
          </Button>
        )}
      </div>
    );
  },
);

ThirdPartyLogin.displayName = 'ThirdPartyLogin';

export {
  ThirdPartyLogin,
  useShowThirdPartyProviders,
  useThirdPartyAvailability,
};

type ThirdPartyAvailability = {
  google: boolean;
  saml: boolean;
  samlIsCloud: boolean;
};
