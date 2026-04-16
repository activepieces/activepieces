import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createSubscriber } from './lib/actions/create-subscriber'
import { getCampaignDetails } from './lib/actions/get-campaign-details'
import { getSubscriberDetails } from './lib/actions/get-subscriber-details'
import { searchSubscriberByEmail } from './lib/actions/search-subscriber-by-email'
import { tagSubscriber } from './lib/actions/tag-subscriber'
import { updateSubscriber } from './lib/actions/update-subscriber'
import { zagomailAuth } from './lib/auth'
import { zagoMailApiService } from './lib/common/request'
import { addedSubscriber } from './lib/triggers/added-subscriber'
import { taggedSubscriber } from './lib/triggers/tagged-subscriber'
import { unsubscribedSubscriber } from './lib/triggers/unsubscribed-subscriber'

export const zagomail = createPiece({
    displayName: 'Zagomail',
    description: 'All-in-one email marketing and automation platform',
    logoUrl: 'https://cdn.activepieces.com/pieces/zagomail.png',
    authors: ['gs03dev'],
    auth: zagomailAuth,
    actions: [
        createSubscriber,
        tagSubscriber,
        updateSubscriber,

        searchSubscriberByEmail,

        getSubscriberDetails,
        getCampaignDetails,
    ],
    triggers: [addedSubscriber, unsubscribedSubscriber, taggedSubscriber],
    categories: [PieceCategory.MARKETING],
})
