import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { quickbaseAuth } from './lib/common/auth';
import { createRecord } from './lib/actions/create-record';
import { updateRecord } from './lib/actions/update-record';
import { deleteRecord } from './lib/actions/delete-record';
import { findRecord } from './lib/actions/find-record';
import { findOrCreateRecord } from './lib/actions/find-or-create-record';
import { createUpdateRecordsBulk } from './lib/actions/create-update-records-bulk';
import { newRecord } from './lib/triggers/new-record';
import { newOrUpdatedRecord } from './lib/triggers/new-or-updated-record';

export const quickbase = createPiece({
  displayName: 'Quickbase',
  auth: quickbaseAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/quickbase.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['sparkybug'],
  actions: [
    createRecord,
    updateRecord,
    deleteRecord,
    findRecord,
    findOrCreateRecord,
    createUpdateRecordsBulk,
  ],
  triggers: [newRecord, newOrUpdatedRecord],
});
