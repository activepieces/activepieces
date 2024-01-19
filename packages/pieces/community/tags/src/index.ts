import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { addTag } from './lib/add-tag';

export const tags = createPiece({
  displayName: 'Tags',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.7.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/tags.svg',
  authors: ['abuaboud'],
  actions: [addTag],
  triggers: [],
});
