import { PieceCategory, createPiece } from '@activepieces/pieces-framework';
import { mssqlAuth } from './lib/auth';
import { findRowsAction } from './lib/actions/find-rows';
import { insertRowAction } from './lib/actions/insert-row';
import { updateRowsAction } from './lib/actions/update-rows';
import { deleteRowsAction } from './lib/actions/delete-rows';
import { getTablesAction } from './lib/actions/get-tables';
import { runQueryAction } from './lib/actions/run-query';
import { newOrUpdatedRowTrigger } from './lib/triggers/new-or-updated-row';

export const mssql = createPiece({
  displayName: 'Microsoft SQL Server',
  description:
    "Microsoft's relational database engine, on-premise or as Azure SQL",
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-sql-server.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['OdaiAhmed99'],
  auth: mssqlAuth,
  actions: [
    findRowsAction,
    insertRowAction,
    updateRowsAction,
    deleteRowsAction,
    getTablesAction,
    runQueryAction,
  ],
  triggers: [newOrUpdatedRowTrigger],
});
