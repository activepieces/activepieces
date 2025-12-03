import { fountainAuth, API_BASE_URL_DEFAULT } from '../../';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';

export function getBaseUrl(auth: PiecePropValueSchema<typeof fountainAuth>): string {
  const baseUrl = (auth as any).baseUrl;
  if (baseUrl) {
    let url = baseUrl;
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      url = `https://${baseUrl}`;
    }
    return url.replace(/\/$/, '');
  }
  return API_BASE_URL_DEFAULT;
}

export function getApiUrl(auth: PiecePropValueSchema<typeof fountainAuth>, endpoint: string): string {
  const baseUrl = getBaseUrl(auth);
  if (baseUrl.includes('/api/v2') || baseUrl.endsWith('/v2')) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}/v2${cleanEndpoint}`;
}

export function getAuthHeaders(auth: PiecePropValueSchema<typeof fountainAuth>) {
  const apiKey = (auth as any).apiKey || auth;
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}
