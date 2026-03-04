import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createRecordAction } from './lib/actions/create-record';
import { findRecordsAction } from './lib/actions/find-records';
import { findRecordAction} from './lib/actions/find-record';
import {deleteRecordAction } from './lib/actions/delete-record';
import { updateRecordAction } from './lib/actions/update-record';
import { TeableAuth } from './lib/auth';

export const teable = createPiece({
  displayName: 'Teable',
  auth: TeableAuth,
  description: 'No-code database built on PostgreSQL',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/teable.png',
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
      baseUrl: (auth) => {
        return (auth?.props.baseUrl?? 'https://app.teable.ai.');
      },
      auth: TeableAuth,
     authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth?.props.token ?? '')}`,
      }),
    }),
  ],
  triggers: [],
});

