import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addAnnotationAction } from './lib/actions/add-annotation';
import { matomoAuth } from './lib/auth';

export const matomo = createPiece({
  displayName: 'Matomo',
  auth: matomoAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/matomo.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['joeworkman'],
  actions: [addAnnotationAction],
  triggers: [],
});

// Matomo API Docs: https://developer.matomo.org/api-reference/reporting-api
