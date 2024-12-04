import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addGreetAction } from './lib/actions/add-greet';
import { bonjoroAuth } from './lib/auth';

export const bonjoro = createPiece({
  displayName: 'Bonjoro',
  description: 'Send personal video messages to delight customers',
  auth: bonjoroAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/bonjoro.png',
  categories: [PieceCategory.CUSTOMER_SUPPORT],
  authors: ["joeworkman","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    addGreetAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://www.bonjoro.com/api/v2', // replace with the actual base URL
      auth: bonjoroAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { apiKey: string }).apiKey}`,
      }),
    }),
  ],
  triggers: [],
});

// https://vimily.github.io/bonjoro-api-docs/
// https://www.bonjoro.com/settings/api#/
