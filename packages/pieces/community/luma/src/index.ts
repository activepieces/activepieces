import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { lumaAuth } from './lib/auth';
import { lumaCommon } from './lib/common';
import { createEventAction } from './lib/actions/create-event';
import { getEventAction } from './lib/actions/get-event';
import { listEventsAction } from './lib/actions/list-events';
import { addGuestsAction } from './lib/actions/add-guests';

export const luma = createPiece({
  displayName: 'Luma',
  description: 'Modern event management platform for tech communities and conferences',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/luma.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['tarai-dl'],
  auth: lumaAuth,
  actions: [
    createEventAction,
    getEventAction,
    listEventsAction,
    addGuestsAction,
    createCustomApiCallAction({
      baseUrl: () => lumaCommon.BASE_URL,
      auth: lumaAuth,
      authMapping: async (auth) => ({
        'x-luma-api-key': auth as string,
      }),
    }),
  ],
  triggers: [],
});
