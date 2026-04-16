import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { addSubscriptionToAutomationAction } from './lib/actions/add-subscription-to-automation.action'
import { createSubscriptionAction } from './lib/actions/create-subscription.action'
import { listAutomationsAction } from './lib/actions/list-automations.action'
import { listPostsAction } from './lib/actions/list-posts.action'
import { updateSubscriptionAction } from './lib/actions/update-subscription.action'
import { beehiivAuth } from './lib/common/auth'
import { BEEHIIV_API_URL } from './lib/common/client'
import { newPostSentTrigger } from './lib/triggers/new-post-sent.trigger'
import { newSubscriptionConfirmedTrigger } from './lib/triggers/new-subscription-confirmed.trigger'
import { userUnsubscribesTrigger } from './lib/triggers/user-unsubscribes.trigger'

export const beehiiv = createPiece({
    displayName: 'Beehiiv',
    auth: beehiivAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/beehiiv.png',
    authors: ['onyedikachi-david', 'kishanprmr'],
    categories: [PieceCategory.MARKETING],
    actions: [
        createSubscriptionAction,
        updateSubscriptionAction,
        addSubscriptionToAutomationAction,
        listAutomationsAction,
        listPostsAction,
        createCustomApiCallAction({
            auth: beehiivAuth,
            baseUrl: () => BEEHIIV_API_URL,
            authMapping: async (auth) => {
                return {
                    Authorization: `Bearer ${auth.secret_text}`,
                }
            },
        }),
    ],
    triggers: [newPostSentTrigger, userUnsubscribesTrigger, newSubscriptionConfirmedTrigger],
})
