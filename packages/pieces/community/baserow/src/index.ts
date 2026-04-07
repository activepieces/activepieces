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
import { rowCreatedTrigger } from './lib/triggers/row-created';
import { rowUpdatedTrigger } from './lib/triggers/row-updated';
import { rowDeletedTrigger } from './lib/triggers/row-deleted';
import { rowsCreatedTrigger } from './lib/triggers/rows-created';
import { rowsUpdatedTrigger } from './lib/triggers/rows-updated';
import { rowsDeletedTrigger } from './lib/triggers/rows-deleted';
import { baserowAuth, isDatabaseTokenAuth } from './lib/auth';
import { BaserowClient } from './lib/common/client';

export const baserow = createPiece({
  displayName: 'Baserow',
  description: 'Open-source online database tool, alternative to Airtable',
  auth: baserowAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/baserow.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["kishanprmr","MoShizzle","abuaboud",'bst1n','sanket-a11y'],
  actions: [
    createRowAction,
    deleteRowAction,
    getRowAction,
    listRowsAction,
    updateRowAction,
    findRowAction,
    cleanRowAction,
    aggregateFieldAction,
    batchCreateRowsAction,
    batchUpdateRowsAction,
    batchDeleteRowsAction,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        if (!auth) {
          return '';
        }
        return auth.props.apiUrl;
      },
      auth: baserowAuth,
      authMapping: async (auth) => {
        if (isDatabaseTokenAuth(auth)) {
          return { Authorization: `Token ${auth.props.token}` };
        }
        const jwt = await BaserowClient.getJwtToken(
          auth.props.apiUrl,
          auth.props.email,
          auth.props.password
        );
        return { Authorization: `JWT ${jwt}` };
      },
    }),
  ],
  triggers: [
    rowCreatedTrigger,
    rowUpdatedTrigger,
    rowDeletedTrigger,
    rowsCreatedTrigger,
    rowsUpdatedTrigger,
    rowsDeletedTrigger,
  ],
});
