import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { sentAuth } from '../auth';
import { SENT_API_URL } from '../common/api';
import { sentValues } from '../common/values';

export const customApiCall = createCustomApiCallAction({
  auth: sentAuth,
  baseUrl: () => SENT_API_URL,
  description:
    'Call a Sent v3 endpoint. Authentication is added from your connection. For organization keys, optionally add x-profile-id in Headers.',
  props: {
    url: {
      description:
        'A relative v3 path such as /me or /contacts, or a full https://api.sent.dm/v3/ URL.',
    },
  },
  authMapping: async (auth, props) => {
    const input: unknown = props['url'];
    const value = sentValues.isRecord(input)
      ? sentValues.requiredString({ value: input['url'], label: 'URL' })
      : '';
    const url = new URL(
      value.startsWith('http://') || value.startsWith('https://')
        ? value
        : `${SENT_API_URL}/${value.replace(/^\/+/, '')}`
    );
    if (
      url.origin !== 'https://api.sent.dm' ||
      !/^\/v3(?:\/|$)/.test(url.pathname) ||
      url.username ||
      url.password ||
      url.hash
    )
      throw new Error(
        'Custom API calls must stay within https://api.sent.dm/v3/.'
      );
    if (props['followRedirects'])
      throw new Error(
        'Disable Follow redirects to keep your Sent API key on the intended endpoint.'
      );
    const headers: unknown = props['headers'];
    if (
      sentValues.isRecord(headers) &&
      Object.keys(headers).some((name) => name.toLowerCase() === 'x-api-key')
    )
      throw new Error(
        'The API key is supplied by your connection. Remove x-api-key from Headers.'
      );
    return { 'x-api-key': auth.secret_text };
  },
});
