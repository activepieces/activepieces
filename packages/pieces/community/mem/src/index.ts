import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createMemAction } from './lib/actions/create-mem';
import { createNoteAction } from './lib/actions/create-note';
import { deleteNoteAction } from './lib/actions/delete-note';

export const memAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `You can obtain your API key by navigating to **Integrations→ API**.`,
});

export const mem = createPiece({
  displayName: 'Mem',
  description: 'Capture and organize your thoughts using Mem.ai',
  auth: memAuth,
  logoUrl: 'https://cdn.activepieces.com/pieces/mem.png',
  authors: ['krushnarout', 'kishanprmr'],
  categories: [PieceCategory.PRODUCTIVITY],
  actions: [
    createMemAction,
    createNoteAction,
    deleteNoteAction,
    createCustomApiCallAction({
      auth: memAuth,
      baseUrl: () => 'https://api.mem.ai/v2',
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth}`,
        };
      },
    }),
  ],
  triggers: [],
});
