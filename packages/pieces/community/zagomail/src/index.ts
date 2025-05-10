import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

// Actions
import { createSubscriberAction } from './lib/actions/create-subscriber';
import { tagSubscriberAction } from './lib/actions/tag-subscriber';
import { updateSubscriberAction } from './lib/actions/update-subscriber';
import { findSubscriberByEmailAction } from './lib/actions/find-subscriber-by-email';
import { getSubscriberDetailsAction } from './lib/actions/get-subscriber-details';
import { getCampaignDetailsAction } from './lib/actions/get-campaign-details';
import { sendEmailAction } from './lib/actions/send-email';

// Triggers
import { subscriberAddedTrigger } from './lib/triggers/subscriber-added';
import { subscriberUnsubscribedTrigger } from './lib/triggers/subscriber-unsubscribed';
import { subscriberTaggedTrigger } from './lib/triggers/subscriber-tagged';

const markdownDescription = `
To use Zagomail, you need to get an API key:
1. Log in to your account at https://zagomail.com
2. Navigate to Settings > API
3. Generate a new API key
4. Copy the API key
`;

export const zagomailAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
});

export const zagomail = createPiece({
  displayName: 'Zagomail',
  description: 'All-in-one email marketing and automation platform',
  logoUrl: 'https://cdn.activepieces.com/pieces/zagomail.png',
  authors: ['AnkitSharmaOnGithub'],
  auth: zagomailAuth,
  actions: [
    // Write Actions
    createSubscriberAction,
    tagSubscriberAction,
    updateSubscriberAction,

    // Search Actions
    findSubscriberByEmailAction,

    // Read Actions
    getSubscriberDetailsAction,
    getCampaignDetailsAction,

    // Additional Actions
    sendEmailAction
  ],
  triggers: [
    subscriberAddedTrigger,
    subscriberUnsubscribedTrigger,
    subscriberTaggedTrigger
  ],
  categories: [PieceCategory.MARKETING],
});
