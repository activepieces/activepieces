import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { mssqlAuth } from './lib/auth';
import actions from './lib/actions';

export { mssqlAuth };

export const mssql = createPiece({
  displayName: 'Microsoft SQL Server',
  description:
    "Microsoft's relational database engine, on-premise or as Azure SQL",
  minimumSupportedRelease: '0.36.1',
  // TODO(PIE-381): flip to https://cdn.activepieces.com/pieces/mssql.png once uploaded
  logoUrl: '/mssql.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['OdaiAhmed99'],
  auth: mssqlAuth,
  actions,
  triggers: [],
});
