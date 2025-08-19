import {
  createPiece,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { smartsuiteAuth } from './lib/auth';

// Actions
import { createRecord } from './lib/actions/create-record';
import { updateRecord } from './lib/actions/update-record';
import { deleteRecord } from './lib/actions/delete-record';
import { uploadFile } from './lib/actions/upload-file';
import { findRecords } from './lib/actions/find-records';
import { getRecord } from './lib/actions/get-record';

// Triggers
import { newRecord } from './lib/triggers/new-record';
import { updatedRecord } from './lib/triggers/updated-record';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { SMARTSUITE_API_URL } from './lib/common/constants';

export const smartsuite = createPiece({
  displayName: 'SmartSuite',
  description:
    'Collaborative work management platform combining databases with spreadsheets.',
  logoUrl: 'https://cdn.activepieces.com/pieces/smartsuite.png',
  categories: [PieceCategory.PRODUCTIVITY],
  auth: smartsuiteAuth,
  minimumSupportedRelease: '0.30.0',
  authors: ['Kunal-Darekar', 'kishanprmr'],
  actions: [
    createRecord,
    updateRecord,
    deleteRecord,
    uploadFile,
    findRecords,
    getRecord,
    createCustomApiCallAction({
      auth: smartsuiteAuth,
      baseUrl: () => SMARTSUITE_API_URL,
      authMapping: async (auth) => {
        const authValue = auth as PiecePropValueSchema<typeof smartsuiteAuth>;
        return {
          Authorization: `Token ${authValue.apiKey}`,
          'ACCOUNT-ID': authValue.accountId,
        };
      },
    }),
  ],
  triggers: [newRecord, updatedRecord],
});
