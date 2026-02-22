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
import { baserowAuth } from './lib/auth';

export const baserow = createPiece({
  displayName: 'Baserow',
  description: 'Open-source online database tool, alternative to Airtable',
  auth: baserowAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/baserow.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["kishanprmr","MoShizzle","abuaboud"],
  actions: [
    createRowAction,
    deleteRowAction,
    getRowAction,
    listRowsAction,
    updateRowAction,
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
  triggers: [],
});
