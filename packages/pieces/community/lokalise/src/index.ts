import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { lokaliseAuth } from './lib/common/auth';
import { PieceCategory } from '@activepieces/shared';
import { createComment } from './lib/actions/create-comment';

export const lokalise = createPiece({
  displayName: 'Lokalise',
  auth: lokaliseAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/lokalise.png',
  authors: ['sanket-a11y'],
  categories: [PieceCategory.DEVELOPER_TOOLS],
  description: 'Lokalise is a collaborative translation platform.',
  actions: [createComment],
  triggers: [],
});
