import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addGreetAction } from './lib/actions/add-greet';
import { bonjoroAuth } from './lib/auth';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const bonjoro = createPiece({
  displayName: 'Bonjoro',
  auth: bonjoroAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/bonjoro.png',
  categories: [PieceCategory.CUSTOMER_SERVICE],
  authors: ['joeworkman'],
  actions: [
    addGreetAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://www.bonjoro.com/api/v2', // replace with the actual base URL
      auth: bonjoroAuth,
      authMapping: (auth) => ({
        Authorization: `Bearer ${(auth as { apiKey: string }).apiKey}`,
      }),
    }),
  ],
  triggers: [],
});

// https://vimily.github.io/bonjoro-api-docs/
// https://www.bonjoro.com/settings/api#/
