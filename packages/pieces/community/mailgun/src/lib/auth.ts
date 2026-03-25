import { PieceAuth, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const MAILGUN_US_BASE_URL = 'https://api.mailgun.net';
export const MAILGUN_EU_BASE_URL = 'https://api.eu.mailgun.net';

export const mailgunAuth = PieceAuth.CustomAuth({
  displayName: 'Mailgun',
  required: true,
  description: 'Use your Mailgun API key and sending domain.',
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
    domain: Property.ShortText({
      displayName: 'Sending Domain',
      description: 'The Mailgun domain to send from and query events for.',
      required: true,
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      required: false,
      defaultValue: 'US',
      options: {
        options: [
          { label: 'US', value: 'US' },
          { label: 'EU', value: 'EU' },
        ],
      },
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${auth.region === 'EU' ? MAILGUN_EU_BASE_URL : MAILGUN_US_BASE_URL}/v3/domains/${encodeURIComponent(auth.domain)}/events`,
        authentication: {
          type: AuthenticationType.BASIC,
          username: 'api',
          password: auth.apiKey,
        },
        queryParams: {
          limit: '1',
        },
      });
      return { valid: true };
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 401 || err.response?.status === 403) {
        return { valid: false, error: 'Invalid Mailgun API key or domain.' };
      }
      return {
        valid: false,
        error: 'Could not reach the Mailgun API. Check your credentials and network.',
      };
    }
  },
});

export type MailgunAuth = {
  apiKey: string;
  domain: string;
  region?: string;
};
