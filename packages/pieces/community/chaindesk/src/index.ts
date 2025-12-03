import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { queryAgentAction } from './lib/actions/query-agent';
import { queryDatastoretAction } from './lib/actions/query-datastore';
import { uploadFileAction } from './lib/actions/upload-file';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { chaindeskAuth } from './lib/common/auth';
import { BASE_URL } from './lib/common/constants';

export const chaindesk = createPiece({
  displayName: 'Chaindesk',
  auth: chaindeskAuth,
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  logoUrl: 'https://cdn.activepieces.com/pieces/chaindesk.png',
  authors: ['kishanprmr'],
  actions: [
    queryAgentAction,
    queryDatastoretAction,
    uploadFileAction,
    createCustomApiCallAction({
      auth: chaindeskAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.secret_text}`,
        };
      },
    }),
  ],
  triggers: [],
});
