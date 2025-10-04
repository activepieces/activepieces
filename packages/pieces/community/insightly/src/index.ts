import { createPiece } from '@activepieces/pieces-framework';
import { insightlyAuth } from './lib/common/common';
import { createRecord } from './lib/actions/create-record';
import { updateRecord } from './lib/actions/update-record';
import { getRecord } from './lib/actions/get-record';
import { deleteRecord } from './lib/actions/delete-record';
import { findRecords } from './lib/actions/find-records';
import { newRecord } from './lib/triggers/new-record';
import { updatedRecord } from './lib/triggers/updated-record';
import { deletedRecord } from './lib/triggers/deleted-record';

export const insightly = createPiece({
  displayName: 'Insightly',
  auth: insightlyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/insightly.png',
  authors: [],
  actions: [createRecord, updateRecord, getRecord, deleteRecord, findRecords],
  triggers: [newRecord, updatedRecord, deletedRecord]
});
