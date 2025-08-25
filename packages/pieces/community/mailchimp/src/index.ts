import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { addMemberToList } from './lib/actions/add-member-to-list';
import { addNoteToSubscriber } from './lib/actions/add-note-to-subscriber';
import { removeSubscriberFromTag } from './lib/actions/remove-subscriber-from-tag';
import { updateSubscriberInList } from './lib/actions/update-subscriber-status';
import { createCampaign } from './lib/actions/create-campaign';
import { getCampaignClickReport } from './lib/actions/get-campaign-report';
import { createAudience } from './lib/actions/create-audience';
import { addOrUpdateSubscriber } from './lib/actions/add-or-update-subscriber';
import { createList } from './lib/actions/create-list';
import { archiveSubscriber } from './lib/actions/archive-subscriber';
import { unsubscribeEmail } from './lib/actions/unsubscribe-email';
import { findCampaign } from './lib/actions/find-campaign';
import { findCustomer } from './lib/actions/find-customer';
import { findTag } from './lib/actions/find-tag';
import { findSubscriber } from './lib/actions/find-subscriber';

import { PieceCategory } from '@activepieces/shared';
import { addSubscriberToTag } from './lib/actions/add-subscriber-to-tag';
import { mailChimpSubscribeTrigger } from './lib/triggers/subscribe-trigger';
import { mailChimpUnsubscriberTrigger } from './lib/triggers/unsubscribe-trigger';
import { newCampaignTrigger } from './lib/triggers/new-campaign';
import { linkClickedTrigger } from './lib/triggers/link-clicked';
import { newCustomerTrigger } from './lib/triggers/new-customer';
import { newOrderTrigger } from './lib/triggers/new-order';
import { newTaggedSubscriberTrigger } from './lib/triggers/new-tagged-subscriber';
import { newOrUpdatedSubscriberTrigger } from './lib/triggers/new-or-updated-subscriber';
import { emailOpenedTrigger } from './lib/triggers/email-opened';

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
    createCampaign,
    getCampaignClickReport,
    createAudience,
    addOrUpdateSubscriber,
    createList,
    archiveSubscriber,
    unsubscribeEmail,
    findCampaign,
    findCustomer,
    findTag,
    findSubscriber,

  ],
  triggers: [mailChimpSubscribeTrigger,
     mailChimpUnsubscriberTrigger,
     newCampaignTrigger,
     linkClickedTrigger,
     newCustomerTrigger,
     newOrderTrigger,
     newTaggedSubscriberTrigger,
     newOrUpdatedSubscriberTrigger,
     emailOpenedTrigger

  ],
});
