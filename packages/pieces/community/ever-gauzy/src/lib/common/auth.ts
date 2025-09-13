import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const GAUZY_BASE_URLS = {
  apidemo: 'https://apidemo.gauzy.co',
  api: 'https://api.gauzy.co',
} as const;

export type GauzyEnvironment = keyof typeof GAUZY_BASE_URLS;

export function getAuthHeaders(auth: OAuth2PropertyValue): Record<string, string> {
  return {
    Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
    'Content-Type': 'application/json',
  };
}

export function getBaseUrl(auth: OAuth2PropertyValue): string {
  const environment = auth['props']?.['environment'] as GauzyEnvironment;
  return environment ? GAUZY_BASE_URLS[environment] : GAUZY_BASE_URLS.api;
}
