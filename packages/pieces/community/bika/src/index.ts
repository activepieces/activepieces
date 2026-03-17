import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createRecordAction } from './lib/actions/create-record';
import { findRecordsAction } from './lib/actions/find-records';
import { findRecordAction} from './lib/actions/find-record';
import {deleteRecordAction } from './lib/actions/delete-record';
import { updateRecordAction } from './lib/actions/update-record';
import { makeClient } from './lib/common';
import { BikaAuth } from './lib/auth';

export const bika = createPiece({
  displayName: 'Bika.ai',
  auth: BikaAuth,
  description: `Interactive spreadsheets with collaboration`,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/bika.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: [
    'codegino'
  ],
  actions: [
    createRecordAction,
    findRecordsAction,
    findRecordAction,
    updateRecordAction,
    deleteRecordAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://bika.ai/api/openapi/bika',
      auth: BikaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth).props.token}`,
      }),
    }),
  ],
  triggers: [],
});
