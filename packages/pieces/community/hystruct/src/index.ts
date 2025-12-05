import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { hystructAuth } from './lib/common/auth';
import { PieceCategory } from '@activepieces/shared';
import { newDataEntry } from './lib/triggers/new-data-entry';

export const hystruct = createPiece({
  displayName: 'Hystruct',
  auth: hystructAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/hystruct.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  description:
    'Hystruct is a no-code platform that enables users to create and manage structured data with ease, empowering them to build custom applications and workflows without writing code.',
  authors: ['sanket-a11y'],
  actions: [],
  triggers: [newDataEntry],
});
