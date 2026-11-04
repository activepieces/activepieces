import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { knackAuth } from './lib/common/auth';
import { createRecordAction } from './lib/actions/create-record';
import { deleteRecordAction } from './lib/actions/delete-record';
import { findRecordAction } from './lib/actions/find-record';
import { updateRecordAction } from './lib/actions/update-record';
import { listObjectsAction } from './lib/actions/list-objects';
import { getObjectFieldsAction } from './lib/actions/get-object-fields';
import { searchRecordsAction } from './lib/actions/search-records';
import { getRecordAction } from './lib/actions/get-record';
import { createRecordAiAction } from './lib/actions/create-record-ai';
import { updateRecordAiAction } from './lib/actions/update-record-ai';

export const knack = createPiece({
  displayName: 'Knack',
  auth: knackAuth,
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/knack.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['aryel780', 'OdaiAhmed99'],
  actions: [
    createRecordAction,
    deleteRecordAction,
    findRecordAction,
    updateRecordAction,
    listObjectsAction,
    getObjectFieldsAction,
    searchRecordsAction,
    getRecordAction,
    createRecordAiAction,
    updateRecordAiAction,
    createCustomApiCallAction({
      auth: knackAuth,
      baseUrl: () => 'https://api.knack.com/v1',
      authMapping: async (auth) => {
        const { apiKey, applicationId } = auth.props;
        return {
          'X-Knack-Application-ID': applicationId,
          'X-Knack-REST-API-Key': apiKey,
        };
      },
    }),
  ],
  triggers: [],
});
