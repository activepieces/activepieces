import { isNil, tryCatchSync } from '@activepieces/core-utils';
import { OAuth2Property, OAuth2Props } from '@activepieces/pieces-framework';
import {
  AppConnectionType,
  BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE,
  OAuth2GrantType,
  ThirdPartyAuthnProviderEnum,
} from '@activepieces/shared';
import { useSearchParams } from 'react-router-dom';

import {
  FROM_QUERY_PARAM,
  LOGIN_QUERY_PARAM,
  PROVIDER_NAME_QUERY_PARAM,
  STATE_QUERY_PARAM,
} from '@/lib/navigation-utils';

const CLOUD_OAUTH2_REDIRECT_URL = 'https://secrets.activepieces.com/redirect';

let currentPopup: Window | null = null;

function resolveRedirectContract({
  oauth2Type,
  platformRedirectUrl,
}: ResolveRedirectContractParams): RedirectContract {
  if (oauth2Type === AppConnectionType.CLOUD_OAUTH2) {
    return {
      redirectUrl: CLOUD_OAUTH2_REDIRECT_URL,
      postsPercentEncodedCode: true,
    };
  }
  return {
    redirectUrl: platformRedirectUrl,
    postsPercentEncodedCode: false,
  };
}

function useThirdPartyLogin() {
  const [searchParams] = useSearchParams();

  return (loginUrl: string, providerName: ThirdPartyAuthnProviderEnum) => {
    const from = searchParams.get(FROM_QUERY_PARAM) || '/flows';
    const state = {
      [PROVIDER_NAME_QUERY_PARAM]: providerName,
      [FROM_QUERY_PARAM]: from,
      [LOGIN_QUERY_PARAM]: 'true',
    };
    const loginUrlWithState = new URL(loginUrl);
    loginUrlWithState.searchParams.set(
      STATE_QUERY_PARAM,
      JSON.stringify(state),
    );
    window.location.href = loginUrlWithState.toString();
  };
}

async function openOAuth2Popup(
  params: OAuth2PopupParams,
): Promise<OAuth2PopupResponse> {
  closeOAuth2Popup();
  currentPopup = openWindow(params.authorizationUrl);
  return {
    code: await getCode(params.redirect),
    codeVerifier: params.codeVerifier,
  };
}

function openWindow(url: string): Window | null {
  const winFeatures = [
    'resizable=no',
    'toolbar=no',
    'left=100',
    'top=100',
    'scrollbars=no',
    'menubar=no',
    'status=no',
    'directories=no',
    'location=no',
    'width=600',
    'height=800',
  ].join(', ');
  return window.open(url, '_blank', winFeatures);
}

function closeOAuth2Popup() {
  currentPopup?.close();
}

function getCode(redirect: RedirectContract): Promise<string> {
  const { data: expectedOrigin } = tryCatchSync(
    () => new URL(redirect.redirectUrl).origin,
  );
  return new Promise<string>((resolve) => {
    window.addEventListener('message', function handler(event) {
      if (
        isNil(expectedOrigin) ||
        event.origin !== expectedOrigin ||
        isNil(event.data) ||
        !event.data['code']
      ) {
        return;
      }
      resolve(
        readPostedCode({
          postedCode: event.data.code,
          postsPercentEncodedCode: redirect.postsPercentEncodedCode,
        }),
      );
      closeOAuth2Popup();
      window.removeEventListener('message', handler);
    });
  });
}

function readPostedCode({
  postedCode,
  postsPercentEncodedCode,
}: ReadPostedCodeParams): string {
  if (!postsPercentEncodedCode) {
    return postedCode;
  }
  const { data, error } = tryCatchSync(() => decodeURIComponent(postedCode));
  if (error !== null) {
    return postedCode;
  }
  return data;
}

function getGrantType(property: OAuth2Property<OAuth2Props>) {
  if (
    isNil(property.grantType) ||
    property.grantType === BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE
  ) {
    return OAuth2GrantType.AUTHORIZATION_CODE;
  }
  return property.grantType;
}

function getPredefinedOAuth2App(
  piecesOAuth2AppsMap: PiecesOAuth2AppsMap,
  pieceName: string,
): OAuth2App | null {
  const pieceOAuth2Apps = piecesOAuth2AppsMap[pieceName];
  if (isNil(pieceOAuth2Apps)) {
    return null;
  }
  if (pieceOAuth2Apps.platformOAuth2App) {
    return pieceOAuth2Apps.platformOAuth2App;
  }
  if (pieceOAuth2Apps.cloudOAuth2App) {
    return pieceOAuth2Apps.cloudOAuth2App;
  }
  return null;
}

export const oauth2Utils = {
  openOAuth2Popup,
  useThirdPartyLogin,
  getGrantType,
  getPredefinedOAuth2App,
  resolveRedirectContract,
};

export type RedirectContract = {
  redirectUrl: string;
  postsPercentEncodedCode: boolean;
};

export type OAuth2App =
  | {
      oauth2Type:
        | AppConnectionType.CLOUD_OAUTH2
        | AppConnectionType.PLATFORM_OAUTH2;
      clientId: string;
    }
  | {
      oauth2Type: AppConnectionType.OAUTH2;
      clientId: null;
    };

export type PiecesOAuth2AppsMap = Record<
  string,
  | {
      cloudOAuth2App: OAuth2App | null;
      platformOAuth2App: OAuth2App | null;
    }
  | undefined
>;

type ResolveRedirectContractParams = {
  oauth2Type: OAuth2App['oauth2Type'];
  platformRedirectUrl: string;
};

type ReadPostedCodeParams = {
  postedCode: string;
  postsPercentEncodedCode: boolean;
};

type OAuth2PopupParams = {
  authorizationUrl: string;
  redirect: RedirectContract;
  codeVerifier?: string;
};

type OAuth2PopupResponse = {
  code: string;
  codeVerifier: string | undefined;
};
