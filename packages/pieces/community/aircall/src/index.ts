import { createPiece } from '@activepieces/pieces-framework';
import { aircallAuth } from './lib/common/auth';
import { commentACall } from './lib/actions/comment-a-call';
import { createAContact } from './lib/actions/create-a-contact';
import { findCalls } from './lib/actions/find-calls';
import { findContact } from './lib/actions/find-contact';
import { getCall } from './lib/actions/get-call';
import { tagACall } from './lib/actions/tag-a-call';
import { updateContact } from './lib/actions/update-contact';
import { callEnded } from './lib/triggers/call-ended';
import { newContact } from './lib/triggers/new-contact';
import { newNote } from './lib/triggers/new-note';
import { newNumberCreated } from './lib/triggers/new-number-created';
import { newSms } from './lib/triggers/new-sms';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { BASE_URL } from './lib/common/client';

export const aircall = createPiece({
  displayName: 'Aircall',
  auth: aircallAuth,
  minimumSupportedRelease: '0.36.1',
  categories:[PieceCategory.BUSINESS_INTELLIGENCE,PieceCategory.COMMUNICATION],
  logoUrl: 'https://cdn.activepieces.com/pieces/aircall.png',
  authors: ['Sanket6652'],
  actions: [
    commentACall,
    createAContact,
    findCalls,
    findContact,
    getCall,
    tagACall,
    updateContact,
    createCustomApiCallAction({
      auth:aircallAuth,
      baseUrl:()=>BASE_URL,
      authMapping:async (auth)=>{
        const { username,password } = auth as { username: string ,password:string};
        return {
          Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString(
            'base64'
          )}`,
        };
      }
    })
  ],
  triggers: [
    callEnded,
    newContact,
    newNote,
    newNumberCreated,
    newSms
  ],
});
