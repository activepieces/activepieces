import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { browseRecordsAction } from './lib/actions/browse-records';
import { deleteRecordsAction } from './lib/actions/delete-records';
import { saveRecordsAction } from './lib/actions/save-records';
import { algoliaAuth } from './lib/common/auth';

export const algolia = createPiece({
  displayName: 'Algolia',
  description:
    'Manage your Algolia search indices — add, browse, and delete records.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/algolia.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['veri5ied'],
  auth: algoliaAuth,
  actions: [
    saveRecordsAction,
    browseRecordsAction,
    deleteRecordsAction,
    createCustomApiCallAction({
      auth: algoliaAuth,
      baseUrl: (auth) => {
        if (!auth) {
          return '';
        }

        return `https://${auth.props.applicationId}.algolia.net/1`;
      },
      authMapping: async (auth) => ({
        'x-algolia-application-id': auth.props.applicationId,
        'x-algolia-api-key': auth.props.apiKey,
      }),
    }),
  ],
  triggers: [],
});
