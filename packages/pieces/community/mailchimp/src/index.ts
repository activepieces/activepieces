import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { addMemberToList } from './lib/actions/add-member-to-list';
import { addNoteToSubscriber } from './lib/actions/add-note-to-subscriber';
import { removeSubscriberFromTag } from './lib/actions/remove-subscriber-from-tag';
import { updateSubscriberInList } from './lib/actions/update-subscriber-status';

import { mailChimpSubscribeTrigger } from './lib/triggers/subscribe-trigger';
import { mailChimpUnsubscriberTrigger } from './lib/triggers/unsubscribe-trigger';
import { addSubscriberToTag } from './lib/actions/add-subscriber-to-tag';

export const mailchimpAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://login.mailchimp.com/oauth2/authorize',
  tokenUrl: 'https://login.mailchimp.com/oauth2/token',
  required: true,
  scope: [],
});

export const mailchimp = createPiece({
  displayName: 'Mailchimp',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/mailchimp.png',
  authors: ['AbdulTheActivePiecer', 'TaskMagicKyle'],
  auth: mailchimpAuth,
  actions: [
    addMemberToList,
    addNoteToSubscriber,
    addSubscriberToTag,
    removeSubscriberFromTag,
    updateSubscriberInList,
  ],
  triggers: [mailChimpSubscribeTrigger, mailChimpUnsubscriberTrigger],
});
