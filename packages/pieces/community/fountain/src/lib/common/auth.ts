import { fountainAuth, API_BASE_URL_DEFAULT } from '../../';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

export function getBaseUrl(auth: AppConnectionValueForAuthProperty<typeof fountainAuth>): string {
  const baseUrl = auth.props.baseUrl
  if (baseUrl) {
    let url = baseUrl;
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      url = `https://${baseUrl}`;
    }
    return url.replace(/\/$/, '');
  }
  return API_BASE_URL_DEFAULT;
}

export function getApiUrl(auth: AppConnectionValueForAuthProperty<typeof fountainAuth>, endpoint: string): string {
  const baseUrl = getBaseUrl(auth);
  if (baseUrl.includes('/api/v2') || baseUrl.endsWith('/v2')) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}/v2${cleanEndpoint}`;
}

export function getAuthHeaders(auth: AppConnectionValueForAuthProperty<typeof fountainAuth>) {
  const apiKey = auth.props.apiKey
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}
