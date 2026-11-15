import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';

import { browseRecordsAction } from './lib/actions/browse-records';
import { deleteRecordsAction } from './lib/actions/delete-records';
import { deleteRecordsByFilterAction } from './lib/actions/delete-records-by-filter';
import { getIndexSettingsAction } from './lib/actions/get-index-settings';
import { getRecordAction } from './lib/actions/get-record';
import { listIndicesAction } from './lib/actions/list-indices';
import { saveRecordsAction } from './lib/actions/save-records';
import { searchRecordsAction } from './lib/actions/search-records';
import { updateRecordAttributesAction } from './lib/actions/update-record-attributes';
import { algoliaAuth } from './lib/common/auth';
import { isValidApplicationId, parseApplicationId } from './lib/common/utils';

export const algolia = createPiece({
  displayName: 'Algolia',
  description:
    'Search and manage your Algolia indices — search, get, add, update, browse, and delete records.',
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/algolia.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['veri5ied'],
  auth: algoliaAuth,
  actions: [
    saveRecordsAction,
    browseRecordsAction,
    deleteRecordsAction,
    listIndicesAction,
    searchRecordsAction,
    getRecordAction,
    updateRecordAttributesAction,
    deleteRecordsByFilterAction,
    getIndexSettingsAction,
    createCustomApiCallAction({
      auth: algoliaAuth,
      baseUrl: (auth) => {
        if (!auth || !isValidApplicationId(auth.props.applicationId)) {
          return '';
        }

        return `https://${auth.props.applicationId.trim()}.algolia.net/1`;
      },
      authMapping: async (auth) => ({
        'x-algolia-application-id': parseApplicationId(auth.props.applicationId),
        'x-algolia-api-key': auth.props.apiKey,
      }),
    }),
  ],
  triggers: [],
});
