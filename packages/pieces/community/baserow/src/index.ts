import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createRowAction } from './lib/actions/create-row';
import { deleteRowAction } from './lib/actions/delete-row';
import { getRowAction } from './lib/actions/get-row';
import { listRowsAction } from './lib/actions/list-rows';
import { updateRowAction } from './lib/actions/update-row';
import { findRowAction } from './lib/actions/find-row';
import { cleanRowAction } from './lib/actions/clean-row';
import { aggregateFieldAction } from './lib/actions/aggregate-field';
import { batchCreateRowsAction } from './lib/actions/batch-create-rows';
import { batchUpdateRowsAction } from './lib/actions/batch-update-rows';
import { batchDeleteRowsAction } from './lib/actions/batch-delete-rows';
import { upsertRowAction } from './lib/actions/upsert-row';
import { uploadFileAction } from './lib/actions/upload-file';
import { createRowAiAction } from './lib/actions/create-row-ai';
import { getRowAiAction } from './lib/actions/get-row-ai';
import { listRowsAiAction } from './lib/actions/list-rows-ai';
import { findRowAiAction } from './lib/actions/find-row-ai';
import { updateRowAiAction } from './lib/actions/update-row-ai';
import { upsertRowAiAction } from './lib/actions/upsert-row-ai';
import { deleteRowAiAction } from './lib/actions/delete-row-ai';
import { batchCreateRowsAiAction } from './lib/actions/batch-create-rows-ai';
import { batchUpdateRowsAiAction } from './lib/actions/batch-update-rows-ai';
import { batchDeleteRowsAiAction } from './lib/actions/batch-delete-rows-ai';
import { aggregateFieldAiAction } from './lib/actions/aggregate-field-ai';
import { listWorkspacesAction } from './lib/actions/list-workspaces';
import { listDatabasesAction } from './lib/actions/list-databases';
import { listTablesAction } from './lib/actions/list-tables';
import { getTableAction } from './lib/actions/get-table';
import { getTableFieldsAction } from './lib/actions/get-table-fields';
import { listViewsAction } from './lib/actions/list-views';
import { listRowNamesAction } from './lib/actions/list-row-names';
import { getFieldUniqueValuesAction } from './lib/actions/get-field-unique-values';
import { listWorkspaceUsersAction } from './lib/actions/list-workspace-users';
import { searchWorkspaceAction } from './lib/actions/search-workspace';
import { createDatabaseAction } from './lib/actions/create-database';
import { createTableAction } from './lib/actions/create-table';
import { updateTableAction } from './lib/actions/update-table';
import { deleteTableAction } from './lib/actions/delete-table';
import { createFieldAction } from './lib/actions/create-field';
import { updateFieldAction } from './lib/actions/update-field';
import { deleteFieldAction } from './lib/actions/delete-field';
import { createViewAction } from './lib/actions/create-view';
import { getRowHistoryAction } from './lib/actions/get-row-history';
import { exportTableAction } from './lib/actions/export-table';
import { getExportJobAction } from './lib/actions/get-export-job';
import { rowCreatedTrigger } from './lib/triggers/row-created';
import { rowUpdatedTrigger } from './lib/triggers/row-updated';
import { rowDeletedTrigger } from './lib/triggers/row-deleted';
import { rowsCreatedTrigger } from './lib/triggers/rows-created';
import { rowsUpdatedTrigger } from './lib/triggers/rows-updated';
import { rowsDeletedTrigger } from './lib/triggers/rows-deleted';
import { rowEventTrigger } from './lib/triggers/row-event';
import { baserowAuth, baserowAuthHelpers, BaserowAuthValue } from './lib/auth';
import { BaserowClient } from './lib/common/client';

async function buildCustomApiAuthHeader(auth: BaserowAuthValue): Promise<{ Authorization: string }> {
  const { apiUrl, token, email, password } = auth.props;
  if (baserowAuthHelpers.isJwtAuth(auth)) {
    if (!email || !password) {
      throw new Error('Email and Password are required for JWT authentication.');
    }
    const jwt = await BaserowClient.getJwtToken({ apiUrl, email, password });
    return { Authorization: `JWT ${jwt}` };
  }
  if (!token) {
    throw new Error('Database Token is required for Database Token authentication.');
  }
  return { Authorization: `Token ${token}` };
}

export const baserow = createPiece({
  displayName: 'Baserow',
  description: 'Open-source online database tool, alternative to Airtable',
  auth: baserowAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/baserow.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["kishanprmr", "MoShizzle", "abuaboud", 'bst1n', 'sanket-a11y', 'onyedikachi-david'],
  actions: [
    createRowAction,
    getRowAction,
    listRowsAction,
    findRowAction,
    updateRowAction,
    upsertRowAction,
    deleteRowAction,
    cleanRowAction,
    batchCreateRowsAction,
    batchUpdateRowsAction,
    batchDeleteRowsAction,
    aggregateFieldAction,
    uploadFileAction,
    createRowAiAction,
    getRowAiAction,
    listRowsAiAction,
    findRowAiAction,
    updateRowAiAction,
    upsertRowAiAction,
    deleteRowAiAction,
    batchCreateRowsAiAction,
    batchUpdateRowsAiAction,
    batchDeleteRowsAiAction,
    aggregateFieldAiAction,
    listWorkspacesAction,
    listDatabasesAction,
    listTablesAction,
    getTableAction,
    getTableFieldsAction,
    listViewsAction,
    listRowNamesAction,
    getFieldUniqueValuesAction,
    listWorkspaceUsersAction,
    searchWorkspaceAction,
    createDatabaseAction,
    createTableAction,
    updateTableAction,
    deleteTableAction,
    createFieldAction,
    updateFieldAction,
    deleteFieldAction,
    createViewAction,
    getRowHistoryAction,
    exportTableAction,
    getExportJobAction,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        if (!auth) {
          return '';
        }
        return auth.props.apiUrl;
      },
      auth: baserowAuth,
      authMapping: buildCustomApiAuthHeader,
    }),
  ],
  triggers: [
    rowCreatedTrigger,
    rowUpdatedTrigger,
    rowDeletedTrigger,
    rowEventTrigger,
    rowsCreatedTrigger,
    rowsUpdatedTrigger,
    rowsDeletedTrigger,
  ],
});
