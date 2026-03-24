import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { identifyUserAction } from './lib/actions/identify-user';
import { trackEventAction } from './lib/actions/track-event';
import { AMPLITUDE_BASE_URL } from './lib/common';

export const amplitudeAuth = PieceAuth.CustomAuth({
  displayName: 'Amplitude',
  description: 'Authenticate with your Amplitude API key and secret key.',
  required: true,
  props: {
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Amplitude project API key.',
      required: true,
    }),
    secret_key: PieceAuth.SecretText({
      displayName: 'Secret Key',
      description: 'Your Amplitude project secret key.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const props = ((auth as { props?: { api_key?: string; secret_key?: string }; api_key?: string; secret_key?: string } | undefined)?.props ?? auth) as {
      api_key?: string;
      secret_key?: string;
    } | undefined;
    if (!props?.api_key?.trim() || !props?.secret_key?.trim()) {
      return {
        valid: false,
        error: 'API key and secret key are required.',
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
      authLocation: 'queryParams',
      authMapping: async (auth) => ({
        api_key: auth.props.api_key,
        secret_key: auth.props.secret_key,
      }),
    }),
  ],
  triggers: [],
});
