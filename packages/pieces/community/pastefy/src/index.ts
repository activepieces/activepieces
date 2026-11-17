import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import actions from './lib/actions';
import { pastefyAuth } from './lib/common/auth';
import { pastefyCustomApiCallAction } from './lib/actions/custom-api-call';
import triggers from './lib/triggers';

export const pastefy = createPiece({
  displayName: 'Pastefy',
  description: 'Sharing code snippets platform',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/pastefy.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['JanHolger', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud', 'OdaiAhmed99'],
  auth: pastefyAuth,
  actions: [
    ...actions,
    pastefyCustomApiCallAction,
  ],
  triggers,
});

export { pastefyAuth };
