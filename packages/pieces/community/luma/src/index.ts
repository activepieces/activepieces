import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { lumaListEvents } from './lib/actions/list-events';
import { lumaCreateEvent } from './lib/actions/create-event';
import { lumaGetEvent } from './lib/actions/get-event';
import { lumaGetGuest } from './lib/actions/get-guest';

const markdownDescription = `
To obtain your API key, go to your [Luma Settings](https://lu.ma/settings) page and generate an API key from the **API** section.
`;

export const lumaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
});

export const luma = createPiece({
  displayName: 'Luma',
  description: 'Event management and ticketing platform',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/luma.png',
  categories: [PieceCategory.MARKETING],
  auth: lumaAuth,
  actions: [
    lumaListEvents,
    lumaCreateEvent,
    lumaGetEvent,
    lumaGetGuest,
    createCustomApiCallAction({
      baseUrl: () => 'https://public-api.luma.com',
      auth: lumaAuth,
      authMapping: async (auth) => ({
        'x-luma-api-key': (auth as { secret_text: string }).secret_text,
      }),
    }),
  ],
  authors: ['Harmatta'],
  triggers: [],
});
