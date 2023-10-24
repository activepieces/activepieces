import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { askOpenAI } from './lib/actions/send-prompt';
import { transcribeAction } from './lib/actions/transcriptions';
import { translateAction } from './lib/actions/translation';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
const markdownDescription = `
Follow these instructions to get your OpenAI API Key:

1. Visit the following website: https://platform.openai.com/account/api-keys.
2. Once on the website, locate and click on the option to obtain your OpenAI API Key.

It is strongly recommended that you add your credit card information to your OpenAI account and upgrade to the paid plan **before** generating the API Key. This will help you prevent 429 errors.
`;

export const openaiAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'Api Key',
  required: true,
  validate: async (auth) => {
    try{
      await httpClient.sendRequest<{
        data: { id: string }[];
      }>({
        url: 'https://api.openai.com/v1/models',
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.auth as string
        }
      });
      return{
        valid: true,
      }
    }catch(e){
      return{
        valid: false,
        error: 'Invalid API token'
      }
    }
  }
});

export const openai = createPiece({
  displayName: 'OpenAI',
  description: 'Use ChatGPT to generate text',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
  auth: openaiAuth,
  actions: [ askOpenAI , transcribeAction , translateAction ],
  authors: ['aboudzein', 'creed983', 'astorozhevsky' , 'Salem-Alaa'],
  triggers: []
});
