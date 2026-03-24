import { PieceAuth, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export type GorgiasAuth = {
  domain: string;
  email: string;
  api_key: string;
};

export function normalizeGorgiasDomain(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\.gorgias\.com.*$/i, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}

export function getGorgiasBaseUrl(domain: string): string {
  return `https://${normalizeGorgiasDomain(domain)}.gorgias.com/api`;
}

export const gorgiasAuth = PieceAuth.CustomAuth({
  displayName: 'Gorgias',
  required: true,
  description: `To connect your Gorgias account:

1. Copy your helpdesk subdomain (for example, \`acme\` from \`https://acme.gorgias.com\`).
2. In Gorgias, create or copy an API key.
3. Use the email address associated with that API key.

Authentication uses HTTP Basic auth with \`email:api_key\`.`,
  props: {
    domain: Property.ShortText({
      displayName: 'Helpdesk Domain',
      description: 'Your Gorgias subdomain only, for example `acme` from https://acme.gorgias.com.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address associated with your Gorgias API key.',
      required: true,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Gorgias API key.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${getGorgiasBaseUrl(auth.domain)}/tickets`,
        authentication: {
          type: AuthenticationType.BASIC,
          username: auth.email,
          password: auth.api_key,
        },
        queryParams: {
          limit: '1',
        },
      });
      return { valid: true };
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        return { valid: false, error: 'Invalid domain, email, or API key.' };
      }
      return { valid: false, error: 'Could not reach the Gorgias API. Check your domain and network.' };
    }
  },
});
