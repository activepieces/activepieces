import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { SoftrAuth } from './lib/common/auth';
import { createDatabaseRecord } from './lib/actions/create-database-record';
import { createAppUser } from './lib/actions/create-app-user';
import { deleteAppUser } from './lib/actions/delete-app-user';
import { deleteDatabaseRecord } from './lib/actions/delete-database-record';
import { findDatabaseRecord } from './lib/actions/find-database-record';
import { updateDatabaseRecord } from './lib/actions/update-database-record';
import { newDatabaseRecord } from './lib/triggers/new-database-record';
import { updatedDatabaseRecord } from './lib/triggers/updated-database-record';

export const softr = createPiece({
  displayName: 'Softr',
  auth: SoftrAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/softr.png',
  authors: ['Sanket6652'],
  actions: [
    createAppUser,
    createDatabaseRecord,
    deleteAppUser,
    deleteDatabaseRecord,
    findDatabaseRecord,
    updateDatabaseRecord,
  ],
  triggers: [newDatabaseRecord, updatedDatabaseRecord],
});
