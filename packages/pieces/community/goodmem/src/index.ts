import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createMemory } from './lib/actions/create-memory';
import { retrieveMemories } from './lib/actions/retrieve-memories';
import { deleteMemory } from './lib/actions/delete-memory';
import { getMemory } from './lib/actions/get-memory';
import { createSpace } from './lib/actions/create-space';
import { goodmemAuth } from './lib/auth';

export { goodmemAuth } from './lib/auth';

export const goodmem = createPiece({
  displayName: 'GoodMem',
  description:
    'Store documents as memories with vector embeddings and perform similarity-based semantic retrieval using GoodMem',
  auth: goodmemAuth,
  logoUrl: 'https://cdn.activepieces.com/pieces/goodmem.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['bashareid', 'sanket-a11y'],
  actions: [
    createSpace,
    createMemory,
    retrieveMemories,
    getMemory,
    deleteMemory,
  ],
  triggers: [],
});
