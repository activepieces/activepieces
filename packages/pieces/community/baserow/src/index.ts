import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createRowAction } from './lib/actions/create-row';
import { deleteRowAction } from './lib/actions/delete-row';
import { getRowAction } from './lib/actions/get-row';
import { listRowsAction } from './lib/actions/list-rows';
import { updateRowAction } from './lib/actions/update-row';
import { findRowAction } from './lib/actions/find-row';
import { cleanRowAction } from './lib/actions/clean-row';
import { rowCreatedTrigger } from './lib/triggers/row-created';
import { rowUpdatedTrigger } from './lib/triggers/row-updated';
import { rowDeletedTrigger } from './lib/triggers/row-deleted';
import { baserowAuth } from './lib/auth';

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
    createCustomApiCallAction({
      baseUrl: (auth) => {
        if (!auth) {
          return '';
        }
        return auth.props.apiUrl;
      },
      auth: baserowAuth,
      authMapping: async (auth) => ({
        Authorization: `Token ${auth.props.token}`,
      }),
    }),
  ],
  triggers: [rowCreatedTrigger, rowUpdatedTrigger, rowDeletedTrigger],
});
