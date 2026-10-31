export { mysqlAuth } from './lib/auth';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { mysqlAuth } from './lib/auth';
import actions from './lib/actions';
import { mysqlAiActions } from './lib/actions/ai';

export const mysql = createPiece({
  displayName: 'MySQL',
  description: "The world's most popular open-source database",

  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/mysql.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ["JanHolger","kishanprmr","khaledmashaly","abuaboud"],
  auth: mysqlAuth,
  actions: [...actions, ...mysqlAiActions],
  triggers: [],
});
