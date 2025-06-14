import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

export const pandaDocAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'You can get your API key from [PandaDoc Dashboard](https://app.pandadoc.com/a/#/settings/api)',
  required: true,
});

export const pandaDoc = createPiece({
  displayName: 'PandaDoc',
  description: 'Create and manage documents using PandaDoc API',
  auth: pandaDocAuth,
  logoUrl: 'https://cdn.activepieces.com/pieces/pandadoc.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['krushnarout'],
  actions: [],
  triggers: [],
});
