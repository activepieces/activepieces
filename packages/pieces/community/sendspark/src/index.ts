import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { sendsparkAuth } from './lib/auth';
import { createDynamicVideoAction } from './lib/actions/create-dynamic-video';

export const sendspark = createPiece({
  displayName: 'Sendspark',
  description: 'Create personalized video messages to engage your prospects.',
  auth: sendsparkAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/sendspark.png',
  categories: [PieceCategory.MARKETING],
  authors: ['sanket-a11y'],
  actions: [
    createDynamicVideoAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api-gw.sendspark.com/v1',
      auth: sendsparkAuth,
      authMapping: async (auth) => ({
        'x-api-key': auth.props.api_key,
        'x-api-secret': auth.props.api_secret,
      }),
    }),
  ],
  triggers: [],
});
