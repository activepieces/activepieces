import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { smartsuiteAuth } from './lib/auth';
import { createRecord } from './lib/actions/create-record';
import { updateRecord } from './lib/actions/update-record';
import { deleteRecord } from './lib/actions/delete-record';
import { searchRecords } from './lib/actions/search-records';
import { uploadFile } from './lib/actions/upload-file';
import { findRecords } from './lib/actions/find-records';
import { getRecord } from './lib/actions/get-record';
import { newRecord } from './lib/triggers/new-record';
import { updatedRecord } from './lib/triggers/updated-record';

export const smartsuite = createPiece({
  displayName: 'SmartSuite',
  description: 'Collaborative work management platform combining databases with spreadsheets',
  logoUrl: 'https://cdn.activepieces.com/pieces/smartsuite.png',
  categories: [PieceCategory.PRODUCTIVITY],
  auth: smartsuiteAuth,
  minimumSupportedRelease: '0.30.0',
  authors: ['activepieces-community'],
  actions: [
    createRecord,
    updateRecord,
    deleteRecord,
    searchRecords,
    uploadFile,
    findRecords,
    getRecord,
  ],
  triggers: [
    newRecord,
    updatedRecord,
  ],
}); 