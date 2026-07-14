import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { redditConversionsAuth } from './lib/common/auth';
import { sendConversionEvent } from './lib/actions/send-conversion-event';

export const redditConversions = createPiece({
  displayName: 'Reddit Conversions',
  description:
    'Send server-side web, app, and offline conversion events to Reddit using the Conversions API (v3).',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/reddit.png',
  categories: [PieceCategory.MARKETING],
  auth: redditConversionsAuth,
  authors: ['cavemaann'],
  actions: [
    sendConversionEvent,
    createCustomApiCallAction({
      baseUrl: () => 'https://ads-api.reddit.com/api/v3',
      auth: redditConversionsAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.props.conversion_token}`,
      }),
    }),
  ],
  triggers: [],
});
