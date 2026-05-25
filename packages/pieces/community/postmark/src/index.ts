import { createPiece } from '@activepieces/pieces-framework';
import { sendEmailAction } from './lib/actions/send-email';
import { postmarkAuth } from './lib/auth';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const postmark = createPiece({
  displayName: 'Postmark',
  auth: postmarkAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/postmark.png',
  authors: ['Angelebeats'],
  actions: [sendEmailAction,
    createCustomApiCallAction({
      auth:postmarkAuth,
      baseUrl:()=>'https://api.postmarkapp.com',
      authMapping:async (auth)=>{
        return{
          'X-Postmark-Server-Token':auth.secret_text
        }
      }
    })
  ],
  triggers: [],
});
