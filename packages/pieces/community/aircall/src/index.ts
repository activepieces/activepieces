import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { aircallAuth } from './lib/common/auth';
import { commentACall } from './lib/actions/comment-a-call';
import { createAContact } from './lib/actions/create-a-contact';
import { findCalls } from './lib/actions/find-calls';
import { findContact } from './lib/actions/find-contact';
import { getCall } from './lib/actions/get-call';
import { sendMessage } from './lib/actions/send-message';
import { tagACall } from './lib/actions/tag-a-call';
import { updateContact } from './lib/actions/update-contact';
import { callEnded } from './lib/triggers/call-ended';
import { newContact } from './lib/triggers/new-contact';
import { newNote } from './lib/triggers/new-note';
import { newNumberCreated } from './lib/triggers/new-number-created';
import { newSms } from './lib/triggers/new-sms';

export const aircall = createPiece({
  displayName: 'Aircall',
  auth: aircallAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/aircall.png',
  authors: ['Sanket6652'],
  actions: [
    commentACall,
    createAContact,
    findCalls,
    findContact,
    getCall,
    sendMessage,
    tagACall,
    updateContact
  ],
  triggers: [
    callEnded,
    newContact,
    newNote,
    newNumberCreated,
    newSms
  ],
});
