import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

// Actions
import { createSubscriberAction } from './lib/actions/create-subscriber';
import { tagSubscriberAction } from './lib/actions/tag-subscriber';
import { updateSubscriberAction } from './lib/actions/update-subscriber';
import { findSubscriberByEmailAction } from './lib/actions/find-subscriber-by-email';
import { getSubscriberDetailsAction } from './lib/actions/get-subscriber-details';
import { getCampaignDetailsAction } from './lib/actions/get-campaign-details';

// Triggers
import { subscriberAddedTrigger } from './lib/triggers/subscriber-added';
import { subscriberUnsubscribedTrigger } from './lib/triggers/subscriber-unsubscribed';
import { subscriberTaggedTrigger } from './lib/triggers/subscriber-tagged';

const markdownDescription = `
To use Zagomail, you need to get your API Public Key:
1. Log in to your account at https://zagomail.com
2. Go to Account > API
3. Your public API key will be available in this section
`;

export const zagomailAuth = PieceAuth.SecretText({
  displayName: 'Public API Key',
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
    getCampaignDetailsAction
  ],
  triggers: [
    subscriberAddedTrigger,
    subscriberUnsubscribedTrigger,
    subscriberTaggedTrigger
  ],
  categories: [PieceCategory.MARKETING],
});
