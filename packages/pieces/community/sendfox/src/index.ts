import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createContact } from './lib/actions/create-contact';
import { createList } from './lib/actions/create-list';
import { unsubscribe } from './lib/actions/unsubscribe-contact';
import { sendfoxAuth } from './lib/auth';
export const sendfox = createPiece({
  displayName: 'SendFox',
  description: 'Email marketing made simple',

  auth: sendfoxAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/sendfox.png',
  categories: [PieceCategory.MARKETING],
  authors: ["Salem-Alaa","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    createList,
    unsubscribe,
    createContact,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.sendfox.com',
      auth: sendfoxAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
