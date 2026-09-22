import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createRecordAction } from './lib/actions/create-record';
import { findRecordAction } from './lib/actions/find-record';
import { updateRecordAction } from './lib/actions/update-record';
import { deleteRecordAction } from './lib/actions/delete-record';
import { listSpacesAction } from './lib/actions/list-spaces';
import { listDatasheetsAction } from './lib/actions/list-datasheets';
import { getDatasheetFieldsAction } from './lib/actions/get-datasheet-fields';
import { listViewsAction } from './lib/actions/list-views';
import { uploadAttachmentAction } from './lib/actions/upload-attachment';
import { searchNodesAction } from './lib/actions/search-nodes';
import { getNodeDetailsAction } from './lib/actions/get-node-details';
import { newRecordTrigger } from './lib/triggers/new-record';
import { makeClient } from './lib/common';
import { APITableAuth } from './lib/auth';

export const apitable = createPiece({
  displayName: 'AITable',
  auth: APITableAuth,
  description: `Interactive spreadsheets with collaboration`,
  minimumSupportedRelease: '0.87.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/apitable.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: [
    'alerdenisov',
    'Abdallah-Alwarawreh',
    'kishanprmr',
    'MoShizzle',
    'abuaboud',
  ],
  actions: [
    createRecordAction,
    updateRecordAction,
    findRecordAction,
    deleteRecordAction,
    listSpacesAction,
    listDatasheetsAction,
    getDatasheetFieldsAction,
    listViewsAction,
    uploadAttachmentAction,
    searchNodesAction,
    getNodeDetailsAction,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        return (auth?.props.apiTableUrl ?? '');
      },
      auth: APITableAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth?.props.token ?? '')}`,
      }),
    }),
  ],
  triggers: [newRecordTrigger],
});
