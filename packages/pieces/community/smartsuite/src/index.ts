import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { smartsuiteAuth } from './lib/auth';
import {
  listRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  searchRecords,
} from './lib/actions';
import {
  newRecordTrigger,
  updatedRecordTrigger,
} from './lib/triggers';

export const smartsuite = createPiece({
  displayName: 'SmartSuite',
  description: 'Collaborative work management platform - Manage projects, workflows, and data',
  logoUrl: 'https://cdn.smartsuite.com/static/brand/logo.svg',
  categories: [PieceCategory.PROJECT_MANAGEMENT],
  authors: ['ktwo'],
  auth: smartsuiteAuth,
  minimumSupportedRelease: '1.0.0',
  actions: [
    listRecords,
    getRecord,
    createRecord,
    updateRecord,
    deleteRecord,
    searchRecords,
  ],
  triggers: [
    newRecordTrigger,
    updatedRecordTrigger,
  ],
});
