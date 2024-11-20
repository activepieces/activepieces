import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { fetchPeoplePaths } from './lib/actions/fetch-people-paths';
import { fetchCompaniesPaths } from './lib/actions/fetch-companies-paths';

export const villageAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Your Village API Key',
});

export const village = createPiece({
  displayName: 'Village',
  description: 'The Social Capital API',
  auth: villageAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/village.png',
  categories: [
    PieceCategory.PRODUCTIVITY,
    PieceCategory.SALES_AND_CRM,
  ],
  authors: ['rafaelmuttoni'],
  actions: [fetchPeoplePaths, fetchCompaniesPaths],
  triggers: [],
});
