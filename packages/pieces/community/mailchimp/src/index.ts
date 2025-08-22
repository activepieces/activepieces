import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { addMemberToList } from './lib/actions/add-member-to-list';
import { addNoteToSubscriber } from './lib/actions/add-note-to-subscriber';
import { removeSubscriberFromTag } from './lib/actions/remove-subscriber-from-tag';
import { updateSubscriberInList } from './lib/actions/update-subscriber-status';
import { mailChimpNewCampaignTrigger } from './lib/triggers/new-campaign-trigger';
import { mailChimpLinkClickedTrigger } from './lib/triggers/link-clicked-trigger';
import { mailChimpEmailOpenedTrigger } from './lib/triggers/email-opened-trigger';
import { mailChimpNewOrUpdatedSubscriberTrigger } from './lib/triggers/new-or-updated-subscriber-trigger';
import { mailChimpNewCustomerTrigger } from './lib/triggers/new-customer-trigger';
import { mailChimpNewOrderTrigger } from './lib/triggers/new-order-trigger';
import { mailChimpNewSegmentTagSubscriberTrigger } from './lib/triggers/new-segment-tag-subscriber-trigger';
import { mailChimpAddOrUpdateSubscriber } from './lib/actions/add-or-update-subscriber';
import { mailChimpUnsubscribeEmail } from './lib/actions/unsubscribe-email';
import { mailChimpFindSubscriber } from './lib/actions/find-subscriber';
import { mailChimpFindCampaigns } from './lib/actions/find-campaigns';
import { PieceCategory } from '@activepieces/shared';
import { addSubscriberToTag } from './lib/actions/add-subscriber-to-tag';
import { mailChimpSubscribeTrigger } from './lib/triggers/subscribe-trigger';
import { mailChimpUnsubscriberTrigger } from './lib/triggers/unsubscribe-trigger';

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
  authors: [
    'abdullahranginwala',
    'TaskMagicKyle',
    'kishanprmr',
    'AbdulTheActivePiecer',
    'khaledmashaly',
    'abuaboud',
  ],
  categories: [PieceCategory.MARKETING],
  auth: mailchimpAuth,
  actions: [
    addMemberToList,
    addNoteToSubscriber,
    addSubscriberToTag,
    removeSubscriberFromTag,
    updateSubscriberInList,
    mailChimpAddOrUpdateSubscriber,
    mailChimpUnsubscribeEmail,
    mailChimpFindSubscriber,
    mailChimpFindCampaigns,
  ],
  triggers: [
    mailChimpSubscribeTrigger,
    mailChimpUnsubscriberTrigger,
    mailChimpNewCampaignTrigger,
    mailChimpLinkClickedTrigger,
    mailChimpEmailOpenedTrigger,
    mailChimpNewOrUpdatedSubscriberTrigger,
    mailChimpNewCustomerTrigger,
    mailChimpNewOrderTrigger,
    mailChimpNewSegmentTagSubscriberTrigger,
  ],
});
