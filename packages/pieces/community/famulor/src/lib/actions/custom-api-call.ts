import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { famulorAuth } from '../auth';
import { BASE_URL, famulorApi } from '../common/client';

function validateRequest(props: Record<string, unknown>) {
  const input = props['url'];
  const path = famulorApi.isRecord(input) ? input['url'] : undefined;
  if (typeof path !== 'string' || path.includes('\\') || (/^[a-z][a-z0-9+.-]*:/i.test(path) && !path.startsWith('https://')) || path.startsWith('//')) throw new Error('Enter a Famulor API path or URL.');
  const url = new URL(path.startsWith('https://') ? path : `${BASE_URL}/${path.replace(/^\//, '')}`);
  if (url.origin !== 'https://app.famulor.io' || !url.pathname.startsWith('/api/v1/') || url.username || url.password || url.hash || /%2[ef]|%5c/i.test(url.pathname)) throw new Error('Custom requests must stay on https://app.famulor.io/api/v1/.');
  if (props['followRedirects']) throw new Error('Authenticated Famulor requests cannot follow redirects.');
  const headers = props['headers'];
  if (famulorApi.isRecord(headers) && Object.keys(headers).some((key) => /^(authorization|cookie|host|proxy-authorization)$/i.test(key))) throw new Error('Connection headers cannot be overridden.');
}

export const customApiCall = createCustomApiCallAction({
  auth: famulorAuth,
  baseUrl: () => BASE_URL,
  classification: 'DESTRUCTIVE',
  description: 'Call an endpoint on the current Famulor workspace API. Use Run Workspace API Operation for guided fields. Permissions and credits apply.',
  authMapping: async (auth, props) => {
    validateRequest(props);
    return { Authorization: `Bearer ${auth.secret_text}` };
  },
});
