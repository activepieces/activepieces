import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export function getAuthHeaders(auth: OAuth2PropertyValue): Record<string, string> {
  return {
    Authorization: `Bearer ${auth['access_token']}`,
    'Content-Type': 'application/json',
  };
}

export function getBaseUrl(auth: OAuth2PropertyValue): string {
  const baseUrl = auth['props']?.['baseUrl'] as string;
  return baseUrl || 'https://api.gauzy.co';
}
