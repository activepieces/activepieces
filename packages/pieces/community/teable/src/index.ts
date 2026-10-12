import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createRecordAction } from './lib/actions/create-record';
import { createRecordsAction } from './lib/actions/create-records';
import { findRecordsAction } from './lib/actions/find-records';
import { findRecordAction } from './lib/actions/find-record';
import { deleteRecordAction } from './lib/actions/delete-record';
import { deleteRecordsAction } from './lib/actions/delete-records';
import { updateRecordAction } from './lib/actions/update-record';
import { updateRecordsAction } from './lib/actions/update-records';
import { uploadAttachmentAction } from './lib/actions/upload-attachment';
import { listBasesAction } from './lib/actions/list-bases';
import { listTablesAction } from './lib/actions/list-tables';
import { listFieldsAction } from './lib/actions/list-fields';
import { listViewsAction } from './lib/actions/list-views';
import { createTableAction } from './lib/actions/create-table';
import { createFieldAction } from './lib/actions/create-field';
import { addCommentAction } from './lib/actions/add-comment';
import { getBaseSchemaAi } from './lib/actions/get-base-schema-ai';
import { createRecordAi } from './lib/actions/create-record-ai';
import { updateRecordAi } from './lib/actions/update-record-ai';
import { upsertRecordAi } from './lib/actions/upsert-record-ai';
import { searchRecordsAi } from './lib/actions/search-records-ai';
import { newRecordTrigger } from './lib/triggers/new-record';
import { updatedRecordTrigger } from './lib/triggers/updated-record';
import { TeableAuth, teableAuthUtil } from './lib/auth';
import { TEABLE_CLOUD_URL } from './lib/common/constants';

export const teable = createPiece({
  displayName: 'Teable',
  auth: TeableAuth,
  description: 'No-code database built on PostgreSQL',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/teable.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['codegino', 'onyedikachi-david'],
  actions: [
    createRecordAction,
    createRecordsAction,
    findRecordsAction,
    findRecordAction,
    updateRecordAction,
    updateRecordsAction,
    deleteRecordAction,
    deleteRecordsAction,
    uploadAttachmentAction,
    listBasesAction,
    listTablesAction,
    listFieldsAction,
    listViewsAction,
    createTableAction,
    createFieldAction,
    addCommentAction,
    getBaseSchemaAi,
    createRecordAi,
    updateRecordAi,
    upsertRecordAi,
    searchRecordsAi,
    createCustomApiCallAction({
      auth: TeableAuth,
      baseUrl: (auth) =>
        auth === undefined
          ? `${TEABLE_CLOUD_URL}/api`
          : `${teableAuthUtil.getBaseUrl(auth)}/api`,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${teableAuthUtil.getToken(auth)}`,
      }),
    }),
  ],
  triggers: [newRecordTrigger, updatedRecordTrigger],
});
