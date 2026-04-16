import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createAndPushToCampaignAction } from './lib/actions/create-and-push-to-campaign'
import { createOrUpdateContactAction } from './lib/actions/create-or-update-contact'
import { deleteContactAction } from './lib/actions/delete-contact'
import { getContactAction } from './lib/actions/get-contact'
import { markFinishedAction } from './lib/actions/mark-finished'
import { markRepliedAction } from './lib/actions/mark-replied'
import { pushToCampaignAction } from './lib/actions/push-to-campaign'
import { removeFromAllCampaignsAction } from './lib/actions/remove-from-all-campaigns'
import { removeFromCampaignAction } from './lib/actions/remove-from-campaign'
import { replyIoAuth } from './lib/auth'
import { buildReplyIoHeaders, REPLY_IO_API_ROOT } from './lib/common/client'

export const replyIo = createPiece({
    displayName: 'Reply.io',
    description: 'Sales engagement platform for contacts, campaigns, and outbound outreach workflows.',
    auth: replyIoAuth,
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/reply-io.png',
    authors: ['Harmatta', 'sanket-a11y'],
    categories: [PieceCategory.SALES_AND_CRM, PieceCategory.MARKETING],
    actions: [
        getContactAction,
        createOrUpdateContactAction,
        deleteContactAction,
        createAndPushToCampaignAction,
        pushToCampaignAction,
        removeFromCampaignAction,
        removeFromAllCampaignsAction,
        markRepliedAction,
        markFinishedAction,
        createCustomApiCallAction({
            baseUrl: () => REPLY_IO_API_ROOT,
            auth: replyIoAuth,
            authMapping: async (auth) => buildReplyIoHeaders(auth.secret_text),
        }),
    ],
    triggers: [],
})
