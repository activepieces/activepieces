import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { oracleDbAuth } from './lib/common/auth';
import { insertRowAction } from './lib/actions/insert-row';
import { insertRowsAction } from './lib/actions/insert-rows';
import { runCustomSqlAction } from './lib/actions/run-custom-sql';
import { updateRowAction } from './lib/actions/update-row';
import { deleteRowAction } from './lib/actions/delete-row';
import { findRowAction } from './lib/actions/find-row';
import { newRowTrigger } from './lib/triggers/new-row';

export const oracleDatabase = createPiece({
  displayName: 'Oracle Database',
  description: 'Enterprise-grade relational database',
  auth: oracleDbAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/oracle-database.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['Prabhukiran161', 'onyedikachi-david'],
  actions: [
    insertRowAction,
    insertRowsAction,
    runCustomSqlAction,
    updateRowAction,
    deleteRowAction,
    findRowAction,
  ],
  triggers: [newRowTrigger],
});