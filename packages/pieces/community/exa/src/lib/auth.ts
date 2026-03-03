import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './common';

const markdownDescription = `
Obtain your API key from [Dashboard Setting](https://dashboard.exa.ai/api-keys).
`;

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
