import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

export const quickBooksAuth = PieceAuth.OAuth2({
  required: true,
  scope: ['com.intuit.quickBooks.accounting'],
  authUrl: 'https://appcenter.intuit.com/connect/oauth2',
  tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
});

export const quickbooks = createPiece({
  displayName: 'QuickBooks',
  auth: quickBooksAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/quickbooks.png',
  categories: [PieceCategory.ACCOUNTING],
  authors: ['kishanprmr'],
  actions: [],
  triggers: [],
});
