import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addSubscriberToListAction } from './lib/actions/add-subscriber-to-list';
import { updateSubscriberDetailsAction } from './lib/actions/update-subscriber-details';
import { unsubscribeSubscriberAction } from './lib/actions/unsubscribe-subscriber';
import { findSubscriberAction } from './lib/actions/find-subscriber';
import { newSubscriberAddedTrigger } from './lib/triggers/new-subscriber-added';
import { subscriberUnsubscribedTrigger } from './lib/triggers/subscriber-unsubscribed';
import { newClientTrigger } from './lib/triggers/new-client';

const markdownDescription = `
To use Campaign Monitor, you need to get an API key:
1. Login to your account at https://www.campaignmonitor.com.
2. Navigate to Account Settings.
3. Click on API Keys.
4. Create a new API key or use an existing one.
`;

export const campaignMonitorAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: markdownDescription,
    required: true,
});

export const campaignMonitor = createPiece({
    displayName: 'Campaign Monitor',
    description: 'Email marketing platform for delivering exceptional email campaigns.',
    logoUrl: 'https://cdn.activepieces.com/pieces/campaign-monitor.png',
    authors: ['AnkitSharmaOnGithub','kishanprmr'],
    auth: campaignMonitorAuth,
    actions: [
        addSubscriberToListAction,
        updateSubscriberDetailsAction,
        unsubscribeSubscriberAction,
        findSubscriberAction
    ],
    triggers: [
        newSubscriberAddedTrigger,
        subscriberUnsubscribedTrigger,
        newClientTrigger
    ],
    categories: [PieceCategory.MARKETING],
});
