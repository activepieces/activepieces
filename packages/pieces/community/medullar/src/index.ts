import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createSpace } from './lib/actions/create-space';
import { listSpaces } from './lib/actions/list-spaces';
import { addSpaceRecord } from './lib/actions/add-space-record';
import { askSpace } from './lib/actions/ask-space';
import { deleteSpace } from './lib/actions/delete-space';
import { renameSpace } from './lib/actions/rename-space';
import { PieceCategory } from '@activepieces/shared';
import { medullarAuth } from './lib/auth';

export const medullar = createPiece({
  displayName: 'Medullar',
  description:
    'AI-powered discovery & insight platform that acts as your extended digital mind',
  auth: medullarAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl:  
    'https://cdn.activepieces.com/pieces/medullar.png',
  authors: ['mllopart'],
  actions: [createSpace, listSpaces, addSpaceRecord, askSpace, deleteSpace, renameSpace],
  triggers: [],
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.PRODUCTIVITY,
  ],
});
