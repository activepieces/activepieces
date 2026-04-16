import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { addUpdateSubscriberAction } from './lib/actions/add-subscriber'
import { addSubscriberToGroupAction } from './lib/actions/add-subscriber-to-group'
import { createCampaignAction } from './lib/actions/create-campaign'
import { removeSubscriberFromGroupAction } from './lib/actions/remove-subscriber-from-group'
import { sendCampaignAction } from './lib/actions/send-campaign'
import { unsubscribeSubscriberAction } from './lib/actions/unsubscribe-subscriber'
import { updateSubscriberAction } from './lib/actions/update-subscriber'
import { senderAuth } from './lib/common/common'
import { newCampaignTrigger } from './lib/triggers/new-campaign'
import { newGroupTrigger } from './lib/triggers/new-group'
import { newSubscriberTrigger } from './lib/triggers/new-subscriber'
import { newSubscriberInGroupTrigger } from './lib/triggers/new-subscriber-in-group'
import { newUnsubscriberTrigger } from './lib/triggers/new-unsubscriber'
import { newUnsubscriberFromGroupTrigger } from './lib/triggers/new-unsubscriber-from-group'
import { updatedSubscriberTrigger } from './lib/triggers/updated-subscriber'

export const sender = createPiece({
    displayName: 'Sender',
    auth: senderAuth,
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/sender.png',
    authors: ['Ani-4x', 'sanket-a11y'],
    categories: [PieceCategory.MARKETING],
    actions: [
        addUpdateSubscriberAction,
        createCampaignAction,
        unsubscribeSubscriberAction,
        addSubscriberToGroupAction,
        removeSubscriberFromGroupAction,
        sendCampaignAction,
        updateSubscriberAction,
    ],
    triggers: [
        newCampaignTrigger,
        newGroupTrigger,
        newSubscriberTrigger,
        newSubscriberInGroupTrigger,
        updatedSubscriberTrigger,
        newUnsubscriberTrigger,
        newUnsubscriberFromGroupTrigger,
    ],
})
