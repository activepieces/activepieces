import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import {
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { plunkTrackEventAction } from './lib/actions/track-event';
import { plunkSendEmailAction } from './lib/actions/send-email';
import { plunkGetContactsAction } from './lib/actions/get-contacts';
import { plunkGetContactAction } from './lib/actions/get-contact';

export const plunkAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
  #### To obtain your API Key
  1. Log in to your [Plunk dashboard](https://app.useplunk.com)
  2. Go to **Settings** → **API Keys**
  3. Copy your secret API key and paste it below.
  `,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.useplunk.com/v1/contacts',
        headers: {
          Authorization: `Bearer ${auth}`,
          'Content-Type': 'application/json',
        },
      });
      return { valid: true };
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 401 || status === 403) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your Plunk API key.',
        };
      }
      return {
        valid: false,
        error: 'Could not connect to Plunk API. Please try again.',
      };
    }
  },
});

export const plunk = createPiece({
  displayName: 'Plunk',
  description:
    'Open-source email platform for transactional and marketing emails',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/plunk.png',
  categories: [PieceCategory.MARKETING],
  authors: ['Harmatta'],
  auth: plunkAuth,
  actions: [
    plunkTrackEventAction,
    plunkSendEmailAction,
    plunkGetContactsAction,
    plunkGetContactAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.useplunk.com/v1',
      auth: plunkAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
