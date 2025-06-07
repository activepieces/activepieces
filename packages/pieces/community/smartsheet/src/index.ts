import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

const markdownDescription = `
You can get your API token by visiting your [Smartsheet account](https://app.smartsheet.com/b/settings/account).
`;

export const smartsheetAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: markdownDescription,
  required: true,
});

export const smartsheet = createPiece({
  displayName: 'Smartsheet',
  description: 'Access and manage your sheets, folders, and workspaces with Smartsheet',
  auth: smartsheetAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/smartsheet.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['krushnarout'],
  actions: [],
  triggers: [],
});
