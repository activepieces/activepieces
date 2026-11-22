import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { send21Auth } from './lib/auth';
import { actions } from './lib/actions';
import { authKey } from './lib/common/client';
import { SEND21_API_BASE } from './lib/common/constants';
import { triggers } from './lib/triggers';

export const send21 = createPiece({
  displayName: 'send21',
  description:
    'Crypto pay links and payment drafts. A flow prepares them; the payer signs and sends from their own wallet. send21 never holds keys or funds.',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://raw.githubusercontent.com/send21io/send21io/main/assets/send21-logo-512.png',
  categories: [PieceCategory.COMMERCE],
  authors: ['send21io'],
  auth: send21Auth,
  actions: [
    ...actions,
    createCustomApiCallAction({
      baseUrl: () => SEND21_API_BASE,
      auth: send21Auth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${authKey(auth)}`,
      }),
    }),
  ],
  triggers,
});
