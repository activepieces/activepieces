import {
  createCustomApiCallAction,
} from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { airtableCreateRecordAction } from './lib/actions/create-record';
import { airtableDeleteRecordAction } from './lib/actions/delete-record';
import { airtableFindRecordAction } from './lib/actions/find-record';
import { airtableUpdateRecordAction } from './lib/actions/update-record';
import { airtableCleanRecordAction } from './lib/actions/clean-record';
import { airtableNewRecordTrigger } from './lib/trigger/new-record.trigger';
import { airtableUpdatedRecordTrigger } from './lib/trigger/update-record.trigger';
import { airtableUploadFileToColumnAction } from './lib/actions/upload-file-to-column';
import { airtableAddCommentToRecordAction } from './lib/actions/add-comment-to-record';
import { airtableCreateBaseAction } from './lib/actions/create-base';
import { airtableCreateTableAction } from './lib/actions/create-table';
import { airtableFindBaseAction } from './lib/actions/find-base';
import { airtableGetRecordByIdAction } from './lib/actions/find-record-by-id';
import { airtableFindTableByIdAction } from './lib/actions/find-table-by-id';
import { airtableFindTableAction } from './lib/actions/find-table';
import { airtableGetBaseSchemaAction } from './lib/actions/get-base-schema';
import { airtableCreateRecordAiAction } from './lib/actions/create-record-ai';
import { airtableGetRecordAiAction } from './lib/actions/get-record-ai';
import { airtableUpdateRecordAiAction } from './lib/actions/update-record-ai';
import { airtableDeleteRecordAiAction } from './lib/actions/delete-record-ai';
import { airtableListRecordsAction } from './lib/actions/list-records';
import { airtableListBasesAction } from './lib/actions/list-bases';
import { airtableGetBaseSchemaAiAction } from './lib/actions/get-base-schema-ai';
import { airtableUploadAttachmentAiAction } from './lib/actions/upload-attachment-ai';
import { airtableUpsertRecordsAction } from './lib/actions/upsert-records';
import { airtableDeleteRecordsBatchAction } from './lib/actions/delete-records-batch';
import { airtableGetCurrentUserAction } from './lib/actions/get-current-user';
import { airtableSearchRecordsAction } from './lib/actions/search-records';
import { airtableAddCommentToRecordAiAction } from './lib/actions/add-comment-to-record-ai';
import { airtableCreateTableAiAction } from './lib/actions/create-table-ai';
import { airtableCreateBaseAiAction } from './lib/actions/create-base-ai';
import { airtableUpdateTableAction } from './lib/actions/update-table';
import { airtableCreateFieldAction } from './lib/actions/create-field';
import { airtableUpdateFieldAction } from './lib/actions/update-field';
import { airtableListRecordCommentsAction } from './lib/actions/list-record-comments';
import { airtableAuth } from './lib/auth';

export const airtable = createPiece({
  displayName: 'Airtable',
  description: 'Low‒code platform to build apps.',

  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/airtable.png',
  authors: [
    'kanarelo',
    'TaskMagicKyle',
    'Salem-Alaa',
    'kishanprmr',
    'MoShizzle',
    'AbdulTheActivePiecer',
    'khaledmashaly',
    'abuaboud',
    'Pranith124',
    'onyedikachi-david',
    'bst1n',
    'sanket-a11y',
  ],
  categories: [PieceCategory.PRODUCTIVITY],
  auth: airtableAuth,
  actions: [
    airtableCreateRecordAction,
    airtableFindRecordAction,
    airtableUpdateRecordAction,
    airtableCleanRecordAction,
    airtableDeleteRecordAction,
    airtableUploadFileToColumnAction,
    airtableAddCommentToRecordAction,
    airtableCreateBaseAction,
    airtableCreateTableAction,
    airtableFindBaseAction,
    airtableFindTableByIdAction,
    airtableGetRecordByIdAction,
    airtableFindTableAction,
    airtableGetBaseSchemaAction,
    airtableCreateRecordAiAction,
    airtableGetRecordAiAction,
    airtableUpdateRecordAiAction,
    airtableDeleteRecordAiAction,
    airtableListRecordsAction,
    airtableListBasesAction,
    airtableGetBaseSchemaAiAction,
    airtableUploadAttachmentAiAction,
    airtableUpsertRecordsAction,
    airtableDeleteRecordsBatchAction,
    airtableGetCurrentUserAction,
    airtableSearchRecordsAction,
    airtableAddCommentToRecordAiAction,
    airtableCreateTableAiAction,
    airtableCreateBaseAiAction,
    airtableUpdateTableAction,
    airtableCreateFieldAction,
    airtableUpdateFieldAction,
    airtableListRecordCommentsAction,
    createCustomApiCallAction({
      baseUrl: () => {
        return 'https://api.airtable.com/v0';
      },
      auth: airtableAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [airtableNewRecordTrigger, airtableUpdatedRecordTrigger],
});
