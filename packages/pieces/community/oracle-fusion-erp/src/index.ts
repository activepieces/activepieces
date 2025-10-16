import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { oracleFusionAuth } from './auth';
import { createRecord } from './lib/actions/create-record';
import { updateRecord } from './lib/actions/update-record';
import { deleteRecord } from './lib/actions/delete-record';
import { getRecord } from './lib/actions/get-record';
import { searchRecords } from './lib/actions/search-records';
import { newRecord } from './lib/triggers/new-record';

export const oracleFusionErp = createPiece({
  displayName: 'Oracle Fusion Cloud ERP',
  description: 'Generic CRUD, search, and watch over Oracle Fusion business objects',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/oracle-fusion-erp.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['antcybersec'],
  auth: oracleFusionAuth,
  actions: [createRecord, updateRecord, deleteRecord, getRecord, searchRecords],
  triggers: [newRecord],
});
