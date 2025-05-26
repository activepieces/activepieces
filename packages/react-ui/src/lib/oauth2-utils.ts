import { nanoid } from 'nanoid';
import { useSearchParams } from 'react-router-dom';

import {
  ThirdPartyAuthnProviderEnum,
  OAuth2PkceCodeChallengeMethod,
} from '@activepieces/shared';

import {
  FROM_QUERY_PARAM,
  LOGIN_QUERY_PARAM,
  PROVIDER_NAME_QUERY_PARAM,
  STATE_QUERY_PARAM,
} from './navigation-utils';

let currentPopup: Window | null = null;

export const oauth2Utils = {
  openOAuth2Popup,
  useThirdPartyLogin,
};

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

// Base64 includes some characters that aren't safe for use in a URL so those need to be
// replaced with something that is valid.
function base64urlEncode(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function createPkceCodeChallenge(
  verifier: string,
  method: OAuth2PkceCodeChallengeMethod,
): Promise<string> {
  switch (method) {
    case OAuth2PkceCodeChallengeMethod.S256: {
      const data = new TextEncoder().encode(verifier);
      const hashed = await crypto.subtle.digest('SHA-256', data);
      return base64urlEncode(new Uint8Array(hashed));
    }
    case OAuth2PkceCodeChallengeMethod.PLAIN:
      return verifier;
  }
}

async function openOAuth2Popup(
  params: OAuth2PopupParams,
): Promise<OAuth2PopupResponse> {
  closeOAuth2Popup();
  const pkceVerifier = nanoid(43);
  const pkceChallenge = await createPkceCodeChallenge(
    pkceVerifier,
    params.pkceCodeChallengeMethod,
  );
  const url = constructUrl(params, pkceChallenge);
  currentPopup = openWindow(url);
  return {
    code: await getCode(params.redirectUrl),
    codeChallenge: params.pkce ? pkceChallenge : undefined,
    codeVerifier: params.pkce ? pkceVerifier : undefined,
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

function constructUrl(params: OAuth2PopupParams, pckeChallenge: string) {
  const queryParams: Record<string, string> = {
    response_type: 'code',
    client_id: params.clientId,
    redirect_uri: params.redirectUrl,
    access_type: 'offline',
    state: nanoid(),
    prompt: 'consent',
    scope: params.scope,
    ...(params.extraParams || {}),
  };
  if (params.pkce) {
    queryParams['code_challenge_method'] = params.pkceCodeChallengeMethod;
    queryParams['code_challenge'] = pckeChallenge;
  }
  const url = new URL(params.authUrl);
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
}

function getCode(redirectUrl: string): Promise<string> {
  return new Promise<string>((resolve) => {
    window.addEventListener('message', function handler(event) {
      if (
        redirectUrl &&
        redirectUrl.startsWith(event.origin) &&
        event.data['code']
      ) {
        resolve(decodeURIComponent(event.data.code));
        closeOAuth2Popup();
        window.removeEventListener('message', handler);
      }
    });
  });
}

type OAuth2PopupParams = {
  authUrl: string;
  clientId: string;
  redirectUrl: string;
  scope: string;
  pkce: boolean;
  pkceCodeChallengeMethod: OAuth2PkceCodeChallengeMethod;
  extraParams?: Record<string, string>;
};

type OAuth2PopupResponse = {
  code: string;
  codeChallenge: string | undefined;
  codeVerifier: string | undefined;
};
