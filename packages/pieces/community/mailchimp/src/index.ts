import { OAuth2PropertyValue, PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { addMemberToList } from './lib/actions/add-member-to-list';
import { addNoteToSubscriber } from './lib/actions/add-note-to-subscriber';
import { removeSubscriberFromTag } from './lib/actions/remove-subscriber-from-tag';
import { updateSubscriberInList } from './lib/actions/update-subscriber-status';

import { PieceCategory } from '@activepieces/shared';
import { addSubscriberToTag } from './lib/actions/add-subscriber-to-tag';
import { mailChimpSubscribeTrigger } from './lib/triggers/subscribe-trigger';
import { mailChimpUnsubscriberTrigger } from './lib/triggers/unsubscribe-trigger';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const mailchimpAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://login.mailchimp.com/oauth2/authorize',
  tokenUrl: 'https://login.mailchimp.com/oauth2/token',
  required: true,
  scope: [],
});

export const mailchimp = createPiece({
  displayName: 'Mailchimp',
  description: 'All-in-One integrated marketing platform',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/mailchimp.png',
  authors: ["abdullahranginwala","TaskMagicKyle","kishanprmr","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  categories: [PieceCategory.MARKETING],
  auth: mailchimpAuth,
  actions: [
    addMemberToList,
    addNoteToSubscriber,
    addSubscriberToTag,
    removeSubscriberFromTag,
    updateSubscriberInList,
    createCustomApiCallAction({
      auth: mailchimpAuth,
			baseUrl: () => {
        return `https://{mailChimpServerPrefix}.api.mailchimp.com/3.0/`;
      },
			authMapping: async (auth) => ({
					Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`
			}),
    }),
  ],
  triggers: [mailChimpSubscribeTrigger, mailChimpUnsubscriberTrigger],
});
