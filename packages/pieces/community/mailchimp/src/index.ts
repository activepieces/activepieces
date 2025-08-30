import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { mailchimpAuth } from './lib/auth';

// Actions
import { addMemberToList } from './lib/actions/add-member-to-list';
import { addNoteToSubscriber } from './lib/actions/add-note-to-subscriber';
import { removeSubscriberFromTag } from './lib/actions/remove-subscriber-from-tag';
import { updateSubscriberInList } from './lib/actions/update-subscriber-status';
import { addSubscriberToTag } from './lib/actions/add-subscriber-to-tag';
import { createCampaign } from './lib/actions/create-campaign';
import { getCampaignReport } from './lib/actions/get-campaign-report';
import { createAudience } from './lib/actions/create-audience';
import { addOrUpdateSubscriber } from './lib/actions/add-or-update-subscriber';
import { createList } from './lib/actions/create-list';
import { archiveSubscriber } from './lib/actions/archive-subscriber';
import { unsubscribeEmail } from './lib/actions/unsubscribe-email';
import { findCampaign } from './lib/actions/find-campaign';
import { findCustomer } from './lib/actions/find-customer';
import { findTag } from './lib/actions/find-tag';
import { findSubscriber } from './lib/actions/find-subscriber';

// Triggers
import { mailChimpSubscribeTrigger } from './lib/triggers/subscribe-trigger';
import { mailChimpUnsubscriberTrigger } from './lib/triggers/unsubscribe-trigger';
import { mailChimpNewCampaignTrigger } from './lib/triggers/new-campaign-trigger';
import { mailChimpLinkClickedTrigger } from './lib/triggers/link-clicked-trigger';
import { mailChimpEmailOpenedTrigger } from './lib/triggers/email-opened-trigger';
import { mailChimpSubscriberUpdatedTrigger } from './lib/triggers/subscriber-updated-trigger';
import { mailChimpNewCustomerTrigger } from './lib/triggers/new-customer-trigger';
import { mailChimpNewOrderTrigger } from './lib/triggers/new-order-trigger';
import { mailChimpNewSegmentTagSubscriberTrigger } from './lib/triggers/new-segment-tag-subscriber-trigger';
import { mailChimpNewOrUpdatedSubscriberTrigger } from './lib/triggers/new-or-updated-subscriber-trigger';

// Auth re-export for backward compatibility
export { mailchimpAuth };

// Piece definition
export const mailchimp = createPiece({
  displayName: 'Mailchimp',
  description: 'All-in-One integrated marketing platform for managing audiences, sending campaigns, tracking engagement, and automating lifecycle communications.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/mailchimp.png',
  authors: [
    'abdullahranginwala',
    'TaskMagicKyle',
    'kishanprmr',
    'AbdulTheActivePiecer',
    'khaledmashaly',
    'abuaboud',
    'sparkybug',
    'onyedikachi-david',
  ],
  categories: [PieceCategory.MARKETING],
  auth: mailchimpAuth,

  actions: [
    addMemberToList,
    addNoteToSubscriber,
    addSubscriberToTag,
    removeSubscriberFromTag,
    updateSubscriberInList,
    createCampaign,
    getCampaignReport,
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

  triggers: [
    mailChimpSubscribeTrigger,
    mailChimpUnsubscriberTrigger,
    mailChimpNewCampaignTrigger,
    mailChimpLinkClickedTrigger,
    mailChimpEmailOpenedTrigger,
    mailChimpSubscriberUpdatedTrigger,
    mailChimpNewCustomerTrigger,
    mailChimpNewOrderTrigger,
    mailChimpNewSegmentTagSubscriberTrigger,
    mailChimpNewOrUpdatedSubscriberTrigger,
  ],
});
