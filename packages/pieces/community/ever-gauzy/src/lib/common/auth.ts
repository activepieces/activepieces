import { OAuth2PropertyValue, PieceAuth, Property } from '@activepieces/pieces-framework';
import { OAuth2GrantType } from '@activepieces/shared';

export const GAUZY_BASE_URLS = {
  apidemo: 'https://apidemo.gauzy.co',
  api: 'https://api.gauzy.co',
} as const;

export type GauzyEnvironment = keyof typeof GAUZY_BASE_URLS;

export const gauzyAuth = PieceAuth.OAuth2({
  required: true,
  grantType: OAuth2GrantType.AUTHORIZATION_CODE,
  authUrl: '{environment}/api/integration/ever-gauzy/oauth/authorize',
  tokenUrl: '{environment}/api/integration/ever-gauzy/oauth/token',
  scope: ['gauzy:all'],
  props: {
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      required: true,
      defaultValue: GAUZY_BASE_URLS.apidemo,
      options: {
        options: [
          { label: 'Demo', value: GAUZY_BASE_URLS.apidemo },
          { label: 'Production', value: GAUZY_BASE_URLS.api },
        ],
      },
    }),
  },
});

export function getAuthHeaders(auth: OAuth2PropertyValue): Record<string, string> {
  return {
    Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
    'Content-Type': 'application/json',
  };
}

export function getBaseUrl(auth: OAuth2PropertyValue): string {
  const environment = auth['props']?.['environment'] as string | undefined;
  if (!environment) {
    return GAUZY_BASE_URLS.api;
  }

  if (environment in GAUZY_BASE_URLS) {
    return GAUZY_BASE_URLS[environment as GauzyEnvironment];
  }

  return environment;
}
