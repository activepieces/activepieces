import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createContactAction } from './lib/actions/create-contact';
import { createListAction } from './lib/actions/create-list';
import { unsubscribeContactAction } from './lib/actions/unsubscribe-contact';
import { sendfoxAuth } from './lib/auth';
import { sendfoxClient } from './lib/common/client';

export const sendfox = createPiece({
  displayName: 'SendFox',
  description: 'Email marketing made simple',

  auth: sendfoxAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/sendfox.png',
  categories: [PieceCategory.MARKETING],
  authors: ['Salem-Alaa', 'kishanprmr', 'MoShizzle', 'abuaboud'],
  actions: [
    createListAction,
    unsubscribeContactAction,
    createContactAction,
    createCustomApiCallAction({
      baseUrl: () => sendfoxClient.baseUrl(),
      auth: sendfoxAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
      props: {
        url: {
          description: `Full URL, or a path relative to ${sendfoxClient.baseUrl()}`,
          placeholder: '/contacts',
        },
      },
    }),
  ],
  triggers: [],
});
