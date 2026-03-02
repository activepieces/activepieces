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

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return {};
  }
  try {
    const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return {};
  }
}

export function getTokenPayload(auth: OAuth2PropertyValue): Record<string, unknown> {
  return decodeJwtPayload(auth.access_token);
}

export function getAuthHeaders(auth: OAuth2PropertyValue): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${auth.access_token}`,
    'Content-Type': 'application/json',
  };

  const payload = getTokenPayload(auth);
  if (payload['tenantId']) {
    headers['Tenant-Id'] = payload['tenantId'] as string;
  }
  if (payload['organizationId']) {
    headers['Organization-Id'] = payload['organizationId'] as string;
  }

  return headers;
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
