import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { searchAction } from './lib/actions/search';
import { extractContentAction } from './lib/actions/extract-content';
import { answerAction } from './lib/actions/answer';
import { createDeepResearchTaskAction } from './lib/actions/create-deep-research-task';
import { createBatchAction } from './lib/actions/create-batch';
import { listDatasourcesAction } from './lib/actions/list-datasources';
import { createCustomApiCallAction, HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './lib/common';

const markdownDescription = `Obtain your API key from [Valyu Platform](https://platform.valyu.ai/user/account/apikeys).`;

export const valyuAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await makeRequest(auth, HttpMethod.GET, '/v1/datasources');
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key.',
      };
    }
  },
});

export const valyu = createPiece({
  displayName: 'Valyu',
  description: 'Search the web, research papers, and proprietary datasets with intelligent query processing.',
  auth: valyuAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/valyu.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.PRODUCTIVITY],
  authors: ['onyedikachi-david'],
  actions: [
    searchAction,
    extractContentAction,
    answerAction,
    createDeepResearchTaskAction,
    createBatchAction,
    listDatasourcesAction,
    createCustomApiCallAction({
      auth: valyuAuth,
      baseUrl: () => 'https://api.valyu.ai',
      authMapping: async (auth) => ({
        'x-api-key': `${auth}`,
      }),
    }),
  ],
  triggers: [],
});