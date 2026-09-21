import { AppConnectionType, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { AuthenticationType } from '@activepieces/pieces-common';
import type { zendeskAuth } from '../auth';

export type ZendeskAuthValue = AppConnectionValueForAuthProperty<typeof zendeskAuth>;

type ZendeskCustomAuthValue = {
  type: AppConnectionType.CUSTOM_AUTH;
  props: {
    email: string;
    token: string;
    subdomain: string;
  };
};

type ZendeskOAuth2AuthValue = {
  type: AppConnectionType.OAUTH2 | AppConnectionType.CLOUD_OAUTH2 | AppConnectionType.PLATFORM_OAUTH2;
  access_token: string;
  props?: {
    subdomain: string;
  };
};

type ZendeskAuth = ZendeskCustomAuthValue | ZendeskOAuth2AuthValue;

function isCustomAuth(auth: ZendeskAuth): auth is ZendeskCustomAuthValue {
  return auth.type === AppConnectionType.CUSTOM_AUTH;
}

export function getZendeskSubdomain(auth: ZendeskAuthValue): string {
  const value = auth as ZendeskAuth;
  if (isCustomAuth(value)) {
    return value.props.subdomain;
  }
  return value.props?.subdomain ?? '';
}

export function getZendeskBaseUrl(auth: ZendeskAuthValue): string {
  return `https://${getZendeskSubdomain(auth)}.zendesk.com/api/v2`;
}

export function getZendeskAuthentication(auth: ZendeskAuthValue) {
  const value = auth as ZendeskAuth;
  if (isCustomAuth(value)) {
    return {
      type: AuthenticationType.BASIC,
      username: `${value.props.email}/token`,
      password: value.props.token,
    } as const;
  }
  return {
    type: AuthenticationType.BEARER_TOKEN,
    token: value.access_token,
  } as const;
}

export function getZendeskAuthorizationHeader(auth: ZendeskAuthValue): string {
  const value = auth as ZendeskAuth;
  if (isCustomAuth(value)) {
    return `Basic ${Buffer.from(`${value.props.email}/token:${value.props.token}`).toString('base64')}`;
  }
  return `Bearer ${value.access_token}`;
}
