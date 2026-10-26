import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import actions from './lib/actions';
import { pastefyAuth } from './lib/common/auth';
import { pastefyClient } from './lib/common/client';
import triggers from './lib/triggers';

export const pastefy = createPiece({
  displayName: 'Pastefy',
  description: 'Sharing code snippets platform',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/pastefy.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['JanHolger', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud'],
  auth: pastefyAuth,
  actions: [
    ...actions,
    createCustomApiCallAction({
      auth: pastefyAuth,
      baseUrl: (auth) => (auth ? pastefyClient.apiBase({ auth }) : ''),
      authMapping: async (auth) => {
        const token = pastefyClient.tokenOf({ auth });
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
  triggers,
});

export { pastefyAuth };
