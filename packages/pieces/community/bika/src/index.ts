import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createRecordByIdAction } from './lib/actions/ai/create-record-by-id';
import { deleteRecordByIdAction } from './lib/actions/ai/delete-record-by-id';
import { findRecordsByIdAction } from './lib/actions/ai/find-records-by-id';
import { getDatabaseFieldsByIdAction } from './lib/actions/ai/get-database-fields-by-id';
import { getRecordByIdAction } from './lib/actions/ai/get-record-by-id';
import { listDatabasesByIdAction } from './lib/actions/ai/list-databases-by-id';
import { updateRecordByIdAction } from './lib/actions/ai/update-record-by-id';
import { createRecordAction } from './lib/actions/create-record';
import { deleteRecordAction } from './lib/actions/delete-record';
import { findRecordAction } from './lib/actions/find-record';
import { findRecordsAction } from './lib/actions/find-records';
import { listSpacesAction } from './lib/actions/list-spaces';
import { updateRecordAction } from './lib/actions/update-record';
import { BikaAuth } from './lib/auth';
import { BIKA_API_BASE } from './lib/common/client';

export const bika = createPiece({
  displayName: 'Bika.ai',
  auth: BikaAuth,
  description: 'Interactive spreadsheets with collaboration',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/bika.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['codegino'],
  actions: [
    createRecordAction,
    findRecordsAction,
    findRecordAction,
    updateRecordAction,
    deleteRecordAction,
    listSpacesAction,
    listDatabasesByIdAction,
    getDatabaseFieldsByIdAction,
    findRecordsByIdAction,
    getRecordByIdAction,
    createRecordByIdAction,
    updateRecordByIdAction,
    deleteRecordByIdAction,
    createCustomApiCallAction({
      baseUrl: () => BIKA_API_BASE,
      auth: BikaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.props.token.trim()}`,
      }),
    }),
  ],
  triggers: [],
});
