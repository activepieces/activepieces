import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { queryAgentAction } from './lib/actions/query-agent';
import { queryDatastoretAction } from './lib/actions/query-datastore';
import { uploadFileAction } from './lib/actions/upload-file';
import { listAgentsAction } from './lib/actions/list-agents';
import { listDatastoresAction } from './lib/actions/list-datastores';
import { getDatasourceAction } from './lib/actions/get-datasource';
import { addTextToDatastoreAction } from './lib/actions/add-text-to-datastore';
import { addWebPageToDatastoreAction } from './lib/actions/add-web-page-to-datastore';
import { deleteDatasourceAction } from './lib/actions/delete-datasource';
import { listConversationsAction } from './lib/actions/list-conversations';
import { getConversationMessagesAction } from './lib/actions/get-conversation-messages';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { chaindeskAuth } from './lib/common/auth';
import { BASE_URL } from './lib/common/constants';

export const chaindesk = createPiece({
  displayName: 'Chaindesk',
  auth: chaindeskAuth,
  description: 'Build AI agents and knowledge bases on Chaindesk (now Askli).',
  minimumSupportedRelease: '0.86.4',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  logoUrl: 'https://cdn.activepieces.com/pieces/chaindesk.png',
  authors: ['kishanprmr', 'OdaiAhmed99'],
  actions: [
    queryAgentAction,
    queryDatastoretAction,
    uploadFileAction,
    addTextToDatastoreAction,
    addWebPageToDatastoreAction,
    getDatasourceAction,
    deleteDatasourceAction,
    listAgentsAction,
    listDatastoresAction,
    listConversationsAction,
    getConversationMessagesAction,
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
