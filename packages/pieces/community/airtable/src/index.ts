import {
  AuthenticationType,
  HttpMethod,
  createCustomApiCallAction,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { airtableCreateRecordAction } from './lib/actions/create-record';
import { airtableDeleteRecordAction } from './lib/actions/delete-record';
import { airtableFindRecordAction } from './lib/actions/find-record';
import { airtableUpdateRecordAction } from './lib/actions/update-record';
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
import { airtableAuth } from './lib/auth';

export const airtable = createPiece({
  displayName: 'Airtable',
  description: 'Low‒code platform to build apps.',

  minimumSupportedRelease: '0.30.0',
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
    'onyedikachi-david'
  ],
  categories: [PieceCategory.PRODUCTIVITY],
  auth: airtableAuth,
  actions: [
    airtableCreateRecordAction,
    airtableFindRecordAction,
    airtableUpdateRecordAction,
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
