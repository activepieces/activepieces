import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { sendTransactionalEmail } from './lib/actions/send-email';
import { trackEvent } from './lib/actions/track-event';
import { getContacts } from './lib/actions/get-contacts';
import { getContact } from './lib/actions/get-contact';

export const PLUNK_BASE_URL = 'https://api.useplunk.com/v1';

export const plunkAuth = PieceAuth.CustomAuth({
  description: `Find both API keys in your Plunk project's API settings.

  - Secret API key (\`sk_*\`) is required for sending email and managing contacts.
  - Public API key (\`pk_*\`) is optional. It is only used by the Track Event action because Plunk's \`/v1/track\` endpoint accepts public keys only.`,
  required: true,
  props: {
    secretKey: PieceAuth.SecretText({
      displayName: 'Secret API Key',
      description: 'Used for /v1/send, /v1/contacts, and the Custom API Call action.',
      required: true,
    }),
    publicKey: Property.ShortText({
      displayName: 'Public API Key',
      description: 'Required only for the Track Event action.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${PLUNK_BASE_URL}/contacts`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.secretKey,
        },
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error:
          'Could not authenticate with Plunk. Verify the secret API key is correct.',
      };
    }
  },
});

export const plunk = createPiece({
  displayName: 'Plunk',
  description:
    'Open-source email platform for transactional emails, marketing campaigns, and contact management.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/plunk.png',
  categories: [PieceCategory.MARKETING, PieceCategory.COMMUNICATION],
  authors: ['fran-mora'],
  auth: plunkAuth,
  actions: [
    sendTransactionalEmail,
    trackEvent,
    getContacts,
    getContact,
    createCustomApiCallAction({
      baseUrl: () => PLUNK_BASE_URL,
      auth: plunkAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { props: { secretKey: string } }).props.secretKey}`,
      }),
    }),
  ],
  triggers: [],
});
