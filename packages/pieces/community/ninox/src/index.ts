import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createRecord } from './lib/actions/create-record';
import { updateRecord } from './lib/actions/update-record';
import { deleteRecord } from './lib/actions/delete-record';
import { uploadFile } from './lib/actions/upload-file';
import { downloadFile } from './lib/actions/download-file';
import { findRecord } from './lib/actions/find-record';
import { listFiles } from './lib/actions/list-files';
import { newRecord } from './lib/triggers/new-record';
import { updatedRecord } from './lib/triggers/updated-record';

export const ninoxAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Enter your Ninox API Key (get it from your Ninox workspace settings).',
});

export const ninox = createPiece({
  displayName: 'Ninox',
  description: 'Database and business application platform',
  logoUrl: 'https://ninox.com/favicon.ico',
  auth: ninoxAuth,
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.PRODUCTIVITY, PieceCategory.DEVELOPER_TOOLS],
  authors: ['activepieces'],
  actions: [
    createRecord,
    updateRecord,
    deleteRecord,
    uploadFile,
    downloadFile,
    findRecord,
    listFiles,
  ],
  triggers: [
    newRecord,
    updatedRecord,
  ],
});
