import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';

import { askGenieAction } from './lib/actions/ask-genie';
import { findRowsAction } from './lib/actions/find-rows';
import { insertRowAction } from './lib/actions/insert-row';
import { insertRowsAction } from './lib/actions/insert-rows';
import { runQueryAction } from './lib/actions/run-query';
import { updateRowsAction } from './lib/actions/update-rows';
import { uploadFileToVolumeAction } from './lib/actions/upload-file-to-volume';
import { upsertRowAction } from './lib/actions/upsert-row';
import { databricksAuth } from './lib/auth';
import { databricksClient } from './lib/common/client';

export const databricks = createPiece({
  displayName: 'Databricks',
  description:
    'Data and AI platform: query and load Unity Catalog tables, upload files to volumes and ask Genie questions.',
  minimumSupportedRelease: '0.86.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/databricks.png',
  categories: [
    PieceCategory.DEVELOPER_TOOLS,
    PieceCategory.BUSINESS_INTELLIGENCE,
  ],
  auth: databricksAuth,
  authors: ['kishanprmr'],
  actions: [
    insertRowAction,
    insertRowsAction,
    updateRowsAction,
    upsertRowAction,
    findRowsAction,
    runQueryAction,
    uploadFileToVolumeAction,
    askGenieAction,
    createCustomApiCallAction({
      auth: databricksAuth,
      baseUrl: (auth) => (auth ? databricksClient.baseUrl({ auth }) : ''),
      authMapping: async (auth, propsValue) => {
        const url = propsValue['url']?.['url'];
        if (
          typeof url === 'string' &&
          !databricksClient.isWorkspaceUrl({ auth, url })
        ) {
          throw new Error(
            'Custom API Call only sends your Databricks credentials to the connected workspace. Use a path such as /api/2.0/clusters/list, or a URL on your workspace.'
          );
        }
        return { Authorization: `Bearer ${auth.access_token}` };
      },
    }),
  ],
  triggers: [],
});
