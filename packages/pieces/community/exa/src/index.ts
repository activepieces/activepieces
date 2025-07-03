import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getContentsAction } from './lib/actions/get-contents';
import { generateAnswerAction } from './lib/actions/generate-answer';
import { performSearchAction } from './lib/actions/perform-search';
import { findSimilarLinksAction } from './lib/actions/find-similar-links';
import { createCustomApiCallAction, HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './lib/common';

const markdownDescription = `Obtain your API key from [Dashboard Setting](https://dashboard.exa.ai/api-keys).`;

export const exaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate:async ({auth})=>{
    try
    {
      await makeRequest(auth,HttpMethod.POST,
        '/search',{query:'Activepieces'}
      )

      return{
        valid:true
      }

    }catch(e)
    {
      return{
        valid:false,
        error:'Invalid API Key.'
      }
    }
  }
});

export const exa = createPiece({
  displayName: 'Exa',
  description: 'AI-powered search and content extraction from the web.',
  auth: exaAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/exa.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE,PieceCategory.PRODUCTIVITY],
  authors: ['krushnarout','kishanprmr'],
  actions: [
    getContentsAction,
    generateAnswerAction,
    performSearchAction,
    findSimilarLinksAction,
    createCustomApiCallAction({
      auth:exaAuth,
       baseUrl: () => 'https://api.exa.ai',
      authMapping: async (auth) => ({
        'x-api-key': `${auth}`,
      }),
    })
  ],
  triggers: [],
});
