import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { mssqlAuth } from './lib/auth';
import actions from './lib/actions';
import { newOrUpdatedRow } from './lib/triggers/new-or-updated-row';

export { mssqlAuth };

export const mssql = createPiece({
  displayName: 'Microsoft SQL Server',
  description:
    "Microsoft's relational database engine, on-premise or as Azure SQL",
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-sql-server.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['OdaiAhmed99'],
  auth: mssqlAuth,
  actions,
  triggers: [newOrUpdatedRow],
});
