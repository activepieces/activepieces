import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createContact } from './lib/actions/create-contact';
import { createList } from './lib/actions/create-list';
import { unsubscribe } from './lib/actions/unsubscribe-contact';
export const sendfoxAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'To obtain your personal token, follow these steps:\n1. Log in to your SendFox account.\n2. Visit https://sendfox.com/account/oauth to create one\n3. From OAuth Apps click on Create New Token.\n4. Enter any name you want then click create.\n5. Copy and paste your token here.',
  required: true,
});

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
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
