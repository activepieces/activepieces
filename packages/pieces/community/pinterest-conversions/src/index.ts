import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { pinterestConversionsAuth } from './lib/common/auth';
import { sendConversionEvent } from './lib/actions/send-conversion-event';

export const pinterestConversions = createPiece({
  displayName: 'Pinterest Conversions',
  description:
    'Send server-side web, app, and offline conversion events to Pinterest using the Conversions API.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pinterest.png',
  categories: [PieceCategory.MARKETING],
  auth: pinterestConversionsAuth,
  authors: ['cavemaann'],
  actions: [
    sendConversionEvent,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.pinterest.com/v5',
      auth: pinterestConversionsAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.props.conversion_token}`,
      }),
    }),
  ],
  triggers: [],
});
