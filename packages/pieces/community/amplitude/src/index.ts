import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { identifyUserAction } from './lib/actions/identify-user';
import { trackEventAction } from './lib/actions/track-event';
import { AMPLITUDE_BASE_URL } from './lib/common';

export const amplitudeAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
  #### To obtain your API Key
  1. Log in to [Amplitude](https://app.amplitude.com)
  2. Go to **Settings** → **Projects** → select your project
  3. Copy the **API Key** and paste it below.

  Note: The API Key (not the Secret Key) is used for the HTTP V2 and Identify APIs.
  `,
  required: true,
  validate: async ({ auth }) => {
    if (!auth || !String(auth).trim()) {
      return {
        valid: false,
        error: 'API key is required.',
      };
    }
    return { valid: true };
  },
});

export const amplitude = createPiece({
  displayName: 'Amplitude',
  description: 'Track events and identify users in Amplitude.',
  auth: amplitudeAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/amplitude.png',
  authors: ['Harmatta'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    trackEventAction,
    identifyUserAction,
    createCustomApiCallAction({
      auth: amplitudeAuth,
      baseUrl: () => AMPLITUDE_BASE_URL,
      description:
        'Amplitude analytics endpoints require api_key in the request body, not as a header or query parameter. Include your API key in the JSON body when making custom calls.',
    }),
  ],
  triggers: [],
});
