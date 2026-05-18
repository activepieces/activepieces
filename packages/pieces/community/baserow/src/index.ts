import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
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
  minimumSupportedRelease: '0.30.0',
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
