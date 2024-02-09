import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addTag } from './lib/add-tag';

export const tags = createPiece({
  displayName: 'Tags',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.7.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/tags.svg',
  categories: [PieceCategory.CORE],
  authors: ['abuaboud'],
  actions: [addTag],
  triggers: [],
});
