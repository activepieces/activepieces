import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { aircallAuth } from './lib/common/auth';
import { newSmsTrigger } from './lib/triggers/new-sms';
import { newNumberCreatedTrigger } from './lib/triggers/new-number-created';
import { newNoteTrigger } from './lib/triggers/new-note';
import { newContactTrigger } from './lib/triggers/new-contact';
import { newCallEndedTrigger } from './lib/triggers/new-call-ended';
import { commentCallAction } from './lib/actions/comment-call';
import { tagCallAction } from './lib/actions/tag-call';
import { sendMessageAction } from './lib/actions/send-message';
import { createContactAction } from './lib/actions/create-contact';
import { updateContactAction } from './lib/actions/update-contact';
import { getCallAction } from './lib/actions/get-call';
import { findContactAction } from './lib/actions/find-contact';
import { findCallsAction } from './lib/actions/find-calls';

export const aircall = createPiece({
  displayName: 'Aircall',
  logoUrl: 'https://cdn.activepieces.com/pieces/aircall.png',
  auth: aircallAuth,
  actions: [
    commentCallAction,
    tagCallAction,
    sendMessageAction,
    createContactAction,
    updateContactAction,
    getCallAction,
    findContactAction,
    findCallsAction,
  ],
  triggers: [
    newSmsTrigger,
    newNumberCreatedTrigger,
    newNoteTrigger,
    newContactTrigger,
    newCallEndedTrigger,
  ],
}); 