import { PieceAuth } from '@activepieces/pieces-framework';
import { xquikCommon } from './common';

export const xquikAuth = PieceAuth.SecretText({
  displayName: 'Xquik API Key',
  description:
    'Create an API key in Xquik, then paste it here. API docs: https://docs.xquik.com/api-reference/overview',
  required: true,
  validate:async ({auth}) =>{
    try{
      await xquikCommon.api.get({
        apiKey:auth,
        path:'/account',
      })

      return{
        valid:true
      }
    }
    catch{
      return{
        valid:false,
        error:'Invalid API key'
      }
    }
  }
});
